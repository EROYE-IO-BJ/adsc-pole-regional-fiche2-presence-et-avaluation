import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserServiceIds } from "@/lib/authorization";
import { Role } from "@prisma/client";
import type { ServiceKPI } from "@/types/dashboard";

export async function GET() {
  try {
    const user = await requireAuth();

    // Determine which services the user can see
    let serviceWhere: any = {};
    if (user.role === Role.RESPONSABLE_SERVICE) {
      const serviceIds = await getUserServiceIds(user.id);
      serviceWhere.id = { in: serviceIds };
    } else if (user.role === Role.INTERVENANT) {
      // Intervenant sees services of their activities
      const activities = await prisma.activity.findMany({
        where: { intervenantId: user.id },
        select: { serviceId: true },
        distinct: ["serviceId"],
      });
      serviceWhere.id = { in: activities.map((a) => a.serviceId).filter((id): id is string => id !== null) };
    }
    // ADMIN: no filter

    const services = await prisma.service.findMany({
      where: serviceWhere,
      select: {
        id: true,
        name: true,
        activities: {
          where: user.role === Role.INTERVENANT ? { intervenantId: user.id } : {},
          select: {
            id: true,
            _count: { select: { attendances: true, feedbacks: true } },
            feedbacks: {
              select: {
                overallRating: true,
                satisfactionRating: true,
                wouldRecommend: true,
              },
            },
          },
        },
      },
    });

    let globalActivities = 0;
    let globalAttendances = 0;
    let globalFeedbacks = 0;
    let globalRatingsSum = 0;
    let globalRatingsCount = 0;
    let globalRecommend = 0;

    const serviceKPIs: ServiceKPI[] = services.map((s) => {
      const activitiesCount = s.activities.length;
      const attendancesCount = s.activities.reduce((sum, a) => sum + a._count.attendances, 0);
      const feedbacksCount = s.activities.reduce((sum, a) => sum + a._count.feedbacks, 0);

      const allRatings = s.activities.flatMap((a) =>
        a.feedbacks
          .map((f) => f.overallRating || f.satisfactionRating)
          .filter((r): r is number => r !== null)
      );
      const avgRating = allRatings.length > 0
        ? Math.round((allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length) * 10) / 10
        : null;

      const recommendCount = s.activities.reduce(
        (sum, a) => sum + a.feedbacks.filter((f) => f.wouldRecommend).length,
        0
      );

      const feedbackRate = attendancesCount > 0
        ? Math.round((feedbacksCount / attendancesCount) * 100)
        : 0;
      const recommendationRate = feedbacksCount > 0
        ? Math.round((recommendCount / feedbacksCount) * 100)
        : 0;

      // Accumulate for global
      globalActivities += activitiesCount;
      globalAttendances += attendancesCount;
      globalFeedbacks += feedbacksCount;
      globalRatingsSum += allRatings.reduce((sum, r) => sum + r, 0);
      globalRatingsCount += allRatings.length;
      globalRecommend += recommendCount;

      return {
        serviceId: s.id,
        serviceName: s.name,
        activitiesCount,
        attendancesCount,
        feedbacksCount,
        avgRating,
        feedbackRate,
        recommendationRate,
      };
    });

    // Add GLOBAL row
    const globalAvgRating = globalRatingsCount > 0
      ? Math.round((globalRatingsSum / globalRatingsCount) * 10) / 10
      : null;
    const globalFeedbackRate = globalAttendances > 0
      ? Math.round((globalFeedbacks / globalAttendances) * 100)
      : 0;
    const globalRecommendationRate = globalFeedbacks > 0
      ? Math.round((globalRecommend / globalFeedbacks) * 100)
      : 0;

    serviceKPIs.push({
      serviceId: "GLOBAL",
      serviceName: "Global",
      activitiesCount: globalActivities,
      attendancesCount: globalAttendances,
      feedbacksCount: globalFeedbacks,
      avgRating: globalAvgRating,
      feedbackRate: globalFeedbackRate,
      recommendationRate: globalRecommendationRate,
    });

    return NextResponse.json(serviceKPIs);
  } catch (error: any) {
    if (error?.name === "AuthorizationError") {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Dashboard stats by-service error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

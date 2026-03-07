import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserServiceIds, userCanAccessService } from "@/lib/authorization";
import { Role } from "@prisma/client";
import type { DashboardStats } from "@/types/dashboard";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const activityWhere: any = {};

    if (user.role === Role.RESPONSABLE_SERVICE) {
      const serviceIds = await getUserServiceIds(user.id);
      activityWhere.serviceId = { in: serviceIds };
    } else if (user.role === Role.INTERVENANT) {
      activityWhere.intervenantId = user.id;
    }

    // Apply serviceId filter from query params
    const serviceId = request.nextUrl.searchParams.get("serviceId");
    if (serviceId) {
      if (user.role === Role.RESPONSABLE_SERVICE) {
        const hasAccess = await userCanAccessService(user.id, serviceId);
        if (!hasAccess) {
          return NextResponse.json({ error: "Accès insuffisant" }, { status: 403 });
        }
      }
      activityWhere.serviceId = serviceId;
    }

    // Apply programId filter
    const programId = request.nextUrl.searchParams.get("programId");
    if (programId) {
      activityWhere.programId = programId;
    }

    // Apply userId filter (intervenant OR creator)
    const userId = request.nextUrl.searchParams.get("userId");
    if (userId) {
      activityWhere.AND = [
        ...(activityWhere.AND || []),
        { OR: [{ intervenantId: userId }, { createdById: userId }] },
      ];
    }

    const feedbackWhere = { activity: activityWhere };
    const attendanceWhere = { activity: activityWhere };

    const [
      monthlyTrends,
      typeDistribution,
      serviceActivity,
      serviceSatisfaction,
      topPrograms,
      topIntervenants,
      topActivities,
      ratingDistribution,
      clarityRate,
      recommendationRate,
    ] = await Promise.all([
      getMonthlyTrends(activityWhere),
      getTypeDistribution(activityWhere),
      getServiceActivity(activityWhere),
      getServiceSatisfaction(activityWhere),
      getTopPrograms(activityWhere),
      getTopIntervenants(activityWhere),
      getTopActivities(activityWhere),
      getRatingDistribution(feedbackWhere),
      getClarityRate(feedbackWhere),
      getRecommendationRate(feedbackWhere),
    ]);

    const stats: DashboardStats = {
      monthlyTrends,
      typeDistribution,
      serviceActivity,
      serviceSatisfaction,
      topPrograms,
      topIntervenants,
      topActivities,
      ratingDistribution,
      clarityRate,
      recommendationRate,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    if (error?.name === "AuthorizationError") {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// --- Helper functions ---

const MONTH_LABELS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc",
];

async function getMonthlyTrends(activityWhere: any) {
  const activities = await prisma.activity.findMany({
    where: activityWhere,
    select: {
      id: true,
      startDate: true,
    },
  });

  const activityIds = activities.map((a) => a.id);
  if (activityIds.length === 0) return [];

  const [attendances, feedbacks] = await Promise.all([
    prisma.attendance.findMany({
      where: { activityId: { in: activityIds } },
      select: { createdAt: true },
    }),
    prisma.feedback.findMany({
      where: { activityId: { in: activityIds } },
      select: { createdAt: true },
    }),
  ]);

  const monthMap = new Map<string, { attendances: number; feedbacks: number }>();

  for (const a of attendances) {
    const key = `${a.createdAt.getFullYear()}-${String(a.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthMap.get(key) || { attendances: 0, feedbacks: 0 };
    entry.attendances++;
    monthMap.set(key, entry);
  }

  for (const f of feedbacks) {
    const key = `${f.createdAt.getFullYear()}-${String(f.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthMap.get(key) || { attendances: 0, feedbacks: 0 };
    entry.feedbacks++;
    monthMap.set(key, entry);
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const [year, m] = month.split("-");
      return {
        month,
        label: `${MONTH_LABELS[parseInt(m) - 1]} ${year}`,
        attendances: data.attendances,
        feedbacks: data.feedbacks,
      };
    });
}

async function getTypeDistribution(activityWhere: any) {
  const groups = await prisma.activity.groupBy({
    by: ["type"],
    where: activityWhere,
    _count: { id: true },
  });

  return [
    { type: "FORMATION" as const, count: groups.find((g) => g.type === "FORMATION")?._count.id || 0 },
    { type: "SERVICE" as const, count: groups.find((g) => g.type === "SERVICE")?._count.id || 0 },
  ];
}

async function getServiceActivity(activityWhere: any) {
  const services = await prisma.service.findMany({
    select: {
      name: true,
      activities: {
        where: activityWhere,
        select: {
          _count: { select: { attendances: true, feedbacks: true } },
        },
      },
    },
  });

  return services
    .map((s) => ({
      service: s.name,
      attendances: s.activities.reduce((sum, a) => sum + a._count.attendances, 0),
      feedbacks: s.activities.reduce((sum, a) => sum + a._count.feedbacks, 0),
    }))
    .filter((s) => s.attendances > 0 || s.feedbacks > 0)
    .sort((a, b) => b.attendances - a.attendances);
}

async function getServiceSatisfaction(activityWhere: any) {
  const services = await prisma.service.findMany({
    select: {
      name: true,
      activities: {
        where: activityWhere,
        select: {
          feedbacks: {
            select: { overallRating: true, satisfactionRating: true },
          },
        },
      },
    },
  });

  return services
    .map((s) => {
      const allRatings = s.activities.flatMap((a) =>
        a.feedbacks
          .map((f) => f.overallRating || f.satisfactionRating)
          .filter((r): r is number => r !== null)
      );
      const avg = allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
        : 0;
      return { service: s.name, avgRating: Math.round(avg * 10) / 10 };
    })
    .filter((s) => s.avgRating > 0)
    .sort((a, b) => b.avgRating - a.avgRating);
}

async function getTopPrograms(activityWhere: any) {
  const programs = await prisma.program.findMany({
    select: {
      id: true,
      name: true,
      service: { select: { name: true } },
      activities: {
        where: activityWhere,
        select: {
          _count: { select: { attendances: true } },
          feedbacks: { select: { overallRating: true, satisfactionRating: true } },
        },
      },
    },
  });

  return programs
    .map((p) => {
      const participants = p.activities.reduce((sum, a) => sum + a._count.attendances, 0);
      const ratings = p.activities.flatMap((a) =>
        a.feedbacks
          .map((f) => f.overallRating || f.satisfactionRating)
          .filter((r): r is number => r !== null)
      );
      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
        : null;
      return {
        id: p.id,
        name: p.name,
        serviceName: p.service?.name || "",
        participants,
        avgRating,
      };
    })
    .filter((p) => p.participants > 0)
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 5);
}

async function getTopIntervenants(activityWhere: any) {
  const intervenants = await prisma.user.findMany({
    where: {
      role: Role.INTERVENANT,
      intervenantActivities: { some: activityWhere },
    },
    select: {
      id: true,
      name: true,
      intervenantActivities: {
        where: activityWhere,
        select: {
          feedbacks: { select: { overallRating: true, satisfactionRating: true } },
        },
      },
      _count: {
        select: {
          intervenantActivities: { where: activityWhere },
        },
      },
    },
  });

  return intervenants
    .map((u) => {
      const ratings = u.intervenantActivities.flatMap((a) =>
        a.feedbacks
          .map((f) => f.overallRating || f.satisfactionRating)
          .filter((r): r is number => r !== null)
      );
      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
        : null;
      return {
        id: u.id,
        name: u.name,
        activitiesCount: u._count.intervenantActivities,
        avgRating,
      };
    })
    .sort((a, b) => b.activitiesCount - a.activitiesCount)
    .slice(0, 5);
}

async function getTopActivities(activityWhere: any) {
  const activities = await prisma.activity.findMany({
    where: {
      ...activityWhere,
      feedbacks: { some: {} },
    },
    select: {
      id: true,
      title: true,
      type: true,
      service: { select: { name: true } },
      feedbacks: { select: { overallRating: true, satisfactionRating: true } },
      _count: { select: { feedbacks: true } },
    },
  });

  return activities
    .map((a) => {
      const ratings = a.feedbacks
        .map((f) => f.overallRating || f.satisfactionRating)
        .filter((r): r is number => r !== null);
      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
        : 0;
      return {
        id: a.id,
        title: a.title,
        serviceName: a.service?.name || "",
        type: a.type as "FORMATION" | "SERVICE",
        avgRating,
        feedbacksCount: a._count.feedbacks,
      };
    })
    .filter((a) => a.avgRating > 0)
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 5);
}

async function getRatingDistribution(feedbackWhere: any) {
  const results: { rating: number; count: number }[] = [];

  for (let rating = 1; rating <= 5; rating++) {
    const count = await prisma.feedback.count({
      where: {
        ...feedbackWhere,
        OR: [
          { overallRating: rating },
          { satisfactionRating: rating },
        ],
      },
    });
    results.push({ rating, count });
  }

  return results;
}

async function getClarityRate(feedbackWhere: any) {
  const [yes, no] = await Promise.all([
    prisma.feedback.count({
      where: { ...feedbackWhere, feedbackType: "SERVICE", informationClarity: true },
    }),
    prisma.feedback.count({
      where: { ...feedbackWhere, feedbackType: "SERVICE", informationClarity: false },
    }),
  ]);

  return { yes, no, total: yes + no };
}

async function getRecommendationRate(feedbackWhere: any) {
  const [yes, no] = await Promise.all([
    prisma.feedback.count({
      where: { ...feedbackWhere, wouldRecommend: true },
    }),
    prisma.feedback.count({
      where: { ...feedbackWhere, wouldRecommend: false },
    }),
  ]);

  return { yes, no, total: yes + no };
}

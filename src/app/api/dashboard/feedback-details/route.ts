import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserServiceIds, userCanAccessService } from "@/lib/authorization";
import { Role } from "@prisma/client";

// GET /api/dashboard/feedback-details?filter=rating&value=3&serviceId=xxx
// GET /api/dashboard/feedback-details?filter=clarity&value=yes&serviceId=xxx
// GET /api/dashboard/feedback-details?filter=recommendation&value=yes&serviceId=xxx
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

    const filter = request.nextUrl.searchParams.get("filter");
    const value = request.nextUrl.searchParams.get("value");

    if (!filter || !value) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const feedbackWhere: any = { activity: activityWhere };

    if (filter === "rating") {
      const rating = parseInt(value);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ error: "Note invalide" }, { status: 400 });
      }
      feedbackWhere.OR = [
        { overallRating: rating },
        { satisfactionRating: rating },
      ];
    } else if (filter === "clarity") {
      feedbackWhere.feedbackType = "SERVICE";
      feedbackWhere.informationClarity = value === "yes";
    } else if (filter === "recommendation") {
      feedbackWhere.wouldRecommend = value === "yes";
    } else {
      return NextResponse.json({ error: "Filtre invalide" }, { status: 400 });
    }

    const feedbacks = await prisma.feedback.findMany({
      where: feedbackWhere,
      select: {
        id: true,
        participantName: true,
        participantEmail: true,
        overallRating: true,
        satisfactionRating: true,
        contentRating: true,
        organizationRating: true,
        wouldRecommend: true,
        informationClarity: true,
        comment: true,
        suggestions: true,
        improvementSuggestion: true,
        feedbackType: true,
        createdAt: true,
        activity: {
          select: { id: true, title: true, type: true },
        },
        session: {
          select: { id: true, title: true, startDate: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(feedbacks);
  } catch (error: any) {
    if (error?.name === "AuthorizationError") {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Feedback details error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserServiceIds, handleAuthError } from "@/lib/authorization";
import { Role } from "@prisma/client";

// GET /api/retours/[activityId] - List feedbacks for an activity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const { activityId } = await params;

  // Verify activity access based on role
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });

  if (!activity) {
    return NextResponse.json({ error: "Activité non trouvée" }, { status: 404 });
  }

  let hasAccess = false;
  if (user.role === Role.ADMIN) {
    hasAccess = true;
  } else if (user.role === Role.RESPONSABLE_SERVICE) {
    const serviceIds = await getUserServiceIds(user.id);
    hasAccess = serviceIds.includes(activity.serviceId);
  } else if (user.role === Role.INTERVENANT) {
    hasAccess = activity.intervenantId === user.id;
  }

  if (!hasAccess) {
    return NextResponse.json({ error: "Accès insuffisant" }, { status: 403 });
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const feedbackWhere = {
    activityId,
    ...(sessionId && { sessionId }),
  };

  const feedbacks = await prisma.feedback.findMany({
    where: feedbackWhere,
    orderBy: { createdAt: "desc" },
    include: {
      session: { select: { id: true, title: true, startDate: true } },
    },
  });

  // Calculate stats based on activity type
  if (activity.type === "SERVICE") {
    const serviceStats = await prisma.feedback.aggregate({
      where: feedbackWhere,
      _avg: { satisfactionRating: true },
      _count: true,
    });

    const clarityCount = await prisma.feedback.count({
      where: { ...feedbackWhere, informationClarity: true },
    });

    return NextResponse.json({
      feedbacks,
      activityType: "SERVICE",
      stats: {
        count: serviceStats._count,
        avgSatisfaction: serviceStats._avg.satisfactionRating,
        clarityPercent:
          serviceStats._count > 0
            ? Math.round((clarityCount / serviceStats._count) * 100)
            : 0,
      },
    });
  }

  // FORMATION stats
  const stats = await prisma.feedback.aggregate({
    where: feedbackWhere,
    _avg: {
      overallRating: true,
      contentRating: true,
      organizationRating: true,
    },
    _count: true,
  });

  const recommendCount = await prisma.feedback.count({
    where: { ...feedbackWhere, wouldRecommend: true },
  });

  return NextResponse.json({
    feedbacks,
    activityType: "FORMATION",
    stats: {
      count: stats._count,
      avgOverall: stats._avg.overallRating,
      avgContent: stats._avg.contentRating,
      avgOrganization: stats._avg.organizationRating,
      recommendPercent:
        stats._count > 0
          ? Math.round((recommendCount / stats._count) * 100)
          : 0,
    },
  });
}

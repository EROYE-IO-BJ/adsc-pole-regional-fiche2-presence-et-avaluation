import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/authorization";
import { Role } from "@prisma/client";

// GET /api/retours/[activityId] - List feedbacks for an activity
export async function GET(
  _request: NextRequest,
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

  const hasAccess =
    user.role === Role.ADMIN ||
    (user.role === Role.RESPONSABLE_SERVICE && activity.serviceId === user.serviceId) ||
    (user.role === Role.INTERVENANT && activity.intervenantId === user.id);

  if (!hasAccess) {
    return NextResponse.json({ error: "Accès insuffisant" }, { status: 403 });
  }

  const feedbacks = await prisma.feedback.findMany({
    where: { activityId },
    orderBy: { createdAt: "desc" },
  });

  // Calculate stats
  const stats = await prisma.feedback.aggregate({
    where: { activityId },
    _avg: {
      overallRating: true,
      contentRating: true,
      organizationRating: true,
    },
    _count: true,
  });

  const recommendCount = await prisma.feedback.count({
    where: { activityId, wouldRecommend: true },
  });

  return NextResponse.json({
    feedbacks,
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

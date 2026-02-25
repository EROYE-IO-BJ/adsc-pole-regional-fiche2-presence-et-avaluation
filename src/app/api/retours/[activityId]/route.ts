import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/retours/[activityId] - Admin endpoint to list feedbacks
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { activityId } = await params;
  const serviceId = (session.user as any).serviceId;

  // Verify activity belongs to user's service
  const activity = await prisma.activity.findFirst({
    where: { id: activityId, serviceId },
  });

  if (!activity) {
    return NextResponse.json({ error: "Activité non trouvée" }, { status: 404 });
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

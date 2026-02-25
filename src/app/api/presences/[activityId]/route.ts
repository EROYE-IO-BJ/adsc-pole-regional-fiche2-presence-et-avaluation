import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/presences/[activityId] - Admin endpoint to list attendance
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

  const attendances = await prisma.attendance.findMany({
    where: { activityId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(attendances);
}

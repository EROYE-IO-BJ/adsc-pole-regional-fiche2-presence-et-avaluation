import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/authorization";
import { Role } from "@prisma/client";

// GET /api/presences/[activityId] - List attendance for an activity
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

  // Check permissions
  const hasAccess =
    user.role === Role.ADMIN ||
    (user.role === Role.RESPONSABLE_SERVICE && activity.serviceId === user.serviceId) ||
    (user.role === Role.INTERVENANT && activity.intervenantId === user.id);

  if (!hasAccess) {
    return NextResponse.json({ error: "Accès insuffisant" }, { status: 403 });
  }

  const attendances = await prisma.attendance.findMany({
    where: { activityId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(attendances);
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserServiceIds, handleAuthError } from "@/lib/authorization";
import { Role } from "@prisma/client";

// GET /api/presences/[activityId] - List attendance for an activity
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

  // Check permissions
  let hasAccess = false;
  if (user.role === Role.ADMIN) {
    hasAccess = true;
  } else if (user.role === Role.RESPONSABLE_SERVICE) {
    const serviceIds = await getUserServiceIds(user.id);
    hasAccess = activity.serviceId != null && serviceIds.includes(activity.serviceId);
  } else if (user.role === Role.INTERVENANT) {
    hasAccess = activity.intervenantId === user.id;
  }

  if (!hasAccess) {
    return NextResponse.json({ error: "Accès insuffisant" }, { status: 403 });
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId");

  const attendances = await prisma.attendance.findMany({
    where: {
      activityId,
      ...(sessionId && { sessionId }),
    },
    orderBy: [{ importOrder: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    include: {
      session: { select: { id: true, title: true, startDate: true } },
    },
  });

  return NextResponse.json(attendances);
}

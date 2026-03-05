import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, userCanAccessService, handleAuthError } from "@/lib/authorization";
import { createSessionSchema } from "@/lib/validations/session";
import { Role } from "@prisma/client";

// GET /api/sessions?activityId=xxx - List sessions for an activity
export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireRole(Role.ADMIN, Role.RESPONSABLE_SERVICE, Role.INTERVENANT);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const activityId = request.nextUrl.searchParams.get("activityId");
  if (!activityId) {
    return NextResponse.json({ error: "activityId requis" }, { status: 400 });
  }

  const sessions = await prisma.activitySession.findMany({
    where: { activityId },
    orderBy: { date: "asc" },
    include: {
      intervenant: { select: { id: true, name: true } },
      _count: { select: { attendances: true, feedbacks: true } },
    },
  });

  return NextResponse.json(sessions);
}

// POST /api/sessions - Create a session
export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireRole(Role.ADMIN, Role.RESPONSABLE_SERVICE);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const body = await request.json();
  const validation = createSessionSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  // Verify activity exists and user has access
  const activity = await prisma.activity.findUnique({
    where: { id: validation.data.activityId },
  });

  if (!activity) {
    return NextResponse.json({ error: "Activité non trouvée" }, { status: 404 });
  }

  if (activity.type === "SERVICE") {
    return NextResponse.json(
      { error: "Les activités SERVICE ne supportent pas plusieurs séances" },
      { status: 400 }
    );
  }

  if (user.role === Role.RESPONSABLE_SERVICE) {
    const hasAccess = await userCanAccessService(user.id, activity.serviceId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès insuffisant" }, { status: 403 });
    }
  }

  const session = await prisma.activitySession.create({
    data: {
      title: validation.data.title || null,
      date: new Date(validation.data.date),
      location: validation.data.location || null,
      intervenantId: validation.data.intervenantId || activity.intervenantId || null,
      activityId: validation.data.activityId,
    },
    include: {
      intervenant: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(session, { status: 201 });
}

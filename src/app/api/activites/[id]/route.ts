import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/authorization";
import { updateActivitySchema } from "@/lib/validations/activity";
import { Role } from "@prisma/client";

function canAccessActivity(userRole: Role, userServiceId: string | null, userId: string, activity: any): boolean {
  switch (userRole) {
    case Role.ADMIN:
      return true;
    case Role.RESPONSABLE_SERVICE:
      return activity.serviceId === userServiceId;
    case Role.INTERVENANT:
      return activity.intervenantId === userId;
    case Role.PARTICIPANT:
      return activity.status === "ACTIVE";
    default:
      return false;
  }
}

// GET /api/activites/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await params;

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      _count: { select: { attendances: true, feedbacks: true, registrations: true } },
      createdBy: { select: { name: true } },
      intervenant: { select: { name: true } },
      service: { select: { name: true } },
    },
  });

  if (!activity || !canAccessActivity(user.role, user.serviceId, user.id, activity)) {
    return NextResponse.json({ error: "Activité non trouvée" }, { status: 404 });
  }

  return NextResponse.json(activity);
}

// PUT /api/activites/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  // Only ADMIN and RESPONSABLE_SERVICE can edit
  if (user.role !== Role.ADMIN && user.role !== Role.RESPONSABLE_SERVICE) {
    return NextResponse.json({ error: "Accès insuffisant" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.activity.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Activité non trouvée" }, { status: 404 });
  }

  // Responsable can only edit activities of their service
  if (user.role === Role.RESPONSABLE_SERVICE && existing.serviceId !== user.serviceId) {
    return NextResponse.json({ error: "Activité non trouvée" }, { status: 404 });
  }

  const body = await request.json();
  const validation = updateActivitySchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const activity = await prisma.activity.update({
    where: { id },
    data: {
      ...(validation.data.title && { title: validation.data.title }),
      ...(validation.data.description !== undefined && {
        description: validation.data.description || null,
      }),
      ...(validation.data.date && { date: new Date(validation.data.date) }),
      ...(validation.data.location !== undefined && {
        location: validation.data.location || null,
      }),
      ...(validation.data.status && { status: validation.data.status }),
      ...(validation.data.requiresRegistration !== undefined && {
        requiresRegistration: validation.data.requiresRegistration,
      }),
      ...(validation.data.intervenantId !== undefined && {
        intervenantId: validation.data.intervenantId || null,
      }),
    },
  });

  return NextResponse.json(activity);
}

// DELETE /api/activites/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  if (user.role !== Role.ADMIN && user.role !== Role.RESPONSABLE_SERVICE) {
    return NextResponse.json({ error: "Accès insuffisant" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.activity.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Activité non trouvée" }, { status: 404 });
  }

  if (user.role === Role.RESPONSABLE_SERVICE && existing.serviceId !== user.serviceId) {
    return NextResponse.json({ error: "Activité non trouvée" }, { status: 404 });
  }

  await prisma.activity.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

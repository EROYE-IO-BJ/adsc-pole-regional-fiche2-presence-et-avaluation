import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, userCanAccessService, handleAuthError } from "@/lib/authorization";
import { updateSessionSchema } from "@/lib/validations/session";
import { Role } from "@prisma/client";

// GET /api/sessions/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireRole(Role.ADMIN, Role.RESPONSABLE_SERVICE, Role.INTERVENANT);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await params;

  const session = await prisma.activitySession.findUnique({
    where: { id },
    include: {
      activity: { select: { serviceId: true, title: true } },
      intervenant: { select: { id: true, name: true } },
      _count: { select: { attendances: true, feedbacks: true } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Séance non trouvée" }, { status: 404 });
  }

  return NextResponse.json(session);
}

// PUT /api/sessions/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireRole(Role.ADMIN, Role.RESPONSABLE_SERVICE);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await params;

  const existing = await prisma.activitySession.findUnique({
    where: { id },
    include: { activity: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Séance non trouvée" }, { status: 404 });
  }

  if (user.role === Role.RESPONSABLE_SERVICE) {
    const hasAccess = await userCanAccessService(user.id, existing.activity.serviceId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès insuffisant" }, { status: 403 });
    }
  }

  const body = await request.json();
  const validation = updateSessionSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const session = await prisma.activitySession.update({
    where: { id },
    data: {
      ...(validation.data.title !== undefined && { title: validation.data.title || null }),
      ...(validation.data.date && { date: new Date(validation.data.date) }),
      ...(validation.data.location !== undefined && { location: validation.data.location || null }),
      ...(validation.data.intervenantId !== undefined && {
        intervenantId: validation.data.intervenantId || null,
      }),
    },
    include: {
      intervenant: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(session);
}

// DELETE /api/sessions/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireRole(Role.ADMIN, Role.RESPONSABLE_SERVICE);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await params;

  const existing = await prisma.activitySession.findUnique({
    where: { id },
    include: { activity: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Séance non trouvée" }, { status: 404 });
  }

  if (user.role === Role.RESPONSABLE_SERVICE) {
    const hasAccess = await userCanAccessService(user.id, existing.activity.serviceId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès insuffisant" }, { status: 403 });
    }
  }

  await prisma.activitySession.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

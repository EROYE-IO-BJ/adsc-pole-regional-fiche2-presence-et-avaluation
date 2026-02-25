import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, handleAuthError } from "@/lib/authorization";
import { createActivitySchema } from "@/lib/validations/activity";
import { Role } from "@prisma/client";

// GET /api/activites - List activities based on user role
export async function GET() {
  let user;
  try {
    user = await requireAuth();
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  let where: any = {};

  switch (user.role) {
    case Role.ADMIN:
      // Admin sees all activities
      break;
    case Role.RESPONSABLE_SERVICE:
      // Responsable sees activities of their service
      where = { serviceId: user.serviceId };
      break;
    case Role.INTERVENANT:
      // Intervenant sees activities they're assigned to
      where = { intervenantId: user.id };
      break;
    case Role.PARTICIPANT:
      // Participant sees active activities
      where = { status: "ACTIVE" };
      break;
  }

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      _count: { select: { attendances: true, feedbacks: true, registrations: true } },
      createdBy: { select: { name: true } },
      intervenant: { select: { name: true } },
      service: { select: { name: true } },
    },
  });

  return NextResponse.json(activities);
}

// POST /api/activites - Create a new activity
export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireRole(Role.ADMIN, Role.RESPONSABLE_SERVICE);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const body = await request.json();
  const validation = createActivitySchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  // Determine serviceId
  let serviceId: string;
  if (user.role === Role.ADMIN) {
    // Admin must provide serviceId in the body
    serviceId = body.serviceId;
    if (!serviceId) {
      return NextResponse.json(
        { error: "L'ID du service est requis" },
        { status: 400 }
      );
    }
  } else {
    serviceId = user.serviceId!;
  }

  const activity = await prisma.activity.create({
    data: {
      title: validation.data.title,
      description: validation.data.description || null,
      date: new Date(validation.data.date),
      location: validation.data.location || null,
      status: validation.data.status,
      requiresRegistration: validation.data.requiresRegistration,
      intervenantId: validation.data.intervenantId || null,
      serviceId,
      createdById: user.id,
    },
  });

  return NextResponse.json(activity, { status: 201 });
}

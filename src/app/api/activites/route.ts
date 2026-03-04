import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, getUserServiceIds, userCanAccessService, handleAuthError } from "@/lib/authorization";
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
    case Role.RESPONSABLE_SERVICE: {
      const serviceIds = await getUserServiceIds(user.id);
      where = { serviceId: { in: serviceIds } };
      break;
    }
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
    serviceId = body.serviceId;
    if (!serviceId) {
      return NextResponse.json(
        { error: "L'ID du service est requis" },
        { status: 400 }
      );
    }
  } else {
    // RESPONSABLE_SERVICE: must provide serviceId and must have access
    serviceId = body.serviceId;
    if (!serviceId) {
      // Fallback: use first service
      const serviceIds = await getUserServiceIds(user.id);
      if (serviceIds.length === 0) {
        return NextResponse.json(
          { error: "Aucun service associé" },
          { status: 400 }
        );
      }
      serviceId = serviceIds[0];
    } else {
      const hasAccess = await userCanAccessService(user.id, serviceId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: "Accès insuffisant à ce service" },
          { status: 403 }
        );
      }
    }
  }

  const activity = await prisma.activity.create({
    data: {
      title: validation.data.title,
      description: validation.data.description || null,
      date: new Date(validation.data.date),
      location: validation.data.location || null,
      status: validation.data.status,
      type: validation.data.type,
      requiresRegistration: validation.data.requiresRegistration,
      intervenantId: validation.data.intervenantId || null,
      programId: validation.data.programId || null,
      serviceId,
      createdById: user.id,
    },
  });

  return NextResponse.json(activity, { status: 201 });
}

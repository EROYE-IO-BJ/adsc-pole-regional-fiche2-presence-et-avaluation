import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, getUserServiceIds, userCanAccessService, handleAuthError } from "@/lib/authorization";
import { createActivitySchema } from "@/lib/validations/activity";
import { generateSessions } from "@/lib/recurrence";
import { Role } from "@prisma/client";
import type { RecurrenceConfig } from "@/lib/recurrence";

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
    orderBy: { startDate: "desc" },
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

  // Determine serviceId (now optional)
  let serviceId: string | undefined = body.serviceId || undefined;
  if (serviceId && user.role === Role.RESPONSABLE_SERVICE) {
    const hasAccess = await userCanAccessService(user.id, serviceId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Accès insuffisant à ce service" },
        { status: 403 }
      );
    }
  } else if (!serviceId && user.role === Role.RESPONSABLE_SERVICE) {
    // Fallback: use first service
    const serviceIds = await getUserServiceIds(user.id);
    if (serviceIds.length > 0) {
      serviceId = serviceIds[0];
    }
  }

  const startDate = new Date(validation.data.startDate);
  const endDate = new Date(validation.data.endDate);
  const { sessionFrequency, recurrenceConfig } = validation.data;

  // Build session creation data based on frequency
  let sessionsData: any[];

  if (["DAILY", "WEEKLY", "MONTHLY"].includes(sessionFrequency) && recurrenceConfig) {
    const generated = generateSessions(startDate, endDate, recurrenceConfig as RecurrenceConfig);

    if (generated.length === 0) {
      return NextResponse.json(
        { error: "Aucune séance générée pour cette configuration de récurrence" },
        { status: 400 }
      );
    }

    sessionsData = generated.map((s, i) => ({
      title: s.title,
      startDate: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      location: validation.data.location || null,
      intervenantId: validation.data.intervenantId || null,
      isDefault: i === 0,
    }));
  } else {
    // UNIQUE or CONFIGURABLE → 1 session
    sessionsData = [
      {
        title: validation.data.type === "SERVICE" ? null : "Séance 1",
        startDate,
        location: validation.data.location || null,
        intervenantId: validation.data.intervenantId || null,
        isDefault: true,
      },
    ];
  }

  const activity = await prisma.activity.create({
    data: {
      title: validation.data.title,
      description: validation.data.description || null,
      startDate,
      endDate,
      location: validation.data.location || null,
      status: validation.data.status,
      type: validation.data.type,
      requiresRegistration: validation.data.requiresRegistration,
      intervenantId: validation.data.intervenantId || null,
      programId: validation.data.programId,
      serviceId: serviceId || null,
      createdById: user.id,
      sessionFrequency,
      recurrenceConfig: recurrenceConfig ?? undefined,
      sessions: {
        create: sessionsData,
      },
    },
    include: {
      sessions: true,
    },
  });

  return NextResponse.json(activity, { status: 201 });
}

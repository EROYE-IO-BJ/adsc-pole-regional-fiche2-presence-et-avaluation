import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleAuthError } from "@/lib/authorization";
import { createRegistrationSchema } from "@/lib/validations/registration";
import { Role } from "@prisma/client";

// GET /api/registrations - List participant's registrations
export async function GET() {
  let user;
  try {
    user = await requireRole(Role.PARTICIPANT);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const registrations = await prisma.registration.findMany({
    where: { userId: user.id },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          date: true,
          location: true,
          status: true,
          service: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(registrations);
}

// POST /api/registrations - Register for an activity
export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireRole(Role.PARTICIPANT);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const body = await request.json();
  const validation = createRegistrationSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { activityId } = validation.data;

  // Verify activity exists and requires registration
  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) {
    return NextResponse.json({ error: "Activité non trouvée" }, { status: 404 });
  }

  if (!activity.requiresRegistration) {
    return NextResponse.json(
      { error: "Cette activité ne requiert pas d'inscription préalable" },
      { status: 400 }
    );
  }

  if (activity.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Cette activité n'est pas ouverte aux inscriptions" },
      { status: 400 }
    );
  }

  // Check for duplicate
  const existing = await prisma.registration.findUnique({
    where: { userId_activityId: { userId: user.id, activityId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Vous êtes déjà inscrit(e) à cette activité" },
      { status: 409 }
    );
  }

  const registration = await prisma.registration.create({
    data: { userId: user.id, activityId },
  });

  return NextResponse.json(registration, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAttendanceSchema } from "@/lib/validations/attendance";

// POST /api/presences - Public endpoint to submit attendance
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = createAttendanceSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  // Check if this is a session access token
  const sessionRecord = await prisma.activitySession.findUnique({
    where: { accessToken: validation.data.accessToken },
    include: { activity: true },
  });

  let activity;
  let sessionId: string;

  if (sessionRecord) {
    activity = sessionRecord.activity;
    sessionId = sessionRecord.id;
  } else {
    // Find the activity by access token
    activity = await prisma.activity.findUnique({
      where: { accessToken: validation.data.accessToken },
      include: { sessions: { where: { isDefault: true }, take: 1 } },
    });

    if (activity) {
      const defaultSession = activity.sessions[0];
      if (!defaultSession) {
        return NextResponse.json(
          { error: "Aucune séance par défaut trouvée" },
          { status: 500 }
        );
      }
      sessionId = defaultSession.id;
    } else {
      sessionId = "";
    }
  }

  if (!activity) {
    return NextResponse.json(
      { error: "Activité non trouvée" },
      { status: 404 }
    );
  }

  if (activity.status === "CLOSED") {
    return NextResponse.json(
      { error: "Cette activité est clôturée" },
      { status: 400 }
    );
  }

  // Check if activity requires registration
  if (activity.requiresRegistration) {
    const registeredUser = await prisma.user.findUnique({
      where: { email: validation.data.email },
    });

    if (registeredUser) {
      const registration = await prisma.registration.findUnique({
        where: {
          userId_activityId: {
            userId: registeredUser.id,
            activityId: activity.id,
          },
        },
      });

      if (!registration) {
        return NextResponse.json(
          { error: "Inscription préalable requise pour cette activité. Veuillez vous inscrire d'abord." },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Inscription préalable requise pour cette activité. Veuillez créer un compte et vous inscrire." },
        { status: 403 }
      );
    }
  }

  // Check for duplicate
  const existing = await prisma.attendance.findUnique({
    where: {
      sessionId_email: {
        sessionId,
        email: validation.data.email,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Vous êtes déjà inscrit(e) pour cette séance" },
      { status: 409 }
    );
  }

  const attendance = await prisma.attendance.create({
    data: {
      firstName: validation.data.firstName,
      lastName: validation.data.lastName,
      email: validation.data.email,
      phone: validation.data.phone || null,
      organization: validation.data.organization || null,
      signature: validation.data.signature || null,
      activityId: activity.id,
      sessionId,
    },
  });

  return NextResponse.json(attendance, { status: 201 });
}

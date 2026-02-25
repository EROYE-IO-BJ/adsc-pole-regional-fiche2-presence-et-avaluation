import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleAuthError } from "@/lib/authorization";
import { Role } from "@prisma/client";

// GET /api/participant/history - Participant attendance and feedback history
export async function GET() {
  let user;
  try {
    user = await requireRole(Role.PARTICIPANT);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  // Find attendances by participant email
  const attendances = await prisma.attendance.findMany({
    where: { email: user.email },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          date: true,
          location: true,
          service: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Find feedbacks by participant email
  const feedbacks = await prisma.feedback.findMany({
    where: { participantEmail: user.email },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          date: true,
          service: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ attendances, feedbacks });
}

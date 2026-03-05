import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/activites/by-token?token=xxx - Get activity type by access token (public)
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token requis" }, { status: 400 });
  }

  // Check if it's a session token
  const sessionRecord = await prisma.activitySession.findUnique({
    where: { accessToken: token },
    include: {
      activity: {
        select: {
          type: true,
          sessions: {
            orderBy: { date: "asc" as const },
            select: { id: true, title: true, date: true, accessToken: true, isDefault: true },
          },
        },
      },
    },
  });

  if (sessionRecord) {
    return NextResponse.json({
      type: sessionRecord.activity.type,
      sessionId: sessionRecord.id,
      sessions: sessionRecord.activity.sessions,
    });
  }

  // Check if it's an activity token
  const activity = await prisma.activity.findUnique({
    where: { accessToken: token },
    select: {
      type: true,
      sessions: {
        orderBy: { date: "asc" },
        select: { id: true, title: true, date: true, accessToken: true, isDefault: true },
      },
    },
  });

  if (!activity) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }

  return NextResponse.json({
    type: activity.type,
    sessions: activity.sessions,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserServiceIds, handleAuthError } from "@/lib/authorization";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
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

  try {
    const { activityId, sessionId, participants } = await request.json();

    if (!activityId || !Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json(
        { error: "activityId et participants sont requis" },
        { status: 400 }
      );
    }

    // Verify activity exists and user has access
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { sessions: { where: { isDefault: true }, take: 1 } },
    });

    if (!activity) {
      return NextResponse.json({ error: "Activité non trouvée" }, { status: 404 });
    }

    if (user.role === Role.RESPONSABLE_SERVICE) {
      const serviceIds = await getUserServiceIds(user.id);
      if (!serviceIds.includes(activity.serviceId)) {
        return NextResponse.json({ error: "Accès insuffisant" }, { status: 403 });
      }
    }

    // Resolve sessionId: use provided or fall back to default session
    let resolvedSessionId = sessionId;
    if (!resolvedSessionId) {
      const defaultSession = activity.sessions[0];
      if (!defaultSession) {
        return NextResponse.json({ error: "Aucune séance par défaut trouvée" }, { status: 500 });
      }
      resolvedSessionId = defaultSession.id;
    } else {
      // Verify session belongs to activity
      const session = await prisma.activitySession.findFirst({
        where: { id: resolvedSessionId, activityId },
      });
      if (!session) {
        return NextResponse.json({ error: "Séance non trouvée pour cette activité" }, { status: 400 });
      }
    }

    // Count existing before insert to calculate duplicates
    const existingCount = await prisma.attendance.count({
      where: { activityId, sessionId: resolvedSessionId },
    });

    const data = participants.map((p: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string | null;
      organization?: string | null;
    }) => ({
      activityId,
      sessionId: resolvedSessionId,
      firstName: p.firstName.trim(),
      lastName: p.lastName.trim(),
      email: p.email.trim().toLowerCase(),
      phone: p.phone?.trim() || null,
      organization: p.organization?.trim() || null,
    }));

    await prisma.attendance.createMany({
      data,
      skipDuplicates: true,
    });

    const newCount = await prisma.attendance.count({
      where: { activityId, sessionId: resolvedSessionId },
    });

    const created = newCount - existingCount;
    const duplicates = participants.length - created;

    return NextResponse.json({ created, duplicates });
  } catch (error) {
    console.error("Import save error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement" },
      { status: 500 }
    );
  }
}

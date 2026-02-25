import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateActivitySchema } from "@/lib/validations/activity";

// GET /api/activites/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const serviceId = (session.user as any).serviceId;

  const activity = await prisma.activity.findFirst({
    where: { id, serviceId },
    include: {
      _count: { select: { attendances: true, feedbacks: true } },
      createdBy: { select: { name: true } },
    },
  });

  if (!activity) {
    return NextResponse.json({ error: "Activité non trouvée" }, { status: 404 });
  }

  return NextResponse.json(activity);
}

// PUT /api/activites/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const serviceId = (session.user as any).serviceId;

  const existing = await prisma.activity.findFirst({
    where: { id, serviceId },
  });

  if (!existing) {
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
    },
  });

  return NextResponse.json(activity);
}

// DELETE /api/activites/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const serviceId = (session.user as any).serviceId;

  const existing = await prisma.activity.findFirst({
    where: { id, serviceId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Activité non trouvée" }, { status: 404 });
  }

  await prisma.activity.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

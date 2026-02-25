import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createActivitySchema } from "@/lib/validations/activity";

// GET /api/activites - List activities for the current service
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const serviceId = (session.user as any).serviceId;

  const activities = await prisma.activity.findMany({
    where: { serviceId },
    orderBy: { date: "desc" },
    include: {
      _count: { select: { attendances: true, feedbacks: true } },
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json(activities);
}

// POST /api/activites - Create a new activity
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const validation = createActivitySchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const serviceId = (session.user as any).serviceId;

  const activity = await prisma.activity.create({
    data: {
      title: validation.data.title,
      description: validation.data.description || null,
      date: new Date(validation.data.date),
      location: validation.data.location || null,
      status: validation.data.status,
      serviceId,
      createdById: session.user.id,
    },
  });

  return NextResponse.json(activity, { status: 201 });
}

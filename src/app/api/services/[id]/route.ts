import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/authorization";
import { updateServiceSchema } from "@/lib/validations/service";

// GET /api/services/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await params;

  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
      },
      _count: { select: { activities: true } },
    },
  });

  if (!service) {
    return NextResponse.json({ error: "Service non trouvé" }, { status: 404 });
  }

  return NextResponse.json(service);
}

// PUT /api/services/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await params;

  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Service non trouvé" }, { status: 404 });
  }

  const body = await request.json();
  const validation = updateServiceSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const service = await prisma.service.update({
    where: { id },
    data: {
      ...(validation.data.name && { name: validation.data.name }),
      ...(validation.data.slug && { slug: validation.data.slug }),
      ...(validation.data.description !== undefined && {
        description: validation.data.description || null,
      }),
    },
  });

  return NextResponse.json(service);
}

// DELETE /api/services/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await params;

  const existing = await prisma.service.findUnique({
    where: { id },
    include: { _count: { select: { activities: true, users: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Service non trouvé" }, { status: 404 });
  }

  if (existing._count.activities > 0 || existing._count.users > 0) {
    return NextResponse.json(
      { error: "Impossible de supprimer un service avec des activités ou utilisateurs associés" },
      { status: 400 }
    );
  }

  await prisma.service.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

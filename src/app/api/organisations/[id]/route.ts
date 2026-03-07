import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/authorization";
import { updateOrganizationSchema } from "@/lib/validations/organization";

// GET /api/organisations/[id]
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

  const organisation = await prisma.organization.findUnique({
    where: { id },
    include: {
      departments: {
        orderBy: { name: "asc" },
        include: {
          _count: { select: { services: true, programs: true } },
        },
      },
    },
  });

  if (!organisation) {
    return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
  }

  return NextResponse.json(organisation);
}

// PUT /api/organisations/[id]
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

  const existing = await prisma.organization.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
  }

  const body = await request.json();
  const validation = updateOrganizationSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const data: any = { ...validation.data };
  if (data.name) {
    data.slug = data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const organisation = await prisma.organization.update({
    where: { id },
    data,
  });

  return NextResponse.json(organisation);
}

// DELETE /api/organisations/[id]
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

  const existing = await prisma.organization.findUnique({
    where: { id },
    include: { _count: { select: { departments: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
  }

  if (existing._count.departments > 0) {
    return NextResponse.json(
      { error: "Impossible de supprimer : des départements sont rattachés" },
      { status: 400 }
    );
  }

  await prisma.organization.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

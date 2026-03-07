import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/authorization";
import { updateDepartmentSchema } from "@/lib/validations/department";

// GET /api/departments/[id]
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

  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      organization: { select: { id: true, name: true } },
      services: {
        orderBy: { name: "asc" },
        include: { _count: { select: { users: true, activities: true } } },
      },
      _count: { select: { programs: true } },
    },
  });

  if (!department) {
    return NextResponse.json({ error: "Département non trouvé" }, { status: 404 });
  }

  return NextResponse.json(department);
}

// PUT /api/departments/[id]
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

  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Département non trouvé" }, { status: 404 });
  }

  const body = await request.json();
  const validation = updateDepartmentSchema.safeParse(body);

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

  const department = await prisma.department.update({
    where: { id },
    data,
  });

  return NextResponse.json(department);
}

// DELETE /api/departments/[id]
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

  const existing = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { services: true, programs: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Département non trouvé" }, { status: 404 });
  }

  if (existing._count.services > 0 || existing._count.programs > 0) {
    return NextResponse.json(
      { error: "Impossible de supprimer : des services ou programmes sont rattachés" },
      { status: 400 }
    );
  }

  await prisma.department.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

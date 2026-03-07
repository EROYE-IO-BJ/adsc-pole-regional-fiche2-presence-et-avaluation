import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, userCanAccessService, handleAuthError } from "@/lib/authorization";
import { updateProgramSchema } from "@/lib/validations/program";
import { Role } from "@prisma/client";

// GET /api/programs/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireRole(Role.ADMIN, Role.RESPONSABLE_SERVICE);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await params;

  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
      _count: { select: { activities: true } },
    },
  });

  if (!program) {
    return NextResponse.json({ error: "Programme non trouvé" }, { status: 404 });
  }

  if (user.role === Role.RESPONSABLE_SERVICE) {
    const hasAccess = await userCanAccessService(user.id, program.serviceId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Programme non trouvé" }, { status: 404 });
    }
  }

  return NextResponse.json(program);
}

// PUT /api/programs/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireRole(Role.ADMIN, Role.RESPONSABLE_SERVICE);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await params;

  const existing = await prisma.program.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Programme non trouvé" }, { status: 404 });
  }

  if (user.role === Role.RESPONSABLE_SERVICE) {
    const hasAccess = await userCanAccessService(user.id, existing.serviceId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Programme non trouvé" }, { status: 404 });
    }
  }

  const body = await request.json();
  const validation = updateProgramSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const program = await prisma.program.update({
    where: { id },
    data: {
      ...(validation.data.name && { name: validation.data.name }),
      ...(validation.data.description !== undefined && {
        description: validation.data.description || null,
      }),
      ...(validation.data.departmentId && { departmentId: validation.data.departmentId }),
      ...(validation.data.serviceId !== undefined && { serviceId: validation.data.serviceId || null }),
    },
    include: {
      service: { select: { name: true } },
    },
  });

  return NextResponse.json(program);
}

// DELETE /api/programs/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireRole(Role.ADMIN, Role.RESPONSABLE_SERVICE);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await params;

  const existing = await prisma.program.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Programme non trouvé" }, { status: 404 });
  }

  if (user.role === Role.RESPONSABLE_SERVICE) {
    const hasAccess = await userCanAccessService(user.id, existing.serviceId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Programme non trouvé" }, { status: 404 });
    }
  }

  await prisma.program.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

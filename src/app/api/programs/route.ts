import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, getUserServiceIds, userCanAccessService, handleAuthError } from "@/lib/authorization";
import { createProgramSchema } from "@/lib/validations/program";
import { Role } from "@prisma/client";

// GET /api/programs - List programs
export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireRole(Role.ADMIN, Role.RESPONSABLE_SERVICE);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const serviceId = request.nextUrl.searchParams.get("serviceId");
  const where: any = {};

  if (user.role === Role.RESPONSABLE_SERVICE) {
    const serviceIds = await getUserServiceIds(user.id);
    where.serviceId = { in: serviceIds };
  } else if (serviceId) {
    where.serviceId = serviceId;
  }

  const programs = await prisma.program.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      department: { select: { name: true } },
      service: { select: { name: true } },
      _count: { select: { activities: true } },
    },
  });

  return NextResponse.json(programs);
}

// POST /api/programs - Create a program
export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireRole(Role.ADMIN, Role.RESPONSABLE_SERVICE);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const body = await request.json();
  const validation = createProgramSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  // Verify service access
  if (user.role === Role.RESPONSABLE_SERVICE && validation.data.serviceId) {
    const hasAccess = await userCanAccessService(user.id, validation.data.serviceId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Accès insuffisant à ce service" },
        { status: 403 }
      );
    }
  }

  const program = await prisma.program.create({
    data: {
      name: validation.data.name,
      description: validation.data.description || null,
      departmentId: validation.data.departmentId,
      serviceId: validation.data.serviceId || null,
    },
    include: {
      service: { select: { name: true } },
    },
  });

  return NextResponse.json(program, { status: 201 });
}

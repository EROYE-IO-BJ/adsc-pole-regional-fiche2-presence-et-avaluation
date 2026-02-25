import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/authorization";
import { createServiceSchema } from "@/lib/validations/service";

// GET /api/services - List all services (Admin only)
export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true, activities: true } },
    },
  });

  return NextResponse.json(services);
}

// POST /api/services - Create a new service (Admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const body = await request.json();
  const validation = createServiceSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  // Check uniqueness
  const existing = await prisma.service.findFirst({
    where: {
      OR: [{ name: validation.data.name }, { slug: validation.data.slug }],
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Un service avec ce nom ou ce slug existe déjà" },
      { status: 409 }
    );
  }

  const service = await prisma.service.create({
    data: {
      name: validation.data.name,
      slug: validation.data.slug,
      description: validation.data.description || null,
    },
  });

  return NextResponse.json(service, { status: 201 });
}

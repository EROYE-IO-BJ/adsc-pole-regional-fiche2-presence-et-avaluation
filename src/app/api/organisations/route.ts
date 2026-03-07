import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/authorization";
import { createOrganizationSchema } from "@/lib/validations/organization";

// GET /api/organisations - List all organisations (Admin only)
export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const organisations = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { departments: true } },
    },
  });

  return NextResponse.json(organisations);
}

// POST /api/organisations - Create a new organisation (Admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const body = await request.json();
  const validation = createOrganizationSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const slug = validation.data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const existing = await prisma.organization.findFirst({
    where: { OR: [{ name: validation.data.name }, { slug }] },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Une organisation avec ce nom existe déjà" },
      { status: 409 }
    );
  }

  const organisation = await prisma.organization.create({
    data: {
      name: validation.data.name,
      slug,
      description: validation.data.description || null,
    },
  });

  return NextResponse.json(organisation, { status: 201 });
}

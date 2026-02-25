import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/authorization";

// GET /api/users - List users (Admin only)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const { searchParams } = request.nextUrl;
  const role = searchParams.get("role");
  const serviceId = searchParams.get("serviceId");
  const search = searchParams.get("search");

  const where: any = {};
  if (role) where.role = role;
  if (serviceId) where.serviceId = serviceId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      serviceId: true,
      service: { select: { name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

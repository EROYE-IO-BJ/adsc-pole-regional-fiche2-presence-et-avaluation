import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleAuthError } from "@/lib/authorization";
import { Role } from "@prisma/client";

// GET /api/intervenants - List intervenants (optionally filtered by service)
export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireRole(Role.ADMIN, Role.RESPONSABLE_SERVICE);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const { searchParams } = request.nextUrl;
  const serviceId = searchParams.get("serviceId");

  const where: any = { role: Role.INTERVENANT };

  if (user.role === Role.RESPONSABLE_SERVICE) {
    where.serviceId = user.serviceId;
  } else if (serviceId) {
    where.serviceId = serviceId;
  }

  const intervenants = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      serviceId: true,
      service: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(intervenants);
}

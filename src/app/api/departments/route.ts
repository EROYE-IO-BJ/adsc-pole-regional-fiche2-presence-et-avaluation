import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/authorization";

// GET /api/departments - List all departments
export async function GET() {
  try {
    await requireAuth();
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: {
      organization: { select: { name: true } },
    },
  });

  return NextResponse.json(departments);
}

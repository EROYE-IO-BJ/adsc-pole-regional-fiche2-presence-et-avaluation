import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleAuthError } from "@/lib/authorization";
import { Role } from "@prisma/client";

// DELETE /api/registrations/[id] - Cancel registration
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireRole(Role.PARTICIPANT);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await params;

  const registration = await prisma.registration.findUnique({ where: { id } });
  if (!registration || registration.userId !== user.id) {
    return NextResponse.json({ error: "Inscription non trouvée" }, { status: 404 });
  }

  await prisma.registration.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

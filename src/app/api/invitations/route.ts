import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleAuthError } from "@/lib/authorization";
import { createInvitationSchema } from "@/lib/validations/invitation";
import { sendInvitationEmail } from "@/lib/email";
import { Role } from "@prisma/client";

// GET /api/invitations - List invitations
export async function GET() {
  let user;
  try {
    user = await requireRole(Role.ADMIN, Role.RESPONSABLE_SERVICE);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const where: any = {};
  // Responsable only sees invitations for their service
  if (user.role === Role.RESPONSABLE_SERVICE) {
    where.serviceId = user.serviceId;
  }

  const invitations = await prisma.invitation.findMany({
    where,
    include: {
      sender: { select: { name: true } },
      receiver: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}

// POST /api/invitations - Create an invitation
export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireRole(Role.ADMIN, Role.RESPONSABLE_SERVICE);
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const body = await request.json();
  const validation = createInvitationSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { email, role, serviceId } = validation.data;

  // Responsable can only invite INTERVENANT for their own service
  if (user.role === Role.RESPONSABLE_SERVICE) {
    if (role !== "INTERVENANT") {
      return NextResponse.json(
        { error: "Vous ne pouvez inviter que des intervenants" },
        { status: 403 }
      );
    }
    if (serviceId && serviceId !== user.serviceId) {
      return NextResponse.json(
        { error: "Vous ne pouvez inviter que pour votre service" },
        { status: 403 }
      );
    }
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "Un utilisateur avec cet email existe déjà" },
      { status: 409 }
    );
  }

  // Check for pending invitation
  const existingInvitation = await prisma.invitation.findFirst({
    where: { email, acceptedAt: null, expiresAt: { gt: new Date() } },
  });
  if (existingInvitation) {
    return NextResponse.json(
      { error: "Une invitation est déjà en attente pour cet email" },
      { status: 409 }
    );
  }

  const resolvedServiceId =
    role === "INTERVENANT" || role === "RESPONSABLE_SERVICE"
      ? serviceId || user.serviceId
      : null;

  const invitation = await prisma.invitation.create({
    data: {
      email,
      role: role as Role,
      serviceId: resolvedServiceId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      senderId: user.id,
    },
  });

  // Get service name for email
  let serviceName: string | undefined;
  if (resolvedServiceId) {
    const service = await prisma.service.findUnique({
      where: { id: resolvedServiceId },
    });
    serviceName = service?.name;
  }

  try {
    await sendInvitationEmail(email, invitation.token, user.name ?? "Admin", role, serviceName);
  } catch {
    // Email failed but invitation was created
  }

  return NextResponse.json(invitation, { status: 201 });
}

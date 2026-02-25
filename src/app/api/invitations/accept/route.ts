import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { acceptInvitationSchema } from "@/lib/validations/invitation";

// GET /api/invitations/accept?token=xxx - Get invitation info (public)
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token requis" }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      sender: { select: { name: true } },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitation non trouvée" }, { status: 404 });
  }

  let serviceName: string | undefined;
  if (invitation.serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: invitation.serviceId },
    });
    serviceName = service?.name;
  }

  return NextResponse.json({
    email: invitation.email,
    role: invitation.role,
    serviceName,
    inviterName: invitation.sender.name,
    expired: invitation.expiresAt < new Date(),
    accepted: !!invitation.acceptedAt,
  });
}

// POST /api/invitations/accept - Accept an invitation
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = acceptInvitationSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { token, name, password } = validation.data;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitation non trouvée" }, { status: 404 });
  }

  if (invitation.acceptedAt) {
    return NextResponse.json({ error: "Cette invitation a déjà été acceptée" }, { status: 400 });
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Cette invitation a expiré" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user and mark invitation as accepted in a transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name,
        email: invitation.email,
        password: hashedPassword,
        role: invitation.role,
        serviceId: invitation.serviceId,
        emailVerified: new Date(), // Auto-verified through invitation
      },
    });

    await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        acceptedAt: new Date(),
        receiverId: newUser.id,
      },
    });

    return newUser;
  });

  return NextResponse.json(
    { message: "Invitation acceptée. Vous pouvez maintenant vous connecter.", userId: user.id },
    { status: 201 }
  );
}

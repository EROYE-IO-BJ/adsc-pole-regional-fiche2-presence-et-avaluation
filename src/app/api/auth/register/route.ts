import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/user";
import { sendVerificationEmail } from "@/lib/email";

// POST /api/auth/register - Public participant registration
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = registerSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password } = validation.data;

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Un compte avec cet email existe déjà" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Create verification token
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  // Create user (PARTICIPANT role by default, no service)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "PARTICIPANT",
      serviceId: null,
    },
  });

  // Store verification token
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  // Send verification email
  try {
    await sendVerificationEmail(email, token, name);
  } catch {
    // Email sending failed but user was created - they can request a new verification
  }

  return NextResponse.json(
    { message: "Compte créé. Vérifiez votre email pour activer votre compte.", userId: user.id },
    { status: 201 }
  );
}

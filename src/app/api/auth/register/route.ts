import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/user";

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

  // Create user (PARTICIPANT role by default, auto-verified)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "PARTICIPANT",
      serviceId: null,
      emailVerified: new Date(),
    },
  });

  return NextResponse.json(
    { message: "Compte créé avec succès. Vous pouvez maintenant vous connecter.", userId: user.id },
    { status: 201 }
  );
}

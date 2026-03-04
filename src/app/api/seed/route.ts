import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  // Protect with a secret token
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (token !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Create services
    const services = await Promise.all([
      prisma.service.upsert({
        where: { slug: "ima-lingua" },
        update: {},
        create: {
          name: "IMA Lingua",
          slug: "ima-lingua",
          description: "Institut des Métiers d'Avenir - Lingua",
        },
      }),
      prisma.service.upsert({
        where: { slug: "career-center" },
        update: {},
        create: {
          name: "Career Center",
          slug: "career-center",
          description: "Centre de carrière et d'orientation professionnelle",
        },
      }),
      prisma.service.upsert({
        where: { slug: "recrutement-mobilite" },
        update: {},
        create: {
          name: "Service Recrutement, Accueil et Mobilité",
          slug: "recrutement-mobilite",
          description:
            "Service de recrutement, accueil et mobilité internationale",
        },
      }),
    ]);

    const hashedPassword = await bcrypt.hash("password123", 12);

    // Super admin
    await prisma.user.upsert({
      where: { email: "superadmin@semecity.bj" },
      update: { role: Role.ADMIN },
      create: {
        name: "Super Administrateur",
        email: "superadmin@semecity.bj",
        password: hashedPassword,
        role: Role.ADMIN,
        serviceId: null,
        emailVerified: new Date(),
      },
    });

    // Admin users
    const admins = [
      { name: "Admin IMA Lingua", email: "admin.lingua@semecity.bj" },
      { name: "Admin Career Center", email: "admin.career@semecity.bj" },
      { name: "Admin Recrutement", email: "admin.recrutement@semecity.bj" },
    ];

    for (const admin of admins) {
      await prisma.user.upsert({
        where: { email: admin.email },
        update: { role: Role.ADMIN },
        create: {
          ...admin,
          password: hashedPassword,
          role: Role.ADMIN,
          serviceId: null,
          emailVerified: new Date(),
        },
      });
    }

    // Responsables
    const responsables = [
      {
        name: "Responsable IMA Lingua",
        email: "resp.lingua@semecity.bj",
        serviceId: services[0].id,
      },
      {
        name: "Responsable Career Center",
        email: "resp.career@semecity.bj",
        serviceId: services[1].id,
      },
      {
        name: "Responsable Recrutement",
        email: "resp.recrutement@semecity.bj",
        serviceId: services[2].id,
      },
    ];

    for (const resp of responsables) {
      await prisma.user.upsert({
        where: { email: resp.email },
        update: {
          role: Role.RESPONSABLE_SERVICE,
          serviceId: resp.serviceId,
        },
        create: {
          ...resp,
          password: hashedPassword,
          role: Role.RESPONSABLE_SERVICE,
          emailVerified: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Seed exécuté avec succès",
      services: services.map((s) => s.name),
      accounts: {
        superAdmin: "superadmin@semecity.bj",
        admins: admins.map((a) => a.email),
        responsables: responsables.map((r) => r.email),
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Erreur lors du seed", details: String(error) },
      { status: 500 }
    );
  }
}

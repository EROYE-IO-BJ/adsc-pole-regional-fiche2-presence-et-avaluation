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
    // Create organization + department
    const org = await prisma.organization.upsert({
      where: { slug: "seme-city" },
      update: {},
      create: { name: "Seme City", slug: "seme-city", description: "Seme City - Cite de l'Innovation et du Savoir" },
    });
    const dept = await prisma.department.upsert({
      where: { slug: "ima" },
      update: {},
      create: { name: "Institut des Metiers d'Avenir (IMA)", slug: "ima", organizationId: org.id },
    });

    // Create services
    const services = await Promise.all([
      prisma.service.upsert({
        where: { slug: "ima-lingua" },
        update: {},
        create: {
          name: "IMA Lingua",
          slug: "ima-lingua",
          description: "Institut des Métiers d'Avenir - Lingua",
          departmentId: dept.id,
        },
      }),
      prisma.service.upsert({
        where: { slug: "career-center" },
        update: {},
        create: {
          name: "Career Center",
          slug: "career-center",
          description: "Centre de carrière et d'orientation professionnelle",
          departmentId: dept.id,
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
          departmentId: dept.id,
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
          emailVerified: new Date(),
        },
      });
    }

    // Responsables with UserService
    const responsables = [
      {
        name: "Responsable IMA Lingua",
        email: "resp.lingua@semecity.bj",
        serviceIndex: 0,
      },
      {
        name: "Responsable Career Center",
        email: "resp.career@semecity.bj",
        serviceIndex: 1,
      },
      {
        name: "Responsable Recrutement",
        email: "resp.recrutement@semecity.bj",
        serviceIndex: 2,
      },
    ];

    for (const resp of responsables) {
      const user = await prisma.user.upsert({
        where: { email: resp.email },
        update: {
          role: Role.RESPONSABLE_SERVICE,
        },
        create: {
          name: resp.name,
          email: resp.email,
          password: hashedPassword,
          role: Role.RESPONSABLE_SERVICE,
          emailVerified: new Date(),
        },
      });

      // Create UserService link
      await prisma.userService.upsert({
        where: {
          userId_serviceId: {
            userId: user.id,
            serviceId: services[resp.serviceIndex].id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          serviceId: services[resp.serviceIndex].id,
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

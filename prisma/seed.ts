import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
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
        description: "Service de recrutement, accueil et mobilité internationale",
      },
    }),
  ]);

  const hashedPassword = await bcrypt.hash("password123", 12);

  // Create admin users (global admins, no service)
  const admins = [
    {
      name: "Admin IMA Lingua",
      email: "admin.lingua@semecity.bj",
      role: Role.ADMIN,
      serviceId: null,
    },
    {
      name: "Admin Career Center",
      email: "admin.career@semecity.bj",
      role: Role.ADMIN,
      serviceId: null,
    },
    {
      name: "Admin Recrutement",
      email: "admin.recrutement@semecity.bj",
      role: Role.ADMIN,
      serviceId: null,
    },
  ];

  for (const admin of admins) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: { role: Role.ADMIN },
      create: {
        ...admin,
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });
  }

  // Create a responsable per service
  const responsables = [
    {
      name: "Responsable IMA Lingua",
      email: "resp.lingua@semecity.bj",
      role: Role.RESPONSABLE_SERVICE,
      serviceId: services[0].id,
    },
    {
      name: "Responsable Career Center",
      email: "resp.career@semecity.bj",
      role: Role.RESPONSABLE_SERVICE,
      serviceId: services[1].id,
    },
    {
      name: "Responsable Recrutement",
      email: "resp.recrutement@semecity.bj",
      role: Role.RESPONSABLE_SERVICE,
      serviceId: services[2].id,
    },
  ];

  for (const resp of responsables) {
    await prisma.user.upsert({
      where: { email: resp.email },
      update: { role: Role.RESPONSABLE_SERVICE, serviceId: resp.serviceId },
      create: {
        ...resp,
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });
  }

  console.log("Seed completed successfully!");
  console.log("Services:", services.map((s) => `${s.name} (${s.slug})`));
  console.log("Admin accounts created with password: password123");
  console.log("Responsable accounts created with password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

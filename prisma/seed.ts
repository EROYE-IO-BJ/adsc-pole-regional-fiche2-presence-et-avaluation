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

  // Create super admin (centralized, sees all services)
  const superAdmin = await prisma.user.upsert({
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

  // Create admin users (global admins, no service)
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

  // Create a responsable per service with UserService
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
      update: { role: Role.RESPONSABLE_SERVICE },
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

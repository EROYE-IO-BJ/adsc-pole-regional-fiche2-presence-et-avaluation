import { PrismaClient, ServiceType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create services
  const services = await Promise.all([
    prisma.service.upsert({
      where: { type: ServiceType.IMA_LINGUA },
      update: {},
      create: {
        name: "IMA Lingua",
        type: ServiceType.IMA_LINGUA,
      },
    }),
    prisma.service.upsert({
      where: { type: ServiceType.CAREER_CENTER },
      update: {},
      create: {
        name: "Career Center",
        type: ServiceType.CAREER_CENTER,
      },
    }),
    prisma.service.upsert({
      where: { type: ServiceType.RECRUTEMENT_MOBILITE },
      update: {},
      create: {
        name: "Service Recrutement, Accueil et Mobilité",
        type: ServiceType.RECRUTEMENT_MOBILITE,
      },
    }),
  ]);

  const hashedPassword = await bcrypt.hash("password123", 12);

  // Create admin users (one per service)
  const admins = [
    {
      name: "Admin IMA Lingua",
      email: "admin.lingua@semecity.bj",
      serviceId: services[0].id,
    },
    {
      name: "Admin Career Center",
      email: "admin.career@semecity.bj",
      serviceId: services[1].id,
    },
    {
      name: "Admin Recrutement",
      email: "admin.recrutement@semecity.bj",
      serviceId: services[2].id,
    },
  ];

  for (const admin of admins) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        ...admin,
        password: hashedPassword,
      },
    });
  }

  console.log("Seed completed successfully!");
  console.log("Services:", services.map((s) => s.name));
  console.log("Admin accounts created with password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { execSync } from "child_process";

export default async function globalSetup() {
  // Push schema to test database
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: "inherit",
  });

  // Seed test data via the API or directly
  const { PrismaClient } = await import("@prisma/client");
  const bcryptModule = await import("bcryptjs");
  const bcrypt = bcryptModule.default || bcryptModule;
  const prisma = new PrismaClient();

  try {
    // Clean all data first
    await prisma.$transaction([
      prisma.attendance.deleteMany(),
      prisma.feedback.deleteMany(),
      prisma.registration.deleteMany(),
      prisma.activitySession.deleteMany(),
      prisma.activity.deleteMany(),
      prisma.program.deleteMany(),
      prisma.invitation.deleteMany(),
      prisma.account.deleteMany(),
      prisma.session.deleteMany(),
      prisma.verificationToken.deleteMany(),
      prisma.userService.deleteMany(),
      prisma.user.deleteMany(),
      prisma.service.deleteMany(),
      prisma.department.deleteMany(),
      prisma.organization.deleteMany(),
    ]);

    const password = await bcrypt.hash("password123", 12);

    // Create organization + department
    const org = await prisma.organization.create({
      data: { name: "Org E2E", slug: "org-e2e" },
    });
    const dept = await prisma.department.create({
      data: { name: "Dept E2E", slug: "dept-e2e", organizationId: org.id },
    });

    // Create service
    const service = await prisma.service.create({
      data: { name: "Service E2E", slug: "service-e2e", departmentId: dept.id },
    });

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: "Admin E2E",
        email: "admin-e2e@test.com",
        password,
        role: "ADMIN",
        emailVerified: new Date(),
      },
    });

    // Create a program
    const program = await prisma.program.create({
      data: { name: "Programme E2E", departmentId: dept.id, serviceId: service.id },
    });

    // Create a FORMATION activity
    const formation = await prisma.activity.create({
      data: {
        title: "Formation E2E Test",
        startDate: new Date("2025-09-01"),
        endDate: new Date("2025-09-15"),
        type: "FORMATION",
        status: "ACTIVE",
        serviceId: service.id,
        createdById: admin.id,
        programId: program.id,
        sessions: {
          create: [
            { title: "Séance 1", startDate: new Date("2025-09-01"), isDefault: true },
            { title: "Séance 2", startDate: new Date("2025-09-15") },
          ],
        },
      },
      include: { sessions: true },
    });

    // Create a SERVICE activity
    await prisma.activity.create({
      data: {
        title: "Service E2E Test",
        startDate: new Date("2025-09-01"),
        endDate: new Date("2025-09-01"),
        type: "SERVICE",
        status: "ACTIVE",
        serviceId: service.id,
        createdById: admin.id,
        programId: program.id,
        sessions: {
          create: { title: null, startDate: new Date("2025-09-01"), isDefault: true },
        },
      },
    });

    // Store tokens for e2e tests via env file
    const fs = await import("fs");
    const path = await import("path");
    const envContent = [
      `E2E_ADMIN_EMAIL=admin-e2e@test.com`,
      `E2E_ADMIN_PASSWORD=password123`,
      `E2E_SERVICE_ID=${service.id}`,
      `E2E_FORMATION_TOKEN=${formation.accessToken}`,
      `E2E_FORMATION_ID=${formation.id}`,
    ].join("\n");

    fs.writeFileSync(
      path.join(process.cwd(), "e2e/.env.e2e"),
      envContent
    );
  } finally {
    await prisma.$disconnect();
  }
}

import { vi } from "vitest";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";

type MockUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export function mockAuthUser(user: MockUser | null) {
  if (user) {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    } as any);
  } else {
    vi.mocked(auth).mockResolvedValue(null as any);
  }
}

export async function createTestUsers(prisma: PrismaClient) {
  const password = await bcrypt.hash("password123", 12);

  const org = await prisma.organization.create({
    data: { name: "Org Test", slug: "org-test" },
  });

  const department = await prisma.department.create({
    data: { name: "Département Test", slug: "dept-test", organizationId: org.id },
  });

  const service = await prisma.service.create({
    data: { name: "Service Test", slug: "service-test", departmentId: department.id },
  });

  const service2 = await prisma.service.create({
    data: { name: "Service Autre", slug: "service-autre", departmentId: department.id },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Admin Test",
      email: "admin@test.com",
      password,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  const responsable = await prisma.user.create({
    data: {
      name: "Responsable Test",
      email: "responsable@test.com",
      password,
      role: "RESPONSABLE_SERVICE",
      serviceId: service.id,
      emailVerified: new Date(),
    },
  });

  await prisma.userService.create({
    data: { userId: responsable.id, serviceId: service.id },
  });

  const intervenant = await prisma.user.create({
    data: {
      name: "Intervenant Test",
      email: "intervenant@test.com",
      password,
      role: "INTERVENANT",
      emailVerified: new Date(),
    },
  });

  const participant = await prisma.user.create({
    data: {
      name: "Participant Test",
      email: "participant@test.com",
      password,
      role: "PARTICIPANT",
      emailVerified: new Date(),
    },
  });

  const program = await prisma.program.create({
    data: { name: "Programme Test", departmentId: department.id, serviceId: service.id },
  });

  const program2 = await prisma.program.create({
    data: { name: "Programme Autre", departmentId: department.id, serviceId: service2.id },
  });

  return { admin, responsable, intervenant, participant, service, service2, department, program, program2 };
}

import { PrismaClient } from "@prisma/client";

export async function createFormationActivity(
  prisma: PrismaClient,
  serviceId: string,
  userId: string,
  programId: string,
  overrides?: Record<string, unknown>
) {
  return prisma.activity.create({
    data: {
      title: "Formation Test",
      startDate: new Date("2025-06-15"),
      endDate: new Date("2025-08-15"),
      type: "FORMATION",
      status: "ACTIVE",
      serviceId,
      programId,
      createdById: userId,
      ...overrides,
      sessions: {
        create: {
          title: "Séance 1",
          startDate: new Date("2025-06-15"),
          isDefault: true,
        },
      },
    },
    include: { sessions: true },
  });
}

export async function createServiceActivity(
  prisma: PrismaClient,
  serviceId: string,
  userId: string,
  programId: string,
  overrides?: Record<string, unknown>
) {
  return prisma.activity.create({
    data: {
      title: "Service Test",
      startDate: new Date("2025-06-15"),
      endDate: new Date("2025-06-15"),
      type: "SERVICE",
      status: "ACTIVE",
      serviceId,
      programId,
      createdById: userId,
      ...overrides,
      sessions: {
        create: {
          title: null,
          startDate: new Date("2025-06-15"),
          isDefault: true,
        },
      },
    },
    include: { sessions: true },
  });
}

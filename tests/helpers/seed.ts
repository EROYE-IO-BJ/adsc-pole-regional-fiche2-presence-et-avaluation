import { PrismaClient, Role } from "@prisma/client";

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

export async function createTestAttendance(
  prisma: PrismaClient,
  activityId: string,
  sessionId: string,
  overrides?: Record<string, unknown>
) {
  return prisma.attendance.create({
    data: {
      firstName: "Test",
      lastName: "Participant",
      email: "test-participant@test.com",
      activityId,
      sessionId,
      ...overrides,
    },
  });
}

export async function createTestFeedback(
  prisma: PrismaClient,
  activityId: string,
  sessionId: string,
  type: "FORMATION" | "SERVICE",
  overrides?: Record<string, unknown>
) {
  const base =
    type === "FORMATION"
      ? {
          feedbackType: "FORMATION",
          overallRating: 4,
          contentRating: 4,
          organizationRating: 4,
          wouldRecommend: true,
        }
      : {
          feedbackType: "SERVICE",
          satisfactionRating: 4,
          informationClarity: true,
        };

  return prisma.feedback.create({
    data: {
      ...base,
      activityId,
      sessionId,
      ...overrides,
    },
  });
}

export async function createTestRegistration(
  prisma: PrismaClient,
  userId: string,
  activityId: string
) {
  return prisma.registration.create({
    data: { userId, activityId },
  });
}

export async function createTestInvitation(
  prisma: PrismaClient,
  senderId: string,
  overrides?: Record<string, unknown>
) {
  return prisma.invitation.create({
    data: {
      email: "invite@test.com",
      role: "INTERVENANT" as Role,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      senderId,
      ...overrides,
    },
  });
}

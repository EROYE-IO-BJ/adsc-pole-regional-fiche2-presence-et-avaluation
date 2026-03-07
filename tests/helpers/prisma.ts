import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function cleanDatabase() {
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
}

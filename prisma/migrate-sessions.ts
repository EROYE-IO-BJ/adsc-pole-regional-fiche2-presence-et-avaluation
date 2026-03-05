/**
 * Migration script: Ensure every Attendance and Feedback has a sessionId.
 *
 * Run BEFORE making sessionId required in the schema:
 *   npx tsx prisma/migrate-sessions.ts
 *
 * Steps:
 * 1. For each activity WITHOUT sessions → create a default session (isDefault: true)
 * 2. For each activity WITH sessions → mark the 1st (by date) as isDefault: true
 * 3. Attach orphan Attendances (sessionId IS NULL) to the default session
 * 4. Attach orphan Feedbacks (sessionId IS NULL) to the default session
 * 5. Handle duplicate [sessionId, email] conflicts (skip if already exists)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting session migration...\n");

  // Get all activities
  const activities = await prisma.activity.findMany({
    include: {
      sessions: { orderBy: { date: "asc" } },
    },
  });

  let createdSessions = 0;
  let markedDefault = 0;
  let migratedAttendances = 0;
  let migratedFeedbacks = 0;
  let skippedDuplicates = 0;

  for (const activity of activities) {
    let defaultSession;

    if (activity.sessions.length === 0) {
      // No sessions → create a default one
      defaultSession = await prisma.activitySession.create({
        data: {
          title: activity.type === "SERVICE" ? null : "Séance 1",
          date: activity.date,
          location: activity.location,
          intervenantId: activity.intervenantId,
          activityId: activity.id,
          isDefault: true,
        },
      });
      createdSessions++;
      console.log(`  Created default session for "${activity.title}" (${activity.type})`);
    } else {
      // Has sessions → mark first as default
      defaultSession = activity.sessions[0];
      await prisma.activitySession.update({
        where: { id: defaultSession.id },
        data: { isDefault: true },
      });
      markedDefault++;
    }

    // Migrate orphan attendances (sessionId was nullable before migration)
    const orphanAttendances: { id: string; email: string }[] = await prisma.$queryRawUnsafe(
      `SELECT id, email FROM "Attendance" WHERE "activityId" = $1 AND "sessionId" IS NULL`,
      activity.id
    );

    for (const att of orphanAttendances) {
      // Check for duplicate [sessionId, email]
      const existing = await prisma.attendance.findFirst({
        where: { sessionId: defaultSession.id, email: att.email },
      });

      if (existing) {
        await prisma.attendance.delete({ where: { id: att.id } });
        skippedDuplicates++;
      } else {
        await prisma.attendance.update({
          where: { id: att.id },
          data: { sessionId: defaultSession.id },
        });
        migratedAttendances++;
      }
    }

    // Migrate orphan feedbacks (sessionId was nullable before migration)
    const orphanFeedbacks: { id: string }[] = await prisma.$queryRawUnsafe(
      `SELECT id FROM "Feedback" WHERE "activityId" = $1 AND "sessionId" IS NULL`,
      activity.id
    );

    for (const fb of orphanFeedbacks) {
      await prisma.feedback.update({
        where: { id: fb.id },
        data: { sessionId: defaultSession.id },
      });
      migratedFeedbacks++;
    }
  }

  console.log("\n--- Migration Summary ---");
  console.log(`  Sessions created:       ${createdSessions}`);
  console.log(`  Sessions marked default: ${markedDefault}`);
  console.log(`  Attendances migrated:   ${migratedAttendances}`);
  console.log(`  Feedbacks migrated:     ${migratedFeedbacks}`);
  console.log(`  Duplicates skipped:     ${skippedDuplicates}`);
  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

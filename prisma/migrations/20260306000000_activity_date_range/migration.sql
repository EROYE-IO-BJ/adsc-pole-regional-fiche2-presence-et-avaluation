-- Activity: rename date → startDate, add endDate
ALTER TABLE "Activity" RENAME COLUMN "date" TO "startDate";
ALTER TABLE "Activity" ADD COLUMN "endDate" TIMESTAMP(3) NOT NULL DEFAULT now();
UPDATE "Activity" SET "endDate" = "startDate";
ALTER TABLE "Activity" ALTER COLUMN "endDate" DROP DEFAULT;

-- ActivitySession: rename date → startDate, add endDate/startTime/endTime
ALTER TABLE "ActivitySession" RENAME COLUMN "date" TO "startDate";
ALTER TABLE "ActivitySession" ADD COLUMN "endDate" TIMESTAMP(3);
ALTER TABLE "ActivitySession" ADD COLUMN "startTime" TEXT;
ALTER TABLE "ActivitySession" ADD COLUMN "endTime" TEXT;

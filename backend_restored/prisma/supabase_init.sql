-- Supabase one-shot setup for the final Prisma schema.
-- Run this once in Supabase SQL Editor on a new/empty project database.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Priority') THEN
    CREATE TYPE "Priority" AS ENUM ('urgent', 'medium', 'low');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TaskStatus') THEN
    CREATE TYPE "TaskStatus" AS ENUM ('pending', 'acknowledged', 'completed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Employee" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "avatarSeed" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Task" (
  "id" TEXT NOT NULL,
  "ref" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priority" "Priority" NOT NULL,
  "status" "TaskStatus" NOT NULL,
  "assigneeId" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3),

  CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InspectionReport" (
  "id" TEXT NOT NULL,
  "jobNumber" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "supervisor" TEXT NOT NULL,
  "arrivalTime" TEXT NOT NULL,
  "departureTime" TEXT NOT NULL,
  "stationName" TEXT NOT NULL,
  "stationManager" TEXT NOT NULL,
  "orderSummary" TEXT NOT NULL,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "productQuality" TEXT,
  "productQualityNotes" TEXT,
  "caliper" TEXT,
  "caliperNotes" TEXT,
  "washing" TEXT,
  "washingNotes" TEXT,
  "packingMaterial" TEXT,
  "packingMaterialNotes" TEXT,
  "temperatureTreatment" TEXT,
  "temperatureC" TEXT,
  "temperatureNotes" TEXT,
  "packingWeightSize" TEXT,
  "packingWeightSizeNotes" TEXT,
  "palletsCheck" TEXT,
  "palletsCheckNotes" TEXT,
  "palletsConditionType" TEXT,
  "palletsConditionStrength" TEXT,
  "palletsConditionNotes" TEXT,
  "palletsPreparedWeight" TEXT,
  "palletsPreparedWrapping" TEXT,
  "palletsPreparedNotes" TEXT,
  "fitting" TEXT,
  "fittingNotes" TEXT,
  "storageCondition" TEXT,
  "loadingStart" TEXT,
  "loadingEnd" TEXT,
  "containerWashed" TEXT,
  "containerWashedNotes" TEXT,
  "testingTempCondition" TEXT,
  "finalLoadingDetails" TEXT,
  "inspectorName" TEXT NOT NULL,
  "signature" TEXT NOT NULL,
  "submittedById" TEXT NOT NULL,

  CONSTRAINT "InspectionReport_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Task_assigneeId_fkey'
  ) THEN
    ALTER TABLE "Task"
      ADD CONSTRAINT "Task_assigneeId_fkey"
      FOREIGN KEY ("assigneeId") REFERENCES "Employee"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Task_createdById_fkey'
  ) THEN
    ALTER TABLE "Task"
      ADD CONSTRAINT "Task_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "Employee"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'InspectionReport_submittedById_fkey'
  ) THEN
    ALTER TABLE "InspectionReport"
      ADD CONSTRAINT "InspectionReport_submittedById_fkey"
      FOREIGN KEY ("submittedById") REFERENCES "Employee"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

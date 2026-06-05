/*
  Warnings:

  - You are about to drop the `Todo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Todo";

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "avatarSeed" INTEGER NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TEXT,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionReport" (
    "id" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "supervisor" TEXT NOT NULL,
    "arrivalTime" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "stationName" TEXT NOT NULL,
    "stationManager" TEXT NOT NULL,
    "orderSummary" TEXT NOT NULL,
    "productQuality" TEXT,
    "productQualityNotes" TEXT NOT NULL,
    "caliper" TEXT,
    "caliperNotes" TEXT NOT NULL,
    "washing" TEXT,
    "washingNotes" TEXT NOT NULL,
    "packingMaterial" TEXT,
    "packingMaterialNotes" TEXT NOT NULL,
    "temperatureTreatment" TEXT,
    "temperatureC" TEXT NOT NULL,
    "temperatureNotes" TEXT NOT NULL,
    "packingWeightSize" TEXT,
    "packingWeightSizeNotes" TEXT NOT NULL,
    "palletsCheck" TEXT,
    "palletsCheckNotes" TEXT NOT NULL,
    "palletsConditionType" TEXT,
    "palletsConditionStrength" TEXT,
    "palletsConditionNotes" TEXT NOT NULL,
    "palletsPreparedWeight" TEXT NOT NULL,
    "palletsPreparedWrapping" TEXT,
    "palletsPreparedNotes" TEXT NOT NULL,
    "fitting" TEXT,
    "fittingNotes" TEXT NOT NULL,
    "storageCondition" TEXT NOT NULL,
    "loadingStart" TEXT NOT NULL,
    "loadingEnd" TEXT NOT NULL,
    "containerWashed" TEXT,
    "containerWashedNotes" TEXT NOT NULL,
    "testingTempCondition" TEXT NOT NULL,
    "finalLoadingDetails" TEXT NOT NULL,
    "inspectorName" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedById" TEXT NOT NULL,

    CONSTRAINT "InspectionReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionReport" ADD CONSTRAINT "InspectionReport_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

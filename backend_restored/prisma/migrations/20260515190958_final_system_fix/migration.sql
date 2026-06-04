-- DropForeignKey
ALTER TABLE "InspectionReport" DROP CONSTRAINT "InspectionReport_submittedById_fkey";

-- AlterTable
ALTER TABLE "InspectionReport" ALTER COLUMN "productQualityNotes" DROP NOT NULL,
ALTER COLUMN "caliperNotes" DROP NOT NULL,
ALTER COLUMN "washingNotes" DROP NOT NULL,
ALTER COLUMN "packingMaterialNotes" DROP NOT NULL,
ALTER COLUMN "temperatureC" DROP NOT NULL,
ALTER COLUMN "temperatureNotes" DROP NOT NULL,
ALTER COLUMN "packingWeightSizeNotes" DROP NOT NULL,
ALTER COLUMN "palletsCheckNotes" DROP NOT NULL,
ALTER COLUMN "palletsConditionNotes" DROP NOT NULL,
ALTER COLUMN "palletsPreparedWeight" DROP NOT NULL,
ALTER COLUMN "palletsPreparedNotes" DROP NOT NULL,
ALTER COLUMN "fittingNotes" DROP NOT NULL,
ALTER COLUMN "storageCondition" DROP NOT NULL,
ALTER COLUMN "loadingStart" DROP NOT NULL,
ALTER COLUMN "loadingEnd" DROP NOT NULL,
ALTER COLUMN "containerWashedNotes" DROP NOT NULL,
ALTER COLUMN "testingTempCondition" DROP NOT NULL,
ALTER COLUMN "finalLoadingDetails" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "InspectionReport" ADD CONSTRAINT "InspectionReport_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

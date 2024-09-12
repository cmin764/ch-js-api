-- CreateTable
CREATE TABLE "BlockedWorker" (
    "shiftUuid" TEXT NOT NULL,
    "workerUuid" TEXT NOT NULL,
    "facilityUuid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "blockReason" TEXT NOT NULL,

    CONSTRAINT "BlockedWorker_pkey" PRIMARY KEY ("facilityUuid","workerUuid")
);

-- AddForeignKey
ALTER TABLE "BlockedWorker" ADD CONSTRAINT "BlockedWorker_shiftUuid_fkey" FOREIGN KEY ("shiftUuid") REFERENCES "Shift"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedWorker" ADD CONSTRAINT "BlockedWorker_workerUuid_fkey" FOREIGN KEY ("workerUuid") REFERENCES "Worker"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedWorker" ADD CONSTRAINT "BlockedWorker_facilityUuid_fkey" FOREIGN KEY ("facilityUuid") REFERENCES "HealthCareFacility"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: reports (Workflow 3 — Analytics & Saved Reports)
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "csvData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_adminId_idx" ON "reports"("adminId");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "admins"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

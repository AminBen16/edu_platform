// packages/db/prisma/migrations/add_school_settings.sql
-- Add school settings table for professional configuration management

CREATE TABLE "SchoolSettings" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "academicYear" TEXT NOT NULL DEFAULT '2024-2025',
  "semester" TEXT NOT NULL DEFAULT 'Fall',
  "gradingScale" JSONB NOT NULL DEFAULT '{"A": 90, "B": 80, "C": 70, "D": 60, "F": 0}',
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "onlineGrading" BOOLEAN NOT NULL DEFAULT false,
  "digitalLibrary" BOOLEAN NOT NULL DEFAULT false,
  "parentPortal" BOOLEAN NOT NULL DEFAULT false,
  "schoolEmail" TEXT,
  "schoolPhone" TEXT,
  "emergencyContact" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SchoolSettings_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for schoolId
CREATE UNIQUE INDEX "SchoolSettings_schoolId_key" ON "SchoolSettings"("schoolId");

-- Add foreign key constraint
ALTER TABLE "SchoolSettings" ADD CONSTRAINT "SchoolSettings_schoolId_fkey" 
  FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

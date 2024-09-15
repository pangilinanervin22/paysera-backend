/*
  Warnings:

  - The values [PAID_TIME_OFF] on the enum `AttendanceStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `description` on the `Department` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `Department` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `firstName` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `lastName` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `middleName` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `role` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to drop the column `day` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `fixedEndTime` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `fixedStartTime` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `flexEndTime` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `flexStartTime` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `isDepartmentSchedule` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `isSoloSchedule` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `isTemplateBased` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the `SoloSchedule` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[scheduleId]` on the table `DepartmentSchedule` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `scheduleType` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `Schedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Schedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AttendanceStatus_new" AS ENUM ('BREAK', 'DONE', 'UNPAID_LEAVE', 'PAID_LEAVE', 'ONGOING');
ALTER TABLE "Attendance" ALTER COLUMN "status" TYPE "AttendanceStatus_new" USING ("status"::text::"AttendanceStatus_new");
ALTER TYPE "AttendanceStatus" RENAME TO "AttendanceStatus_old";
ALTER TYPE "AttendanceStatus_new" RENAME TO "AttendanceStatus";
DROP TYPE "AttendanceStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "DepartmentSchedule" DROP CONSTRAINT "DepartmentSchedule_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "DepartmentSchedule" DROP CONSTRAINT "DepartmentSchedule_scheduleId_fkey";

-- DropForeignKey
ALTER TABLE "SoloSchedule" DROP CONSTRAINT "SoloSchedule_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "SoloSchedule" DROP CONSTRAINT "SoloSchedule_scheduleId_fkey";

-- DropIndex
DROP INDEX "Department_name_key";

-- DropIndex
DROP INDEX "DepartmentSchedule_departmentId_scheduleId_idx";

-- DropIndex
DROP INDEX "Employee_accessLevel_isActive_idx";

-- DropIndex
DROP INDEX "fullName";

-- DropIndex
DROP INDEX "Schedule_scheduleType_day_idx";

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "scheduleType" "ScheduleType" NOT NULL,
ALTER COLUMN "date" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DEFAULT 'ONGOING',
ALTER COLUMN "lunchTimeIn" DROP NOT NULL,
ALTER COLUMN "lunchTimeIn" DROP DEFAULT,
ALTER COLUMN "lunchTimeIn" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "description",
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "DepartmentSchedule" ADD COLUMN     "name" VARCHAR(100) DEFAULT 'Department Schedule',
ADD COLUMN     "role" VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE';

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "username" TEXT NOT NULL,
ALTER COLUMN "firstName" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "lastName" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "middleName" DROP NOT NULL,
ALTER COLUMN "middleName" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "role" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE',
ALTER COLUMN "role" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "Schedule" DROP COLUMN "day",
DROP COLUMN "description",
DROP COLUMN "fixedEndTime",
DROP COLUMN "fixedStartTime",
DROP COLUMN "flexEndTime",
DROP COLUMN "flexStartTime",
DROP COLUMN "isDepartmentSchedule",
DROP COLUMN "isSoloSchedule",
DROP COLUMN "isTemplateBased",
DROP COLUMN "name",
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "lunchTimeTotal" DOUBLE PRECISION,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "scheduleType" SET DEFAULT 'FIXED';

-- DropTable
DROP TABLE "SoloSchedule";

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE INDEX "Attendance_employeeId_date_idx" ON "Attendance"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentSchedule_scheduleId_key" ON "DepartmentSchedule"("scheduleId");

-- CreateIndex
CREATE INDEX "DepartmentSchedule_departmentId_scheduleId_role_idx" ON "DepartmentSchedule"("departmentId", "scheduleId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_username_key" ON "Employee"("username");

-- CreateIndex
CREATE INDEX "Employee_accessLevel_idx" ON "Employee"("accessLevel");

-- CreateIndex
CREATE INDEX "Employee_departmentId_role_idx" ON "Employee"("departmentId", "role");

-- CreateIndex
CREATE INDEX "Schedule_startTime_endTime_idx" ON "Schedule"("startTime", "endTime");

-- AddForeignKey
ALTER TABLE "DepartmentSchedule" ADD CONSTRAINT "DepartmentSchedule_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentSchedule" ADD CONSTRAINT "DepartmentSchedule_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `created_at` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `lunch_time_total` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `over_time_total` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `time_hours_worked` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `time_in` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `time_out` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `time_total` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Attendance` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "created_at",
DROP COLUMN "lunch_time_total",
DROP COLUMN "over_time_total",
DROP COLUMN "time_hours_worked",
DROP COLUMN "time_in",
DROP COLUMN "time_out",
DROP COLUMN "time_total",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lunchTimeIn" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lunchTimeOut" TIMESTAMP(3),
ADD COLUMN     "lunchTimeTotal" DOUBLE PRECISION,
ADD COLUMN     "overTimeTotal" DOUBLE PRECISION,
ADD COLUMN     "timeHoursWorked" DOUBLE PRECISION,
ADD COLUMN     "timeIn" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "timeOut" TIMESTAMP(3),
ADD COLUMN     "timeTotal" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

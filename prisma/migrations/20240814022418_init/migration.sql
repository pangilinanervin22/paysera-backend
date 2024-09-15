-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('ADMIN', 'TEAM_LEADER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('FIXED', 'SUPER_FLEXI', 'FLEXI');

-- CreateEnum
CREATE TYPE "Day" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('BREAK', 'DONE', 'UNPAID_LEAVE', 'PAID_TIME_OFF');

-- CreateTable
CREATE TABLE "Attendance" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "time_in" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time_out" TIMESTAMP(3),
    "time_hours_worked" DOUBLE PRECISION,
    "over_time_total" DOUBLE PRECISION,
    "time_total" DOUBLE PRECISION,
    "lunch_time_total" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" SERIAL NOT NULL,
    "day" "Day" NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "scheduleType" "ScheduleType" NOT NULL,
    "fixedStartTime" TIMESTAMP(3),
    "fixedEndTime" TIMESTAMP(3),
    "flexStartTime" TIMESTAMP(3),
    "flexEndTime" TIMESTAMP(3),
    "limitWorkHoursDay" DOUBLE PRECISION,
    "allowedOvertime" BOOLEAN DEFAULT false,
    "lunchStartTime" TIMESTAMP(3),
    "lunchEndTime" TIMESTAMP(3),
    "isSoloSchedule" BOOLEAN NOT NULL DEFAULT false,
    "isDepartmentSchedule" BOOLEAN NOT NULL DEFAULT false,
    "isTemplateBased" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentSchedule" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepartmentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoloSchedule" (
    "id" SERIAL NOT NULL,
    "day" "Day" NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoloSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "passwordCredentials" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "departmentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "leaderId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Schedule_scheduleType_day_idx" ON "Schedule"("scheduleType", "day");

-- CreateIndex
CREATE INDEX "DepartmentSchedule_departmentId_scheduleId_idx" ON "DepartmentSchedule"("departmentId", "scheduleId");

-- CreateIndex
CREATE INDEX "SoloSchedule_employeeId_scheduleId_idx" ON "SoloSchedule"("employeeId", "scheduleId");

-- CreateIndex
CREATE INDEX "Employee_accessLevel_isActive_idx" ON "Employee"("accessLevel", "isActive");

-- CreateIndex
CREATE INDEX "fullName" ON "Employee"("firstName", "middleName", "lastName");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_leaderId_key" ON "Department"("leaderId");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentSchedule" ADD CONSTRAINT "DepartmentSchedule_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DepartmentSchedule" ADD CONSTRAINT "DepartmentSchedule_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SoloSchedule" ADD CONSTRAINT "SoloSchedule_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoloSchedule" ADD CONSTRAINT "SoloSchedule_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

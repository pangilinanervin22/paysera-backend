import { Attendance, ScheduleType } from "@prisma/client";
import { z } from "zod";

function validateAttendance(attendance: Attendance) {
    const attendanceSchema = z.object({
        id: z.number(),
        employeeId: z.number(),
        date: z.date(),
        status: z.enum([" BREAK", "DONE", "UNPAID_LEAVE", "PAID_LEAVE"]),
        scheduleType: z.enum(["FIXED", "SUPER_FLEXI", "FLEXI"]),
        timeIn: z.date(),
        timeOut: z.date().optional(),
        timeHoursWorked: z.number().optional(),
        overTimeTotal: z.number().optional(),
        timeTotal: z.number().optional(),
        lunchTimeIn: z.date(),
        lunchTimeOut: z.date().optional(),
        lunchTimeTotal: z.number().optional(),
        createdAt: z.date().optional(),
        updatedAt: z.date().optional(),
    });

    attendanceSchema.parse(attendance);
}

function validateCreateAttendance(attendance: any) {
    const attendanceSchema = z.object({
        employeeId: z.number(),
        date: z.date(),
        status: z.enum([" BREAK", "DONE", "UNPAID_LEAVE", "PAID_LEAVE"]),
        scheduleType: z.enum(["FIXED", "SUPER_FLEXI", "FLEXI"]),
        timeIn: z.date(),
        timeOut: z.date().optional(),
        timeHoursWorked: z.number().optional(),
        overTimeTotal: z.number().optional(),
        timeTotal: z.number().optional(),
        lunchTimeIn: z.date().optional(),
        lunchTimeOut: z.date().optional(),
        lunchTimeTotal: z.number().optional(),
        createdAt: z.date().optional(),
        updatedAt: z.date().optional(),
    }).refine(data => {
        if (data.timeOut && data.timeIn > data.timeOut) {
            return false;
        }
        if (data.lunchTimeOut && data.lunchTimeIn && data.lunchTimeIn > data.lunchTimeOut) {
            return false;
        }
        return true;
    }, {
        message: "Invalid time: Ensure timeIn is before timeOut and lunchTimeIn is before lunchTimeOut.",
    });

    attendanceSchema.parse(attendance);
}

function validateUpdateAttendance(attendance: any) {
    const attendanceSchema = z.object({
        id: z.number().optional(),
        employeeId: z.number().optional(),
        date: z.date().optional(),
        status: z.string().optional(),
        scheduleType: z.enum(["FIXED", "SUPER_FLEXI", "FLEXI"]),
        timeIn: z.date(),
        timeOut: z.date().optional(),
        timeHoursWorked: z.number().optional(),
        overTimeTotal: z.number().optional(),
        timeTotal: z.number().optional(),
        lunchTimeIn: z.date(),
        lunchTimeOut: z.date().optional(),
        lunchTimeTotal: z.number().optional(),
        createdAt: z.date().optional(),
        updatedAt: z.date().optional(),
    }).refine(data => {
        if (data.timeOut && data.timeIn > data.timeOut) {
            return false;
        }
        if (data.lunchTimeOut && data.lunchTimeIn && data.lunchTimeIn > data.lunchTimeOut) {
            return false;
        }
        return true;
    }, {
        message: "Invalid time: Ensure timeIn is before timeOut and lunchTimeIn is before lunchTimeOut.",
    });

    const result = attendanceSchema.parse(attendance);
    return result;
}


export { validateAttendance, validateUpdateAttendance, validateCreateAttendance };
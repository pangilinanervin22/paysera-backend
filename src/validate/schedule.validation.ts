import { Schedule } from "@prisma/client";
import { z } from "zod";

function validateCreateSchedule(schedule: Schedule) {

    const scheduleType = schedule.scheduleType;
    switch (scheduleType) {
        case "FIXED":
            validateFixedSchedule(schedule);
            break;
        case "SUPER_FLEXI":
            validateSuperFlexiSchedule(schedule);
            break;
        case "FLEXI":
            validateFlexiSchedule(schedule);
            break;
        default:
            throw new Error("Invalid schedule type");
    }
}

function validateFixedSchedule(schedule: Schedule & { id: number }) {
    const scheduleSchema = z.object({
        name: z.string().max(50).optional(),
        scheduleType: z.enum(["FIXED"]),
        startTime: z.date(),
        endTime: z.date(),
        limitWorkHoursDay: z.number().optional(),
        allowedOvertime: z.boolean().optional(),
        lunchStartTime: z.date().optional(),
        lunchEndTime: z.date().optional(),
    }).strict().refine((data) => {
        if (data.startTime && data.endTime) {
            return data.startTime < data.endTime;
        }
        return true;
    }, {
        message: "Invalid time range: start time must be earlier than fixed time",
        path: ["startTime", "endTime"]
    });

    scheduleSchema.parse(schedule);
}

function validateSuperFlexiSchedule(schedule: Schedule & { id: number }) {
    const scheduleSchema = z.object({
        name: z.string().max(50).optional(),
        scheduleType: z.enum(["SUPER_FLEXI"]),
        startTime: z.date(),
        endTime: z.date(),
        limitWorkHoursDay: z.number().optional(),
        allowedOvertime: z.boolean().optional(),
        lunchStartTime: z.date().optional(),
        lunchEndTime: z.date().optional(),
    }).strict().refine((data) => {
        if (data.startTime && data.endTime) {
            return data.startTime < data.endTime;
        }
        return true;
    }, {
        message: "Invalid time range: startTime must be earlier than endTime",
        path: ["startTime", "endTime"]
    });

    scheduleSchema.parse(schedule);
}

function validateFlexiSchedule(schedule: Schedule & { id: number }) {
    const scheduleSchema = z.object({
        name: z.string().max(50).optional(),
        scheduleType: z.enum(["FLEXI"]),
        startTime: z.date(),
        endTime: z.date(),
        limitWorkHoursDay: z.number().optional(),
        allowedOvertime: z.boolean().optional(),
        lunchStartTime: z.date().optional(),
        lunchEndTime: z.date().optional(),
    }).strict().refine((data) => {
        if (data.startTime && data.endTime) {
            return data.startTime < data.endTime;
        }
        return true;
    }, {
        message: "Invalid time range: startTime must be earlier than endTime",
        path: ["startTime", "endTime"]
    });

    scheduleSchema.parse(schedule);
}

function validateCreateRoleSchedule(schedule: any) {
    const scheduleSchema = z.object({
        departmentId: z.number(),
        role: z.string(),
    });

    const { departmentId, role, ...scheduleProps } = schedule;


    scheduleSchema.parse(schedule);
    validateCreateSchedule(scheduleProps);
}

function validateCreateSoloSchedule(schedule: any) {
    const scheduleSchema = z.object({
        username: z.string(),
    });

    scheduleSchema.parse(schedule);
    validateCreateSchedule(schedule);
}

export { validateCreateRoleSchedule };
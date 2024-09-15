import { prisma } from '../config/database';
import { customThrowError } from '../middlewares/errorHandler';
import { validateCreateRoleSchedule } from '../validate/schedule.validation';
import { validateUpdateRoleSchedule } from '../validate/scheduleUpdate.validation';
import { Request, Response } from 'express';

// GET /department-schedule
async function getAllDepartmentSchedules(req: Request, res: Response) {
    const departmentId = Number(req.query.departmentId);

    let departmentSchedules;
    if (departmentId) {
        if (isNaN(departmentId)) {
            return customThrowError(400, 'Department ID is invalid');
        }
        departmentSchedules = await prisma.departmentSchedule.findMany({
            where: { departmentId: departmentId },
            include: { Schedule: true }
        });
    } else {
        departmentSchedules = await prisma.departmentSchedule.findMany({
            include: { Schedule: true }
        });
    }

    res.status(200).send(departmentSchedules);
}

// GET /department-schedule/:id
async function getDepartmentScheduleById(req: Request, res: Response) {
    const departmentScheduleId = Number(req.params.id);
    if (!departmentScheduleId) {
        customThrowError(400, "Invalid department attendance ID");
    }

    const existingDepartmentSchedule = await prisma.departmentSchedule.findFirst({
        where: { id: departmentScheduleId },
        include: { Schedule: true }
    });

    if (!existingDepartmentSchedule) {
        customThrowError(404, "Solo schedule not found");
        return;
    }


    res.status(200).send(existingDepartmentSchedule);
}

// POST /department-schedule
async function createDepartmentSchedule(req: Request, res: Response) {
    validateCreateRoleSchedule({
        role: req.body.role,
        departmentId: req.body.departmentId,
        name: req.body.name,
        scheduleType: req.body.scheduleType,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
        limitWorkHoursDay: req.body.limitWorkHoursDay,
        allowedOvertime: req.body.allowedOvertime,
        lunchStartTime: new Date(req.body.lunchStartTime),
        lunchEndTime: new Date(req.body.lunchEndTime),
    });

    const departmentId = Number(req.body.departmentId) || -1;
    const department = await prisma.department.findFirst({
        where: { id: departmentId },
    });

    if (!department) {
        customThrowError(404, "Department not found");
    }

    const schedule = await prisma.schedule.create({
        data: {
            scheduleType: req.body.scheduleType,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            limitWorkHoursDay: req.body.limitWorkHoursDay,
            allowedOvertime: req.body.allowedOvertime,
            lunchStartTime: req.body.lunchStartTime,
            lunchEndTime: req.body.lunchEndTime,
        },
    });

    const departmentSchedule = await prisma.departmentSchedule.create({
        data: {
            name: req.body.name,
            departmentId: departmentId,
            scheduleId: schedule.id,
            role: String(req.body.role).toUpperCase(),
        },
    });

    res.status(201).send(departmentSchedule);
}

// PUT /department-schedule/:id
async function updateDepartmentSchedule(req: Request, res: Response) {
    const body = {
        role: req.body.role,
        name: req.body.name,
        scheduleType: req.body.scheduleType,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
        limitWorkHoursDay: req.body.limitWorkHoursDay,
        allowedOvertime: req.body.allowedOvertime,
        lunchStartTime: new Date(req.body.lunchStartTime),
        lunchEndTime: new Date(req.body.lunchEndTime),
    };

    validateUpdateRoleSchedule(body);

    const departmentScheduleId = Number(req.params.id);
    if (!departmentScheduleId) {
        customThrowError(400, "Invalid department schedule ID");
    }

    const deptSchedule = await prisma.departmentSchedule.findUnique({
        where: { id: departmentScheduleId },
    });

    if (!deptSchedule || !deptSchedule.scheduleId) {
        return customThrowError(404, "Schedule not found");
    }

    const schedule = await prisma.schedule.findUnique({
        where: { id: deptSchedule.scheduleId },
    });

    if (!schedule) {
        return customThrowError(404, "Schedule not found");
    }

    await prisma.departmentSchedule.update({
        where: { id: departmentScheduleId },
        data: {
            role: String(body.role).toUpperCase() ?? deptSchedule.role,
            name: body.name ?? deptSchedule.name,
            Schedule: {
                update: {
                    scheduleType: body.scheduleType ?? schedule.scheduleType,
                    startTime: body.startTime ?? schedule.startTime,
                    endTime: body.endTime ?? schedule.endTime,
                    limitWorkHoursDay: body.limitWorkHoursDay ?? schedule.limitWorkHoursDay,
                    allowedOvertime: body.allowedOvertime ?? schedule.allowedOvertime,
                    lunchStartTime: body.lunchStartTime ?? schedule.lunchStartTime,
                    lunchEndTime: body.lunchEndTime ?? schedule.lunchEndTime,
                },
            },
        },
    });

    res.status(201).send("Schedule updated successfully");
}


// DELETE /department-schedule/:id
async function removeScheduleFromDepartment(req: Request, res: Response) {
    const departmentScheduleId = Number(req.params.id);
    if (!departmentScheduleId) {
        customThrowError(400, "Invalid department schedule ID");
    }

    const existingDepartmentSchedule = await prisma.departmentSchedule.findUnique({
        where: { id: departmentScheduleId },
    });

    if (!existingDepartmentSchedule) {
        return customThrowError(404, "Department schedule not found");
    }

    const schedule = await prisma.schedule.findFirst({
        where: { id: existingDepartmentSchedule.scheduleId }
    });

    if (!schedule) {
        return customThrowError(404, "Schedule not found");
    }

    // delete schedule
    await prisma.schedule.delete({
        where: { id: schedule.id },
    });

    res.status(200).send("Department schedule removed successfully");
}

export default {
    getAllDepartmentSchedules,
    getDepartmentScheduleById,
    createDepartmentSchedule,
    updateDepartmentSchedule,
    removeScheduleFromDepartment,
};


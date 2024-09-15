import e, { Request, Response } from 'express';
import { prisma } from '../config/database';
import { validateCreateAttendance, validateUpdateAttendance } from '../validate/attendance.validation';
import { customThrowError } from '../middlewares/errorHandler';
import { formatDate } from '../utils/time';

async function getAllAttendance(req: Request, res: Response) {
    const allAttendance = await prisma.attendance.findMany({
        orderBy: {
            createdAt: 'asc'
        },
        include: {
            employee: {
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    middleName: true,
                    role: true,
                    accessLevel: true,
                    isActive: true,
                }
            }
        }
    });

    if (!allAttendance || allAttendance.length === 0) {
        customThrowError(404, "No attendance found");
    }

    res.status(200).send(allAttendance);
}


async function getAttendanceById(req: Request, res: Response) {
    const attendanceId = Number(req.params.id);
    if (isNaN(attendanceId)) {
        customThrowError(400, "Invalid employee ID");
    }

    const attendance = await prisma.attendance.findUnique({
        where: { id: attendanceId },
        include: {
            employee: {
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    middleName: true,
                    role: true,
                    accessLevel: true,
                    isActive: true,
                }
            }
        }
    });

    if (!attendance) {
        customThrowError(404, "Attendance not found");
    }

    res.status(200).send(attendance);
}

async function getAttendanceByEmployeeId(req: Request, res: Response) {
    const employeeId = Number(req.params.id);
    if (isNaN(employeeId)) {
        customThrowError(400, "Invalid employee ID");
    }

    const employeeExists = await prisma.employee.findUnique({
        where: { id: employeeId },
    });

    if (!employeeExists) {
        customThrowError(404, "Employee not found");
    }

    const employeeAttendance = await prisma.attendance.findMany({
        where: { employeeId: employeeId },
        orderBy: {
            date: 'asc',
        },
    });

    if (!employeeAttendance || employeeAttendance.length === 0) {
        customThrowError(404, "No attendance records found for this employee");
    }

    res.status(200).send(employeeAttendance);
}

async function createAttendance(req: Request, res: Response) {
    const body = {
        employeeId: req.body.employeeId,
        date: new Date(req.body.date),
        status: req.body.status,
        scheduleType: req.body.scheduleType,
        timeIn: new Date(req.body.timeIn),
        timeOut: new Date(req.body.timeOut),
        lunchTimeIn: new Date(req.body.lunchTimeIn),
        lunchTimeOut: new Date(req.body.lunchTimeOut),
        overtimeTotal: req.body.overtimeTotal,
    }

    validateCreateAttendance(body);

    const employeeExists = await prisma.employee.findUnique({
        where: { id: body.employeeId },
    });

    if (!employeeExists) {
        customThrowError(404, 'Employee not found');
    } ``

    const currentAttendance = await prisma.attendance.findFirst({
        where: {
            employeeId: body.employeeId,
            date: formatDate(body.date),
        },
    });

    if (currentAttendance) {
        customThrowError(400, 'Attendance that day record already exists');
    }

    let totalHours = 0;
    let totalHoursWorked = 0;
    let totalLunchHours = 0;

    if (body.timeOut && body.lunchTimeOut) {
        totalHours = (body.timeOut.getTime() - body.timeIn.getTime()) / 1000 / 60 / 60;
        totalLunchHours = (body.lunchTimeOut.getTime() - body.lunchTimeIn.getTime()) / 1000 / 60 / 60;
        totalHoursWorked = totalHours - totalLunchHours;
    }

    await prisma.attendance.create({
        data: {
            employeeId: body.employeeId,
            date: formatDate(body.date),
            status: body.status,
            scheduleType: body.scheduleType,
            timeIn: body.timeIn,
            timeOut: body.timeOut,
            lunchTimeIn: body.lunchTimeIn,
            lunchTimeOut: body.lunchTimeOut,
            overTimeTotal: body.overtimeTotal,
            timeHoursWorked: totalHoursWorked,
            timeTotal: totalHours,
            lunchTimeTotal: totalLunchHours,
        },
    });

    res.status(201).send("Attendance record created successfully");
}

async function updateAttendance(req: Request, res: Response) {
    const attendanceId = Number(req.params.id);
    if (isNaN(attendanceId)) {
        customThrowError(400, "Invalid attendance ID");
    }

    const body = {
        employeeId: req.body.employeeId,
        date: new Date(req.body.date),
        status: req.body.status,
        scheduleType: req.body.scheduleType,
        timeIn: new Date(req.body.timeIn),
        timeOut: new Date(req.body.timeOut),
        lunchTimeIn: new Date(req.body.lunchTimeIn),
        lunchTimeOut: new Date(req.body.lunchTimeOut),
        overTimeTotal: req.body.overTimeTotal,
    }

    validateUpdateAttendance(body);

    const existingAttendance = await prisma.attendance.findUnique({
        where: { id: attendanceId },
    });


    if (!existingAttendance) {
        return customThrowError(404, "Attendance record not found");
    }

    let totalHours = 0;
    let totalHoursWorked = 0;
    let totalLunchHours = 0;

    // Calculate total hours worked and lunch hours
    if (body.timeOut && body.lunchTimeOut) {
        totalHours = (body.timeOut.getTime() - body.timeIn.getTime()) / 1000 / 60 / 60;
        totalLunchHours = (body.lunchTimeOut.getTime() - body.lunchTimeIn.getTime()) / 1000 / 60 / 60;
        totalHoursWorked = totalHours - totalLunchHours + body.overTimeTotal;
        totalHours += body.overTimeTotal;
    }

    await prisma.attendance.update({
        where: { id: attendanceId },
        data: {
            date: formatDate(body.date ?? existingAttendance.date),
            status: body.status ?? existingAttendance.status,
            timeOut: body.timeOut ?? existingAttendance.timeOut,
            timeIn: body.timeIn ?? existingAttendance.timeIn,
            lunchTimeIn: body.lunchTimeIn ?? existingAttendance.lunchTimeIn,
            lunchTimeOut: body.lunchTimeOut ?? existingAttendance.lunchTimeOut,
            timeTotal: totalHours ?? existingAttendance.timeTotal,
            overTimeTotal: body.overTimeTotal ?? existingAttendance.overTimeTotal,
            timeHoursWorked: totalHoursWorked ?? existingAttendance.timeHoursWorked,
            lunchTimeTotal: totalLunchHours ?? existingAttendance.lunchTimeTotal,
        },
    });

    res.status(200).send("Attendance record updated successfully");
}

async function updateAttendanceByEmployeeId(req: Request, res: Response) {
    const employeeId = Number(req.params.id);
    if (isNaN(employeeId)) {
        customThrowError(400, "Invalid employee ID");
    }

    const isValid = validateUpdateAttendance(req.body);

    if (!isValid) {
        customThrowError(400, "Invalid input");
    }

    const existingAttendance = await prisma.attendance.findFirst({
        where: { employeeId: employeeId },
    });

    if (!existingAttendance) {
        customThrowError(404, "Attendance record not found for this employee");
        return;
    }

    let totalHours = 0;
    let totalHoursWorked = 0;
    let totalLunchHours = 0;

    if (req.body.timeOut && req.body.lunchTimeOut) {
        totalHours = (req.body.timeOut.getTime() - req.body.timeIn.getTime()) / 1000 / 60 / 60;
        totalLunchHours = (req.body.lunchTimeOut.getTime() - req.body.lunchTimeIn.getTime()) / 1000 / 60 / 60;
        totalHoursWorked = totalHours - totalLunchHours;
    }

    await prisma.attendance.update({
        where: {
            id: existingAttendance.id,
            employeeId: employeeId,
        },
        data: {
            status: req.body.status ?? existingAttendance.status,
            timeOut: req.body.timeOut ?? existingAttendance.timeOut,
            timeHoursWorked: totalHours ?? existingAttendance.timeHoursWorked,
            overTimeTotal: req.body.overTimeTotal ?? existingAttendance.overTimeTotal,
            timeTotal: totalHours ?? existingAttendance.timeTotal,
            lunchTimeOut: req.body.lunchTimeOut ?? existingAttendance.lunchTimeOut,
            lunchTimeTotal: totalHoursWorked ?? existingAttendance.lunchTimeTotal,

        },
    });

    res.status(200).send("Attendance record updated successfully");
}

async function deleteAttendance(req: Request, res: Response) {
    const attendanceId = Number(req.params.id);

    if (isNaN(attendanceId)) {
        customThrowError(400, "Invalid attendance ID");
    }

    const existingAttendance = await prisma.attendance.findUnique({
        where: { id: attendanceId },
    });

    if (!existingAttendance) {
        customThrowError(404, "Attendance record not found");
    }

    await prisma.attendance.delete({
        where: { id: attendanceId },
    });

    res.status(200).send("Attendance record deleted successfully");
}

export default {
    getAllAttendance,
    getAttendanceById,
    getAttendanceByEmployeeId,
    createAttendance,
    updateAttendance,
    updateAttendanceByEmployeeId,
    deleteAttendance,
};
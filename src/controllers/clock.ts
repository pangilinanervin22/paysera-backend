import { differenceInHours, differenceInMinutes, format, isAfter, isBefore, set } from 'date-fns';
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { customThrowError } from '../middlewares/errorHandler';
import { formatDate } from '../utils/time';


// POST /api / attendance / time -in
async function timeIn(req: Request, res: Response) {
    const body = {
        employeeId: req.body.employeeId,
        timeIn: new Date(req.body.timeIn),
    };

    // Validate input
    if (!body.employeeId || !body.timeIn || isNaN(body.timeIn.getTime())) {
        return customThrowError(400, 'Invalid time in');
    }

    // Check if the employee exists
    const employeeExists = await prisma.employee.findUnique({
        where: { id: body.employeeId },
    });

    if (!employeeExists) {
        return customThrowError(404, 'Employee not found');
    } else if (!employeeExists.role || !employeeExists.departmentId) {
        return customThrowError(400, 'Employee is not assigned to a department');
    }

    // Retrieve the employee's schedule based on role and department
    const employeeSchedule = await prisma.departmentSchedule.findFirst({
        where: {
            role: employeeExists.role,
            departmentId: employeeExists.departmentId,
        },
        select: {
            Schedule: true,
        },
    });

    if (!employeeSchedule || !employeeSchedule.Schedule) {
        return customThrowError(400, 'Schedule not found');
    }

    const schedule = employeeSchedule.Schedule;

    // Check if the employee has already clocked in today
    const currentAttendance = await prisma.attendance.findFirst({
        where: {
            employeeId: body.employeeId,
            date: formatDate(body.timeIn),
        },
    });

    if (currentAttendance) {
        return customThrowError(400, 'Employee is already clocked in today');
    }

    let effectiveTimeIn = body.timeIn;
    // Adjust timeIn if it's earlier than the scheduled time
    if (schedule.scheduleType === 'FIXED' && body.timeIn < schedule.startTime) {
        effectiveTimeIn = schedule.startTime;
    }

    // Create the attendance record with the formatted date
    await prisma.attendance.create({
        data: {
            employeeId: body.employeeId,
            date: formatDate(body.timeIn),
            status: 'ONGOING',
            scheduleType: schedule.scheduleType,
            timeIn: effectiveTimeIn,
        },
    });

    // Update the employee's active status
    await prisma.employee.update({
        where: { id: body.employeeId },
        data: { isActive: true },
    });

    res.status(201).send("Attendance record created successfully");
}

// POST /api/attendance/time-out
async function timeOut(req: Request, res: Response) {
    const body = {
        employeeId: req.body.employeeId,
        timeOut: new Date(req.body.timeOut),
    };

    if (isNaN(body.timeOut.getTime())) {
        return customThrowError(400, 'Invalid time out');
    }

    // Validate input
    if (!body.employeeId || !body.timeOut) {
        return customThrowError(400, 'Employee ID and time out are required');
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
        where: { id: body.employeeId },
    });

    if (!employee) {
        return customThrowError(404, 'Employee not found');
    } else if (!employee.role || !employee.departmentId) {
        return customThrowError(400, 'Employee is not assigned to a department');
    }

    // Get employee's schedule
    const employeeSchedule = await prisma.departmentSchedule.findFirst({
        where: {
            role: employee.role,
            departmentId: employee.departmentId,
        },
        select: { Schedule: true },
    });

    const schedule = employeeSchedule?.Schedule;

    if (!schedule) {
        return customThrowError(400, 'Employee schedule not found');
    }

    // Fetch current attendance record
    const currentAttendance = await prisma.attendance.findFirst({
        where: {
            employeeId: body.employeeId,
            date: format(body.timeOut, 'MMMM d, yyyy'),
        },
    });

    if (!currentAttendance || currentAttendance.timeOut) {
        return customThrowError(400, 'Attendance record not found or already clocked out');
    }

    // Adjust to only compare time part of the day
    const timeIn = new Date(currentAttendance.timeIn);

    // Reset the schedule end time to match the correct day
    const scheduleEndTime = set(new Date(schedule.endTime), {
        date: timeIn.getDate(),
    });

    // Calculate total worked hours in minutes
    let totalMinutesWorked = differenceInMinutes(body.timeOut, timeIn);
    let totalTime;
    totalTime = differenceInMinutes(body.timeOut, timeIn);
    totalTime = totalTime / 60; // Convert minutes to hours

    // Subtract lunch time from total working hours
    if (currentAttendance.lunchTimeTotal) {
        totalMinutesWorked -= currentAttendance.lunchTimeTotal * 60; // Convert lunchTimeTotal to minutes
    }

    let totalHoursWorked = totalMinutesWorked / 60;

    // Initialize overtime to 0
    let overtimeTotal = 0;

    // Fixed schedule: Adjust total hours and prevent overtime if not allowed
    if (schedule.scheduleType === 'FIXED') {
        // Check if the timeOut exceeds the schedule end time
        if (isAfter(body.timeOut, scheduleEndTime)) {
            if (schedule.allowedOvertime) {
                // Calculate overtime if allowed
                const overtimeMinutes = differenceInMinutes(body.timeOut, scheduleEndTime);
                overtimeTotal = overtimeMinutes / 60; // Convert minutes to hours
            } else {
                // If overtime is not allowed, set timeOut to the schedule end time
                body.timeOut = scheduleEndTime;
                totalHoursWorked = differenceInMinutes(body.timeOut, timeIn) - ((currentAttendance.lunchTimeTotal || 0) * 60);
                totalHoursWorked = totalHoursWorked / 60;
            }
        } else {
            totalHoursWorked = differenceInMinutes(body.timeOut, timeIn) - ((currentAttendance.lunchTimeTotal || 0) * 60);
            totalHoursWorked = totalHoursWorked / 60;
        }
    }

    // For flexi and super flexi schedules, we just calculate overtime if applicable
    if (schedule.scheduleType === 'SUPER_FLEXI' || schedule.scheduleType === 'FLEXI') {
        if (isAfter(body.timeOut, scheduleEndTime)) {
            const overtimeMinutes = differenceInMinutes(body.timeOut, scheduleEndTime);
            overtimeTotal = overtimeMinutes / 60; // Convert minutes to hours
        }
    }

    // Update attendance record with correct total hours and overtime
    await prisma.attendance.update({
        where: { id: currentAttendance.id },
        data: {
            timeOut: body.timeOut,
            timeHoursWorked: totalHoursWorked,  // Regular hours worked
            overTimeTotal: overtimeTotal,       // Overtime worked (if any)
            timeTotal: totalTime,               // Total hours worked
            status: 'DONE',
        },
    });

    res.status(200).send('Attendance updated');
}


// POST /api/attendance/lunch-in
async function lunchIn(req: Request, res: Response) {
    const body = {
        employeeId: req.body.employeeId,
        lunchTimeIn: new Date(req.body.lunchTimeIn),
    };

    if (isNaN(body.lunchTimeIn.getTime())) {
        return customThrowError(400, 'Invalid lunch time in');
    }

    // Validate input
    if (!body.employeeId || !body.lunchTimeIn) {
        return customThrowError(400, 'Employee ID and lunch time in are required');
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
        where: { id: body.employeeId },
    });

    if (!employee) {
        return customThrowError(404, 'Employee not found');
    } else if (!employee.role || !employee.departmentId) {
        return customThrowError(400, 'Employee is not assigned to a department');
    }

    // Fetch current attendance record
    const currentAttendance = await prisma.attendance.findFirst({
        where: {
            employeeId: body.employeeId,
            date: format(body.lunchTimeIn, 'MMMM d, yyyy'),
        },
    });

    if (!currentAttendance) {
        return customThrowError(400, 'Attendance record not found');
    } else if (currentAttendance.lunchTimeIn) {
        return customThrowError(400, 'Lunch has already started');
    }

    const employeeSchedule = await prisma.departmentSchedule.findFirst({
        where: {
            role: employee.role,
            departmentId: employee.departmentId,
        },
        select: { Schedule: true },
    });

    const schedule = employeeSchedule?.Schedule;

    if (!schedule) {
        return customThrowError(400, 'Employee schedule not found');
    }

    // validate if scheduled of lunch time in is valid
    if (schedule.scheduleType === 'FIXED') {
        if (isBefore(body.lunchTimeIn, schedule.lunchStartTime!)) {
            return customThrowError(400, 'Lunch time in is too early');
        } else if (isAfter(body.lunchTimeIn, schedule.lunchEndTime!)) {
            return customThrowError(400, 'Lunch time in is too late');
        }
    }

    // Update attendance record with lunchTimeIn
    await prisma.attendance.update({
        where: { id: currentAttendance.id },
        data: {
            lunchTimeIn: body.lunchTimeIn,
        },
    });

    res.status(200).send('Lunch time in recorded');
}


// POST /api/attendance/lunch-out
async function lunchOut(req: Request, res: Response) {
    const body = {
        employeeId: req.body.employeeId,
        lunchTimeOut: new Date(req.body.lunchTimeOut),
    };

    if (isNaN(body.lunchTimeOut.getTime())) {
        return customThrowError(400, 'Invalid lunch time out');
    }

    // Validate input
    if (!body.employeeId || !body.lunchTimeOut) {
        return customThrowError(400, 'Employee ID and lunch time out are required');
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
        where: { id: body.employeeId },
    });

    if (!employee) {
        return customThrowError(404, 'Employee not found');
    }

    // Fetch current attendance record
    const currentAttendance = await prisma.attendance.findFirst({
        where: {
            employeeId: body.employeeId,
            date: format(body.lunchTimeOut, 'MMMM d, yyyy'),
        },
    });

    if (!currentAttendance || !currentAttendance.lunchTimeIn) {
        return customThrowError(400, 'Lunch has not been started');
    } else if (currentAttendance.lunchTimeOut) {
        return customThrowError(400, 'Lunch has already out');
    }

    // Calculate the total lunch duration in minutes
    const lunchTimeIn = new Date(currentAttendance.lunchTimeIn);
    const totalLunchMinutes = differenceInMinutes(body.lunchTimeOut, lunchTimeIn);
    const totalLunchHours = totalLunchMinutes / 60;

    // Update attendance record with lunchTimeOut and lunchTimeTotal
    await prisma.attendance.update({
        where: { id: currentAttendance.id },
        data: {
            lunchTimeOut: body.lunchTimeOut,
            lunchTimeTotal: totalLunchHours, // Total lunch break duration
        },
    });

    res.status(200).send('Lunch time out recorded');
}

export { timeIn, timeOut, lunchIn, lunchOut };
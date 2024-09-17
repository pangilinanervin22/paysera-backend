import { differenceInHours, differenceInMinutes, format, getHours, getMinutes, isAfter, isBefore, set } from 'date-fns';
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { customThrowError } from '../middlewares/errorHandler';
import { formatDate } from '../utils/time';


// POST /api / attendance / time -in
async function timeIn(req: Request, res: Response) {
    const body = {
        employeeId: req.body.employeeId,
        timeIn: new Date(req.body.timeStamp),
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
        // Update the existing attendance record
        if (currentAttendance.status === 'BREAK') {
            return customThrowError(400, 'Time currently on break');
        }

        await prisma.attendance.update({
            where: { id: currentAttendance.id },
            data: {
                status: 'ONGOING',
                timeOut: null,
                timeHoursWorked: 0,
                overTimeTotal: 0,
                timeTotal: 0,
            },
        });
    } else {
        let effectiveTimeIn = body.timeIn;

        // Extract hour and minute from the employee's time in
        const timeInHour = getHours(body.timeIn);
        const timeInMinute = getMinutes(body.timeIn);

        // Schedule start time with only hour and minute
        const scheduledStartTime = set(new Date(), {
            hours: getHours(schedule.startTime),
            minutes: getMinutes(schedule.startTime),
            seconds: 0,
            milliseconds: 0,
        });

        // Compare only time (ignoring the exact date)
        if (schedule.scheduleType === 'FIXED' && isBefore(body.timeIn, scheduledStartTime)) {
            effectiveTimeIn = scheduledStartTime;
        }

        // Create a new attendance record with the formatted date
        await prisma.attendance.create({
            data: {
                employeeId: body.employeeId,
                date: format(body.timeIn, 'MMMM d, yyyy'), // Format date for the record
                status: 'ONGOING',
                scheduleType: schedule.scheduleType,
                timeIn: effectiveTimeIn,
            },
        });
    }

    // Update the employee's active status
    await prisma.employee.update({
        where: { id: body.employeeId },
        data: { isActive: true },
    });

    res.status(200).send("Attendance record successfully created");
}

// POST /api/attendance/time-out
async function timeOut(req: Request, res: Response) {
    const body = {
        employeeId: req.body.employeeId,
        timeOut: new Date(req.body.timeStamp),
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

    if (!currentAttendance) {
        return customThrowError(400, 'Attendance record not found or already clocked out');
    } else if (currentAttendance.timeOut) {
        return customThrowError(400, 'Already clocked out');
    } else if (!currentAttendance.timeIn) {
        return customThrowError(400, 'Time in is required');
    } else if (currentAttendance.status === 'BREAK') {
        return customThrowError(400, 'Time currently on break');
    }

    const timeIn = new Date(currentAttendance.timeIn);

    // Use only time components for calculations
    const timeInFixed = set(new Date(), { hours: getHours(timeIn), minutes: getMinutes(timeIn), seconds: 0, milliseconds: 0 });
    const timeOutFixed = set(new Date(), { hours: getHours(body.timeOut), minutes: getMinutes(body.timeOut), seconds: 0, milliseconds: 0 });

    // Calculate total minutes worked
    const totalMinutesWorked = differenceInMinutes(timeOutFixed, timeInFixed);

    // Subtract lunch time from total working hours
    let totalMinutesAfterLunch = totalMinutesWorked;
    if (currentAttendance.lunchTimeTotal) {
        totalMinutesAfterLunch -= currentAttendance.lunchTimeTotal * 60; // Convert lunchTimeTotal to minutes
    }

    const totalHoursWorked = totalMinutesAfterLunch / 60;

    // Reset the schedule end time to only compare the time (hour and minute)
    const scheduleEndTime = set(new Date(), {
        hours: getHours(schedule.endTime),
        minutes: getMinutes(schedule.endTime),
        seconds: 0,
        milliseconds: 0,
    });

    let overtimeTotal = 0;

    // Fixed schedule: Adjust total hours and prevent overtime if not allowed
    if (schedule.scheduleType === 'FIXED') {
        if (isAfter(timeOutFixed, scheduleEndTime)) {
            if (schedule.allowedOvertime) {
                const overtimeMinutes = differenceInMinutes(timeOutFixed, scheduleEndTime);
                overtimeTotal = overtimeMinutes / 60;
            } else {
                body.timeOut = scheduleEndTime;
            }
        }
    }

    // Update attendance record with correct total hours and overtime
    await prisma.attendance.update({
        where: { id: currentAttendance.id },
        data: {
            timeOut: body.timeOut,
            timeHoursWorked: totalHoursWorked,  // Regular hours worked
            overTimeTotal: overtimeTotal,       // Overtime worked (if any)
            timeTotal: totalMinutesWorked / 60,      // Total time worked before lunch deduction
            status: 'DONE',
        },
    });

    // Update the employee's active status
    await prisma.employee.update({
        where: { id: body.employeeId },
        data: { isActive: false },
    });

    res.status(200).send('Attendance updated');
}

// POST /api/attendance/lunch-in
async function lunchIn(req: Request, res: Response) {
    const body = {
        employeeId: req.body.employeeId,
        lunchTimeIn: new Date(req.body.timeStamp),
    };

    if (body.lunchTimeIn.toString() === 'Invalid Date') {
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
            date: format(body.lunchTimeIn, 'MMMM d, yyyy'), // format date for comparison
        },
    });

    if (!currentAttendance) {
        return customThrowError(400, 'Attendance record not found');
    } else if (currentAttendance.timeOut) {
        return customThrowError(400, 'Already clocked out');
    } else if (currentAttendance.status === 'BREAK') {
        return customThrowError(400, 'Time currently on break');
    }

    const currentSchedule = await prisma.departmentSchedule.findFirst({
        where: {
            role: employee.role,
            departmentId: employee.departmentId,
        },
        select: { Schedule: true },
    });

    const schedule = currentSchedule?.Schedule;

    if (!schedule) {
        return customThrowError(400, 'Employee schedule not found');
    }

    // Use date-fns to compare only hours and minutes
    const lunchStartTime = set(new Date(), {
        hours: getHours(schedule.lunchStartTime!),
        minutes: getMinutes(schedule.lunchStartTime!),
        seconds: 0,
        milliseconds: 0,
    });

    const lunchEndTime = set(new Date(), {
        hours: getHours(schedule.lunchEndTime!),
        minutes: getMinutes(schedule.lunchEndTime!),
        seconds: 0,
        milliseconds: 0,
    });

    const lunchTimeIn = set(new Date(), {
        hours: getHours(body.lunchTimeIn),
        minutes: getMinutes(body.lunchTimeIn),
        seconds: 0,
        milliseconds: 0,
    });

    // Validate if lunch time in is within the scheduled time
    if (schedule.scheduleType === 'FIXED') {
        if (getHours(lunchTimeIn) < getHours(lunchStartTime)) {
            return customThrowError(400, 'Lunch time in is too early');
        } else if (getHours(lunchTimeIn) > getHours(lunchEndTime)) {
            return customThrowError(400, 'Lunch time in is too late');
        }
    }

    // if lunch has already started just resume
    body.lunchTimeIn = currentAttendance.lunchTimeIn || body.lunchTimeIn;

    // Update attendance record with lunchTimeIn
    await prisma.attendance.update({
        where: { id: currentAttendance.id },
        data: {
            lunchTimeIn: body.lunchTimeIn,
            lunchTimeOut: null,
            lunchTimeTotal: 0,
            status: 'BREAK',
        },
    });

    res.status(200).send('Lunch time in recorded');
}


// POST /api/attendance/lunch-out
async function lunchOut(req: Request, res: Response) {
    const body = {
        employeeId: req.body.employeeId,
        lunchTimeOut: new Date(req.body.timeStamp),
    };

    if (body.lunchTimeOut.toString() === 'Invalid Date') {
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
    } else if (!employee.role || !employee.departmentId) {
        return customThrowError(400, 'Employee is not assigned to a department');
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
        return customThrowError(400, 'Lunch has already ended');
    } else if (currentAttendance.timeOut) {
        return customThrowError(400, 'Already clocked out');
    }

    // get current schedule
    const employeeSchedule = await prisma.departmentSchedule.findFirst({
        where: {
            role: employee.role,
            departmentId: employee.departmentId,
        },
        select: { Schedule: true },
    });

    // validate lunch time out if it is within the scheduled time
    const schedule = employeeSchedule?.Schedule;
    if (!schedule) {
        return customThrowError(400, 'Employee schedule not found');
    }

    // Use date-fns to compare only hours and minutes for scheduled lunch out
    const scheduleLunchEndTime = set(new Date(), {
        hours: getHours(schedule.lunchEndTime!),
        minutes: getMinutes(schedule.lunchEndTime!),
        seconds: 0,
        milliseconds: 0,
    });

    // Use date-fns to compare only hours and minutes for lunch time out
    const scheduledLunchTimeout = set(new Date(), {
        hours: getHours(body.lunchTimeOut),
        minutes: getMinutes(body.lunchTimeOut),
        seconds: 0,
        milliseconds: 0,
    });

    // if lunch time out is later than the scheduled time set the lunch time out to the scheduled time
    if (schedule.scheduleType === 'FIXED' && isAfter(scheduledLunchTimeout, scheduleLunchEndTime)) {
        body.lunchTimeOut = scheduleLunchEndTime;
    }

    // Use date-fns to compare only hours and minutes for lunch time in
    const currentLunchTimeIn = set(new Date(), {
        hours: getHours(currentAttendance.lunchTimeIn),
        minutes: getMinutes(currentAttendance.lunchTimeIn),
        seconds: 0,
        milliseconds: 0,
    });

    // Calculate the total lunch duration in minutes
    const totalLunchMinutes = differenceInMinutes(scheduledLunchTimeout, currentLunchTimeIn);
    const totalLunchHours = totalLunchMinutes / 60;

    // Update attendance record with lunchTimeOut and lunchTimeTotal
    await prisma.attendance.update({
        where: { id: currentAttendance.id },
        data: {
            lunchTimeOut: body.lunchTimeOut,
            lunchTimeTotal: totalLunchHours, // Total lunch break duration in hours
            status: 'ONGOING',
        },
    });

    res.status(200).send('Lunch time out recorded');
}

// GET /api/attendance/today/:id
async function getAttendanceOfEmployeeToday(req: Request, res: Response) {
    const employeeId = Number(req.params.id);

    if (!employeeId) {
        return customThrowError(400, 'Employee ID is required');
    }

    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
    });

    if (!employee) {
        return customThrowError(404, 'Employee not found');
    }

    // Fetch the attendance record of the employee today date
    const attendance = await prisma.attendance.findFirst({
        where: {
            employeeId: employee.id,
            date: format(new Date(), 'MMMM d, yyyy'),
        },
    });

    if (!attendance) {
        return customThrowError(404, 'Attendance record not found');
    }

    res.status(200).send(attendance);
}

export { timeIn, timeOut, lunchIn, lunchOut, getAttendanceOfEmployeeToday };
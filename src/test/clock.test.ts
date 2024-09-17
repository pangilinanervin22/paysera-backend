// tests/attendance.test.ts
import request from 'supertest';
import app from '..'; // Adjust the path to your Express app
import { prisma } from '../config/database';
import { formatDate } from 'date-fns';
import e from 'express';

describe('Attendance Routes', () => {
    let employeeId: number;
    let departmentId: number;
    let departmentScheduleId: number;
    let timeIn: Date;
    let lunchTimeIn: Date;
    let lunchTimeOut: Date;

    beforeAll(async () => {
        // Create a department
        const department = await prisma.department.create({
            data: {
                name: 'IT Department',
            },
        });

        departmentId = department.id;

        // Create a department schedule
        const fixedSchedule = await prisma.schedule.create({
            data: {
                scheduleType: 'FIXED',
                startTime: new Date(2020, 8, 15, 8, 0, 0),  // 8:00 AM
                endTime: new Date(2021, 8, 15, 17, 0, 0),   // 5:00 PM
                lunchStartTime: new Date(2020, 8, 15, 12, 0, 0),   // 12:00 PM
                lunchEndTime: new Date(2021, 8, 15, 13, 0, 0),   // 1:00 PM
                limitWorkHoursDay: 9,
                allowedOvertime: false,
                DepartmentSchedule: {
                    create: {
                        departmentId,
                        role: 'Programmer',
                    },
                },
            },
        });

        departmentScheduleId = fixedSchedule.id;

        // Create an employee and set a time-in record to use in tests
        const employee = await prisma.employee.create({
            data: {
                role: 'Programmer',
                departmentId,
                username: 'clock',
                passwordCredentials: 'password',
                firstName: 'Clock',
                lastName: 'In',
                middleName: 'Out',
                accessLevel: 'EMPLOYEE',
            },
        });
        employeeId = employee.id;
    });

    describe('POST /api/attendance/time-in', () => {
        it('should record time in successfully', async () => {
            timeIn = new Date(2024, 8, 15, 8, 0, 0);

            console.log(timeIn, "timeIn");

            // get timeIn AM and PM format
            const timeInAMPM = formatDate(timeIn, 'hh:mm a');
            console.log(timeInAMPM, "starting time");



            const res = await request(app)
                .post('/api/attendance/time-in')
                .send({
                    employeeId,
                    timeStamp: timeIn,
                });

            const attendance = await prisma.attendance.findFirst({
                where: { employeeId },
            });

            expect(res.status).toBe(200);
            expect(attendance?.date).toBe(formatDate(timeIn, 'MMMM d, yyyy'));
            // compare hours and minutes only using date-fns
            expect(formatDate(attendance?.timeIn!, 'hh:mm a')).toBe(formatDate(timeIn, 'hh:mm a'));
        });

        it('should return 200 because already time-in', async () => {
            const res = await request(app)
                .post('/api/attendance/time-in')
                .send({
                    employeeId,
                    timeStamp: timeIn,
                });

            expect(res.status).toBe(200);
        });

        it('should return 400 if timeIn is missing', async () => {
            const res = await request(app)
                .post('/api/attendance/time-in')
                .send({
                    employeeId,
                });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/attendance/lunch-in', () => {
        it('should record lunch in successfully', async () => {
            lunchTimeIn = new Date(2024, 8, 15, 12, 0, 0);  // get the current time 1 hour after timeIn

            const respond = await request(app)
                .post('/api/attendance/lunch-in')
                .send({
                    employeeId,
                    timeStamp: lunchTimeIn,
                }).expect(200);

            const attendance = await prisma.attendance.findFirst({
                where: { employeeId },
            });

            console.log(attendance, "attendance lunch in");

        });

        it('should return 400 already lunch-in', async () => {
            const res = await request(app)
                .post('/api/attendance/lunch-in')
                .send({
                    employeeId,
                    lunchTimeIn: lunchTimeIn,
                });

            expect(res.status).toBe(400);
        });

        it('should return 400 if lunchTimeIn is missing', async () => {
            const res = await request(app)
                .post('/api/attendance/lunch-in')
                .send({
                    employeeId,
                });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/attendance/lunch-out', () => {
        it('should record lunch out successfully', async () => {
            lunchTimeOut = new Date(lunchTimeIn.getTime() + 3600 * 1000); // 1 hour after lunchTimeIn

            const res = await request(app)
                .post('/api/attendance/lunch-out')
                .send({
                    employeeId,
                    timeStamp: lunchTimeOut,
                }).expect(200);

            const attendance = await prisma.attendance.findFirst({
                where: { employeeId },
            });
            expect(attendance?.lunchTimeOut?.toISOString()).toBe(lunchTimeOut.toISOString());
        });

        it('should return 400 already lunch out', async () => {
            const res = await request(app)
                .post('/api/attendance/lunch-out')
                .send({
                    employeeId,
                    timeStamp: lunchTimeOut,
                });

            expect(res.status).toBe(400);
        });

        it('should return 400 if lunchTimeOut is missing', async () => {
            const res = await request(app)
                .post('/api/attendance/lunch-out')
                .send({
                    employeeId,
                });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/attendance/time-out', () => {
        it('should record time out successfully', async () => {
            const timeOut = new Date(timeIn.getTime() + 3600 * 9000); // 9 hours after timeIn

            const res = await request(app)
                .post('/api/attendance/time-out')
                .send({
                    employeeId,
                    timeStamp: timeOut,
                }).expect(200);

            const attendance = await prisma.attendance.findFirst({
                where: {
                    employeeId,
                    date: formatDate(timeIn, 'MMMM d, yyyy')
                },
            });

            console.log(attendance, "attendance done");


            expect(attendance?.status).toBe('DONE');
            expect(attendance?.date).toBe(formatDate(timeOut, 'MMMM d, yyyy'));
            expect(attendance?.lunchTimeTotal).toBe(1);
            expect(attendance?.timeHoursWorked).toBeLessThanOrEqual(8);
            expect(attendance?.timeTotal).toBe(9);
        });

        it('should return 400 already timeout', async () => {
            const res = await request(app)
                .post('/api/attendance/time-out')
                .send({
                    employeeId,
                    date: formatDate(timeIn, 'MMMM d, yyyy')
                });

            expect(res.status).toBe(400);
        });

        it('should return 400 if timeOut is missing', async () => {
            const res = await request(app)
                .post('/api/attendance/time-out')
                .send({
                    employeeId,
                });

            expect(res.status).toBe(400);
        });
    });

});

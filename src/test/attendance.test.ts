import request from 'supertest';
import app from '..';
import { Attendance } from '@prisma/client';
import { prisma } from '../config/database';

describe('Department Attendance Routes', () => {
    let attendance: Attendance[];
    it('should return a list of Attendance', async () => {
        const response = await request(app).get('/api/attendance').expect(200);
        expect(response.body.length).toBeGreaterThanOrEqual(1);
        attendance = response.body;
    });

    it('should return a attendance by id', async () => {
        const response = await request(app).get(`/api/attendance/${attendance[0].id}`).expect(200);

        expect(response.body).toHaveProperty('id');
    });

    it('should create a new attendance record', async () => {
        const employee = await prisma.employee.findFirst();

        const newAttendance = {
            employeeId: employee?.id,
            date: new Date(),
            status: 'DONE',
            scheduleType: 'FIXED',
            timeIn: new Date('2024-09-09T08:00:00Z'),
            timeOut: new Date('2024-09-09T19:00:00Z'),
            timeHoursWorked: 8,
            overTimeTotal: 0,
            timeTotal: 8,
            lunchTimeIn: new Date('2024-09-01T12:00:00Z'),
            lunchTimeOut: new Date('2024-09-01T13:00:00Z'),
            lunchTimeTotal: 1,
        };

        await request(app)
            .post('/api/attendance')
            .send(newAttendance)
            .expect(201);
    });

    it('should update an attendance record', async () => {
        const employee = await prisma.employee.findFirst();

        const newAttendance = {
            employeeId: employee?.id,
            date: new Date(),
            status: 'DONE',
            scheduleType: 'FIXED',
            timeIn: new Date('2024-09-09T08:00:00Z'),
            timeOut: new Date('2024-09-09T19:00:00Z'),
            timeHoursWorked: 8,
            overTimeTotal: 0,
            timeTotal: 8,
            lunchTimeIn: new Date('2024-09-01T12:00:00Z'),
            lunchTimeOut: new Date('2024-09-01T13:00:00Z'),
            lunchTimeTotal: 1,
        };
        const attendance = await prisma.attendance.findFirst();

        const updatedAttendance = {
            ...newAttendance,
            status: 'BREAK'
        };

        await request(app)
            .put(`/api/attendance/${attendance?.id}`)
            .send(updatedAttendance)
            .expect(200);
    });

    it('should delete an attendance record', async () => {
        let attendance = await prisma.attendance.findFirst();

        await request(app)
            .delete(`/api/attendance/${attendance?.id}`)
            .expect(200);

        attendance = await prisma.attendance.findFirst({
            where: {
                id: attendance?.id
            }
        });

        expect(attendance).toBeNull();
    });
});
import request from 'supertest';
import { prisma } from '../config/database'; // Adjust the import according to your project structure
import { server } from '..';

describe('Department Schedule API', () => {

    it('should get all department schedules', async () => {
        const responseDept = await request(server).get('/api/department').expect(200);
        expect(responseDept.body.length).toBeGreaterThanOrEqual(1);

        const response = await request(server).get(`/api/department-schedule?departmentId=${responseDept.body[0].id}`).expect(200);

        expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should get a department schedule by id', async () => {
        const departmentSchedules = await prisma.departmentSchedule.findMany(
            { include: { Schedule: true } }
        );

        await request(server).get(`/api/department-schedule/${departmentSchedules[0].id}`).expect(200);
    });

    it('should create a new department schedule', async () => {
        const department = await prisma.department.findFirst({ take: 1 });

        await request(server)
            .post('/api/department-schedule')
            .send({
                role: 'Test Role',
                departmentId: department?.id || 1,
                name: 'Test Schedule',
                scheduleType: "FIXED",
                startTime: new Date('2024-08-01T09:00:00Z'),
                endTime: new Date('2024-08-01T17:00:00Z'),
                limitWorkHoursDay: 8,
                allowedOvertime: false,
                lunchStartTime: new Date('2024-08-01T12:00:00Z'),
                lunchEndTime: new Date('2024-08-01T13:00:00Z'),
            }).expect(201);


        await request(server).get('/api/department-schedule').expect(200);
    });

    it('should update a department schedule', async () => {
        let departmentSchedule = await prisma.departmentSchedule.findFirst({ take: 1 });
        console.log(departmentSchedule, "departmentSchedule", departmentSchedule?.id, "departmentSchedule?.id");

        const response = await request(server)
            .put(`/api/department-schedule/${departmentSchedule?.id}`)
            .send({
                role: 'Test Role',
                name: 'Updated Schedule',
                scheduleType: 'FIXED',
                startTime: new Date('2024-08-01T09:00:00Z'),
                endTime: new Date('2024-08-01T17:00:00Z'),
                limitWorkHoursDay: 8,
                allowedOvertime: false,
                lunchStartTime: new Date('2024-08-01T12:00:00Z'),
                lunchEndTime: new Date('2024-08-01T13:00:00Z'),
            }).expect(201);

        departmentSchedule = await prisma.departmentSchedule.findUnique({
            where: { id: departmentSchedule?.id }
        });

        expect(departmentSchedule?.name).toBe('Updated Schedule');
    });

    it('should delete a department schedule', async () => {
        const schedule = await prisma.departmentSchedule.findFirst({ take: 1 });

        const response = await request(server).delete(`/api/department-schedule/${schedule?.id}`);
        expect(response.status).toBe(200);

    });

});

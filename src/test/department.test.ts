import request from 'supertest';
import { server } from '..';
import { Department, Employee } from '@prisma/client';

describe('Department Routes Test', () => {
    let departmentList: Department[];
    let departmentIdDelete: number;

    describe('GET Department', () => {
        it('should return a list of departments', async () => {
            const response = await request(server).get('/api/department').expect(200);
            expect(response.body.length).toBeGreaterThanOrEqual(1);
            departmentList = response.body;
        });

        it('should return a single department', async () => {
            const response = await request(server).get(`/api/department/${departmentList[0].id}`).expect(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(departmentList[0].id);
            expect(response.body.name).toBe(departmentList[0].name);
        });

        it('should return a 404', async () => {
            await request(server).get('/api/department/0').expect(404);
        });
    });

    describe('POST Department', () => {
        it('should create a new department', async () => {


            const body = {
                name: 'Department POST',
                leaderId: departmentList[0].leaderId
            };

            const response = await request(server)
                .post('/api/department')
                .send(body)
                .expect(201);
        });

        it('should return 404 for non-existent leader', async () => {
            const newDepartment = {
                name: 'Department 2',
                leaderId: 100
            };

            await request(server)
                .post('/api/department')
                .send(newDepartment)
                .expect(404);
        });
    });

    describe('PUT Department', () => {
        it('should update a department', async () => {
            const response = await request(server)
                .put(`/api/department/${departmentList[0].id}`)
                .send({ name: 'Department PUT', })
                .expect(200);
        });
    });

    describe('Department Leader', () => {
        let departmentId: Number;

        it('should return a department leader', async () => {
            const deptResponse = await request(server).get(`/api/department/${departmentList[0].id}`).expect(200);
            departmentId = deptResponse.body.id;
            expect(deptResponse.body).toHaveProperty('leaderId');

            await request(server).get('/api/employee/team-leader').expect(200);
        });

        it('should assign a leader to a department', async () => {
            const getEmployeeResponse = await request(server).get('/api/employee/team-leader').expect(200);
            await request(server)
                .put(`/api/department/${departmentId}/leader`)
                .send({
                    departmentId: departmentId,
                    leaderId: getEmployeeResponse.body[0].id,
                }).expect(200);

            // Check if leader is assigned to department
            const departmentResponse = await request(server).get(`/api/department/${departmentId}`).expect(200);
            expect(departmentResponse.body.leaderId).toBe(getEmployeeResponse.body[0].id);

            // Check if employee is assigned to department
            const employeeResponse = await request(server).get(`/api/employee/${getEmployeeResponse.body[0].id}`).expect(200);
            expect(employeeResponse.body.departmentId).toBe(departmentId);
        });

        it('should return 400 error assign a employee as leader to a department', async () => {
            const getEmployeeResponse = await request(server).get('/api/employee/only-employee').expect(200);

            await request(server)
                .put(`/api/department/${departmentId}/leader`)
                .send({
                    departmentId: departmentId,
                    leaderId: getEmployeeResponse.body[0].id,
                }).expect(400);
        });

        it('should remove a leader from a department', async () => {
            const currentDepartment = await request(server).get(`/api/department/${departmentId}`).expect(200);

            await request(server)
                .delete(`/api/department/${departmentId}/leader`)
                .send({
                    leaderId: currentDepartment.body.leaderId,
                }).expect(200);

            // Check if leader is removed from department
            const departmentResponse = await request(server).get(`/api/department/${currentDepartment.body.id}`).expect(200);
            expect(departmentResponse.body.leaderId).toBe(null);

            // Check if employee is removed from department
            const employeeResponse = await request(server).get(`/api/employee/${currentDepartment.body.leaderId}`).expect(200);
            expect(employeeResponse.body.departmentId).toBe(null);
        });
    });

    describe('Department Employee', () => {
        let curEmployee: Employee;

        it('should return all employee', async () => {
            const response = await request(server)
                .get(`/api/department/${departmentList[0].id}/employee`).expect(200);

            expect(response.body).toBeInstanceOf(Array);
        });

        it('should assign employee to department ', async () => {
            const getEmployeeResponse = await request(server).get('/api/employee/only-employee').expect(200);
            curEmployee = getEmployeeResponse.body[0];

            await request(server)
                .put(`/api/department/${departmentList[0].id}/employee`)
                .send({
                    departmentId: departmentList[0].id,
                    username: curEmployee.username,
                    role: 'staff'
                }).expect(200);

            const deptEmployee = await request(server).get(`/api/department/${departmentList[0].id}/employee`).expect(200);

            // Check if employee is assigned to 
            expect(deptEmployee.body).toContainEqual(expect.objectContaining({
                id: curEmployee.id,
                role: 'STAFF'
            }));
        });

        it('should remove employee from department', async () => {

            await request(server)
                .delete(`/api/department/${curEmployee.departmentId}/employee`)
                .send({
                    departmentId: curEmployee.departmentId,
                    employeeId: curEmployee.id,
                }).expect(200);

            const employeeResponse = await request(server).get(`/api/employee/${curEmployee.id}`).expect(200);
            expect(employeeResponse.body.departmentId).toBe(null);
        });
    });

    describe('DELETE Department', () => {
        it('should delete a department', async () => {
            departmentIdDelete = departmentList[0].id;
            const response = await request(server).get(`/api/department/${departmentIdDelete}`).expect(200);

            await request(server)
                .delete(`/api/department/${response.body.id}`).expect(200);

            await request(server).get(`/api/department/${response.body.id}`).expect(404);
        });

        it('should return a 404', async () => {
            await request(server).delete('/api/department/0').expect(404);
        });
    });
});
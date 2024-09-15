import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '..';
import { prisma } from '../config/database';
import { configEnv } from '../config/dotenv';

describe('Authorization tests', () => {

    it('should deny access to protected route without JWT', async () => {
        const response = await request(app).get('/api/protected');
        expect(response.status).toBe(401);
    });

    it('should allow access with a valid JWT in cookie', async () => {
        // Generate a valid JWT
        const employee = await prisma.employee.findFirst();
        const token = jwt.sign({
            id: employee?.id,
            departmentId: employee?.departmentId,
            accessLevel: employee?.accessLevel,
        },
            configEnv.JWT_SECRET, { expiresIn: '1h' });

        // Test access to the protected route with JWT in cookies
        const response = await request(app)
            .get('/api/protected')
            .set('Cookie', `token=${token}`);

        expect(response.status).toBe(200);
    });

    it('should allow access team leader', async () => {
        // Generate a valid JWT
        const employee = await prisma.employee.findFirst({
            where: {
                accessLevel: 'TEAM_LEADER'
            }
        });
        const token = jwt.sign({
            id: employee?.id,
            departmentId: employee?.departmentId,
            accessLevel: employee?.accessLevel,
        },
            configEnv.JWT_SECRET, { expiresIn: '1h' });

        // Test access to the protected route with JWT in cookies
        const response = await request(app)
            .get('/api/protected-tl')
            .set('Cookie', `token=${token}`);

        expect(response.status).toBe(200);
    });

    it('should allow access admin employee', async () => {
        // Generate a valid JWT
        // Generate a valid JWT
        const employee = await prisma.employee.findFirst({
            where: {
                accessLevel: 'ADMIN'
            }
        });
        const token = jwt.sign({
            id: employee?.id,
            departmentId: employee?.departmentId,
            accessLevel: employee?.accessLevel,
        },
            configEnv.JWT_SECRET, { expiresIn: '1h' });

        // Test access to the protected route with JWT in cookies
        const response = await request(app)
            .get('/api/protected-a')
            .set('Cookie', `token=${token}`);

        expect(response.status).toBe(200);
    });

    it('should block other not admin employee', async () => {
        // Generate a valid JWT
        // Generate a valid JWT
        const employee = await prisma.employee.findFirst({
            where: {
                accessLevel: 'EMPLOYEE'
            }
        });
        const token = jwt.sign({
            id: employee?.id,
            departmentId: employee?.departmentId,
            accessLevel: employee?.accessLevel,
        },
            configEnv.JWT_SECRET, { expiresIn: '1h' });

        // Test access to the protected route with JWT in cookies
        const response = await request(app)
            .get('/api/protected-a')
            .set('Cookie', `token=${token}`);

        expect(response.status).toBe(403);
    });

    it('should deny access with an invalid JWT in cookie', async () => {
        const invalidToken = 'some.invalid.token';

        const response = await request(app)
            .get('/api/protected')
            .set('Cookie', `token=${invalidToken}`);

        expect(response.status).toBe(403);
    });
});

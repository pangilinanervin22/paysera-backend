import { prisma } from '../config/database';
import { configEnv } from '../config/dotenv';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = configEnv.JWT_SECRET || 'SAMPLE_SECRET';

interface DecodedToken {
    id: string;
    accessLevel: string; //access level from the JWT token 
    departmentId: string;
}

const regularMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (!token) return res.status(401).send('Access denied'); // if no token, return access denied

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

        const employee = await prisma.employee.findUnique({
            where: { id: Number(decoded.id) },
        });

        if (!employee) return res.status(404).send('Employee not found');

        req.body.data = employee;

        next();
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).send('Token expired');
        }
        return res.status(403).send('Invalid Token');
    }

};


export default regularMiddleware;

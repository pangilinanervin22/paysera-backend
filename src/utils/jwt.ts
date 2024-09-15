import { configEnv } from '../config/dotenv';
import jwt from 'jsonwebtoken';

const JWT_SECRET = configEnv.JWT_SECRET || 'your_secret_key';
const JWT_EXPIRATION = '1h'; // Token expires in 1 hour

interface JwtPayload {
    id: number;
    accessLevel: string;
}

export const generateToken = (payload: JwtPayload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

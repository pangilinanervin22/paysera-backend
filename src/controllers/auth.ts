import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { validateLogin } from '../validate/auth.validation';
import { customThrowError } from '../middlewares/errorHandler';
import { configEnv } from '../config/dotenv';

const JWT_SECRET = configEnv.JWT_SECRET;
const JWT_EXPIRATION = '12h';
const REFRESH_TOKEN_EXPIRATION = '7d';

// Function to generate an access token
const generateAccessToken = (user: any) => {
    return jwt.sign(
        {
            id: user.id,
            accessLevel: user.accessLevel,
            departmentId: user.departmentId,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    );
};

// Function to generate a refresh token
const generateRefreshToken = (user: any) => {
    return jwt.sign(
        {
            id: user.id,
        },
        JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRATION }
    );
};

const login = async (req: Request, res: Response) => {
    const { username, password } = validateLogin(req.body);

    const user = await prisma.employee.findUnique({
        where: { username },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordCredentials))) {
        return customThrowError(404, "Invalid username or password");
    }

    // Generate both access and refresh tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set the refresh token in a secure, HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: configEnv.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        sameSite: 'none',
    });

    // Send the access token in a cookie (12 hours)
    res.cookie('token', accessToken, {
        httpOnly: true,
        secure: configEnv.NODE_ENV === 'production',
        maxAge: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
        sameSite: 'none',
    });

    res.status(200).send("Login successful");
};

const refreshToken = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return customThrowError(401, "Unauthorized");
    }

    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: number };

        // Find the user
        const user = await prisma.employee.findFirst({
            where: { id: decoded.id },
        });

        if (!user) {
            return customThrowError(404, "User not found");
        }

        // Generate a new access token
        const newAccessToken = generateAccessToken(user);

        res.cookie('token', newAccessToken, {
            httpOnly: true,
            secure: configEnv.NODE_ENV === 'production',
            maxAge: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
            sameSite: 'none',
        });

        res.status(200).send("Access token refreshed");
    } catch (error) {
        return customThrowError(401, "Invalid refresh token");
    }
};

const logout = async (req: Request, res: Response) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || true,
        sameSite: 'none',
    });

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || true,
        sameSite: 'none',
    });

    res.status(200).send("Logout successful");
};

const getUserInfo = async (req: Request, res: Response) => {
    const token = req.cookies.token;

    if (!token) {
        return customThrowError(401, "Unauthorized cookie not found");
    }

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET) as { id: number, accessLevel: string, departmentId: number };
        const employee = await prisma.employee.findFirst({
            where: { id: decodedToken.id },
            select: {
                id: true,
                departmentId: true,
                accessLevel: true,
                username: true,
                firstName: true,
                lastName: true,
                middleName: true,
                role: true,
                isActive: true,
            },
        });


        if (!employee) {
            return customThrowError(404, "Account not found");
        }

        const department = await prisma.department.findFirst({
            where: { id: employee?.departmentId || -1 },
            select: {
                name: true
            }
        });


        // this can be extend if we going to add another schedule type
        let currentSchedule;
        if (department && employee.role && employee.departmentId) {
            currentSchedule = await prisma.departmentSchedule.findFirst({
                where: {
                    departmentId: employee.departmentId,
                    role: employee.role,
                },
                select: {
                    Schedule: true,
                },
            });

            currentSchedule = { ...currentSchedule, ...currentSchedule?.Schedule };
        }

        res.status(200).send({ ...employee, departmentName: department?.name || 'N/A', schedule: currentSchedule || 'No schedule' });
    } catch (error) {
        return customThrowError(401, "Invalid token");
    }
};

export {
    login,
    refreshToken,
    logout,
    getUserInfo,
};

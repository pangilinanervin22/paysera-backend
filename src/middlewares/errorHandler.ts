import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from './logger';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Custom Error Interface
interface CustomError extends Error {
    status?: number;
}

const globalErrorHandler = (
    error: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Check if the response has already been sent
    if (res.headersSent) {
        return next(error);
    }

    logger.error({
        method: req.method,
        statusCode: error.status || 500,
        url: req.originalUrl,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        error: error,
    });

    if (error instanceof ZodError) {
        res.status(400).send({
            statusCode: 400,
            message: error.errors,
        });

        return;
    }

    if (error instanceof PrismaClientKnownRequestError) {
        res.status(404).send("Not Found credentials");
        return;
    }

    const statusCode = error.status || 500;
    res.status(statusCode).send({
        statusCode: statusCode,
        message: error.message || "Internal Server Error",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    return;
};

export function asyncHandler(handler: Function) {
    return async function (req: Request, res: Response, next: NextFunction) {
        try {
            await handler(req, res, next);
        } catch (error) {
            next(error);
        }
    };
}

export const customThrowError = (status: number, message: string): never => {
    const error: CustomError = new Error(message);
    error.status = status;
    throw error;
};

export default globalErrorHandler;

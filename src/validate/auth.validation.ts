import { z } from "zod";

const validateLogin = (data: { username: string, password: string }) => {
    const loginSchema = z.object({
        username: z.string().min(8).max(255),
        password: z.string().min(8).max(30),
    });

    return loginSchema.parse(data);

};

const validateLogout = (data: { token: string }) => {
    const logoutSchema = z.object({
        token: z.string().min(1), // token is required
    });

    return logoutSchema.parse(data);
};


export {
    validateLogin,
    validateLogout
}
import bcrypt from 'bcryptjs';

const saltRounds = 10; // The cost factor for bcrypt

export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, saltRounds);
};
import { prisma } from "../../src/config/database";
import { server } from '../index';

export default async () => {

    // Delete all records in the database
    await prisma.attendance.deleteMany();
    await prisma.departmentSchedule.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.department.deleteMany();


    // Disconnect the Prisma client
    await prisma.$disconnect();
    server.close();
    console.log('Server closed');
};

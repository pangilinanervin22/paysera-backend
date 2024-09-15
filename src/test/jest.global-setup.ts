import { formatDate } from "../utils/time";
import { prisma } from "../../src/config/database";

export default async () => {
    console.log('Global Test Teardown');
    // Seed the database
    try {
        // Create Departments
        const department1 = await prisma.department.create({
            data: {
                name: 'department1',
            },
        });

        const department2 = await prisma.department.create({
            data: {
                name: 'department2',
            },
        });

        const admin1 = await prisma.employee.create({
            data: {
                username: 'admin1',
                accessLevel: 'ADMIN',
                isActive: true,
                passwordCredentials: 'hashed_password',
                firstName: 'Ervin',
                lastName: 'Pangilinan',
                middleName: 'Capili',
                role: 'Developer',
            },
        });

        const leader1 = await prisma.employee.create({
            data: {
                username: 'leader1',
                accessLevel: 'TEAM_LEADER',
                isActive: true,
                passwordCredentials: 'hashed_password',
                firstName: 'Leader1',
                lastName: 'Leader1',
                middleName: 'Leader1',
                role: 'HR Manager',
                departmentId: department1.id,
                LeadsDepartment: {
                    connect: {
                        id: department1.id,
                    },
                },
            },
        });

        const leader2 = await prisma.employee.create({
            data: {
                username: 'leader2',
                accessLevel: 'TEAM_LEADER',
                isActive: true,
                passwordCredentials: 'hashed_password',
                firstName: 'leader2',
                lastName: 'leader2',
                middleName: 'leader2',
                role: 'HR Manager',
                Department: {
                    connect: {
                        id: department2.id,
                    },
                },
                LeadsDepartment: {
                    connect: {
                        id: department2.id,
                    },
                },
            },
        });

        // Create Employees
        const employee1 = await prisma.employee.create({
            data: {
                username: 'employee1',
                accessLevel: 'EMPLOYEE',
                isActive: true,
                passwordCredentials: 'hashed_password',
                firstName: 'employee1 ',
                lastName: 'employee1 ',
                middleName: 'employee1 ',
                role: 'Engineer',
                departmentId: department1.id,
            },
        });

        const employee2 = await prisma.employee.create({
            data: {
                username: 'employee2',
                accessLevel: 'EMPLOYEE',
                isActive: true,
                passwordCredentials: 'hashed_password',
                firstName: 'employee2',
                lastName: 'employee2',
                middleName: 'employee2',
                role: 'Designer',
                Department: {
                    connect: {
                        id: department2.id,
                    },
                },
            },
        });

        const employee3 = await prisma.employee.create({
            data: {
                username: 'employee3',
                accessLevel: 'EMPLOYEE',
                isActive: true,
                passwordCredentials: 'hashed_password',
                firstName: 'employee3',
                lastName: 'employee3',
                middleName: 'employee3',
                role: 'Engineer',
                departmentId: department1.id,
            },
        });

        const employee4 = await prisma.employee.create({
            data: {
                username: 'employee4',
                accessLevel: 'EMPLOYEE',
                isActive: true,
                passwordCredentials: 'hashed_password',
                firstName: 'employee4',
                lastName: 'employee4',
                middleName: 'employee4',
                role: 'Designer',
                Department: {
                    connect: {
                        id: department2.id,
                    },
                },
            },
        });

        const employee5 = await prisma.employee.create({
            data: {
                username: 'employee5',
                accessLevel: 'EMPLOYEE',
                isActive: true,
                passwordCredentials: 'hashed_password',
                firstName: 'employee5',
                lastName: 'employee5',
                middleName: 'employee5',
                role: 'Engineer',
                departmentId: department1.id,
            },
        });

        const employee6 = await prisma.employee.create({
            data: {
                username: 'employee6',
                accessLevel: 'EMPLOYEE',
                isActive: true,
                passwordCredentials: 'hashed_password',
                firstName: 'employee6',
                lastName: 'employee6',
                middleName: 'employee6',
                role: 'Designer',
                Department: {
                    connect: {
                        id: department2.id,
                    },
                },
            },
        });

        const employee7 = await prisma.employee.create({
            data: {
                username: 'employee7',
                accessLevel: 'EMPLOYEE',
                isActive: true,
                passwordCredentials: 'hashed_password',
                firstName: 'employee7',
                lastName: 'employee7',
                middleName: 'employee7',
                role: 'Engineer',
                departmentId: department1.id,
            },
        });

        const employee8 = await prisma.employee.create({
            data: {
                username: 'employee8',
                accessLevel: 'EMPLOYEE',
                isActive: true,
                passwordCredentials: 'hashed_password',
                firstName: 'employee8',
                lastName: 'employee8',
                middleName: 'employee8',
                role: 'Designer',
                Department: {
                    connect: {
                        id: department2.id,
                    },
                },
            },
        });


        // Create Schedules
        const schedule1 = await prisma.schedule.create({
            data: {
                scheduleType: 'FIXED',
                startTime: new Date('2024-08-01T09:00:00Z'),
                endTime: new Date('2024-08-01T17:00:00Z'),
                lunchStartTime: new Date('2024-08-01T12:00:00Z'),
                lunchEndTime: new Date('2024-08-01T13:00:00Z'),
            },
        });

        const schedule2 = await prisma.schedule.create({
            data: {
                scheduleType: 'FLEXI',
                startTime: new Date('2024-08-01T10:00:00Z'),
                endTime: new Date('2024-08-01T18:00:00Z'),
                limitWorkHoursDay: 8,
                lunchStartTime: new Date('2024-08-01T12:00:00Z'),
                lunchEndTime: new Date('2024-08-01T13:00:00Z'),
            },
        });


        // Create Department Schedules
        await prisma.departmentSchedule.create({
            data: {
                name: 'FIXED ENGINEER Schedule',
                departmentId: department1.id,
                scheduleId: schedule1.id,
                role: 'ENGINEER',
            },
        });

        const wew = await prisma.departmentSchedule.create({
            data: {
                name: 'FLEXI DESIGNER Schedule',
                departmentId: department2.id,
                scheduleId: schedule2.id,
                role: 'DESIGNER',
            },
        });

        // Create Attendance Records
        await prisma.attendance.create({
            data: {
                employeeId: employee1.id,
                date: formatDate(new Date('2024-08-01')),
                status: 'DONE',
                scheduleType: 'FLEXI',
                timeIn: new Date('2024-08-01T10:00:00Z'),
                timeOut: new Date('2024-08-01T18:00:00Z'),
                timeTotal: 8,
                lunchTimeIn: new Date('2024-08-01T12:00:00Z'),
                lunchTimeOut: new Date('2024-08-01T13:00:00Z'),
                lunchTimeTotal: 1,
            },
        });

        await prisma.attendance.create({
            data: {
                employeeId: employee2.id,
                date: formatDate(new Date('2024-08-01')),
                status: 'PAID_LEAVE',
                scheduleType: 'FIXED',
                timeIn: new Date('2024-08-01T09:00:00Z'),
                timeOut: new Date('2024-08-01T17:00:00Z'),
                timeTotal: 8,
                lunchTimeIn: new Date('2024-08-01T12:00:00Z'),
                lunchTimeOut: new Date('2024-08-01T13:00:00Z'),
                lunchTimeTotal: 1,

            },
        });

    } catch (error) {
        console.error('Error seeding data:', error);
    }
};


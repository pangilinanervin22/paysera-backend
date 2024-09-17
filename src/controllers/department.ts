import { Request, Response } from "express";
import { prisma } from "../config/database";
import { validateCreateDepartment, validateDepartmentAssignEmployee, validateDepartmentAssignLeader, validateDepartmentRemoveEmployee, validateUpdateDepartment } from "../validate/department.validation";
import { customThrowError } from '../middlewares/errorHandler';

async function getAllDepartments(req: Request, res: Response) {
    const allDepartments = await prisma.department.findMany({
        orderBy: {
            createdAt: 'asc'
        },
        include: {
            Employees: {
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    middleName: true,
                    accessLevel: true,
                    isActive: true,
                    role: true,
                }
            },
            Leader: {
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    middleName: true,
                    accessLevel: true,
                    isActive: true,
                    role: true,
                }
            }
        }
    });

    if (!allDepartments || allDepartments.length === 0) {
        return customThrowError(404, 'No departments found');
    }

    res.status(200).send(allDepartments);
}

async function getDepartmentEmployees(req: Request, res: Response) {
    const departmentId = Number(req.params.id);
    if (!departmentId) {
        return customThrowError(400, "Invalid department ID");
    }

    const department = await prisma.department.findUnique({
        where: { id: departmentId },
        include: {
            Employees: true
        }
    });

    if (!department) {
        return customThrowError(404, "Department not found");
    }

    res.status(200).send(department.Employees);
}

async function getDepartmentLeader(req: Request, res: Response) {
    const departmentId = Number(req.params.id);
    if (!departmentId) {
        return customThrowError(400, "Invalid department ID");
    }

    const department = await prisma.department.findUnique({
        where: { id: departmentId },
        include: {
            Leader: true
        }
    });

    if (!department) {
        return customThrowError(404, "Department not found");
    }

    if (!department.Leader) {
        return customThrowError(404, "Department has no leader");
    }

    res.status(200).send(department.Leader);
}

async function getDepartmentById(req: Request, res: Response) {
    const departmentId = Number(req.params.id);

    if (!departmentId) {
        return customThrowError(404, "Invalid department ID");
    }

    const department = await prisma.department.findUnique({
        where: { id: departmentId },
        include: {
            DepartmentSchedule: true,
            Employees: true,
            Leader: true
        },
    });

    if (!department) {
        customThrowError(404, "Department not found");
    }

    res.status(200).send(department);
}

async function createDepartment(req: Request, res: Response) {
    const body: any = {
        name: String(req.body.name),
        leaderId: Number(req.body.leaderId)
    };

    validateCreateDepartment({ ...req.body, ...body });
    if (req.body.leaderId) {
        const leaderExists = await prisma.employee.findUnique({
            where: { id: body.leaderId },
        });

        if (!leaderExists) {
            return customThrowError(404, "Leader not found");
        }
    }

    // Create department
    await prisma.department.create({
        data: {
            name: body.name || "Department Name",
            Leader: {
                connect: {
                    id: body.leaderId
                }
            }
        },
    });

    res.status(201).send("Department created successfully");
}

async function updateDepartmentById(req: Request, res: Response) {
    const departmentId = Number(req.params.id);
    if (!departmentId) {
        return customThrowError(400, "Invalid department ID");
    }

    validateUpdateDepartment(req.body);

    const existingDepartment = await prisma.department.findUnique({
        where: { id: departmentId },
    });

    if (!existingDepartment) {
        return customThrowError(404, "Department not found");
    }

    if (req.body.leaderId) {
        const leaderExists = await prisma.employee.findUnique({
            where: { id: req.body.leaderId },
        });

        if (!leaderExists) {
            customThrowError(404, "Leader not found");
        }
    }

    // Update department
    await prisma.department.update({
        where: { id: departmentId },
        data: {
            name: req.body.name,
            leaderId: req.body.leaderId,
        },
    });

    res.status(200).send("Department updated successfully");
}

async function deleteDepartmentById(req: Request, res: Response) {
    const departmentId = Number(req.params.id);
    if (!departmentId) {
        return customThrowError(404, "Invalid department ID");
    }

    const existingDepartment = await prisma.department.findFirst({
        where: { id: departmentId },
    });

    if (!existingDepartment) {
        return customThrowError(404, "Department not found");
    }

    const departmentSchedule = await prisma.departmentSchedule.findMany({
        where: { departmentId: departmentId }
    });

    // Get all schedule IDs for the department schedules
    // Cascade delete department schedules
    // Delete the schedules 
    const departmentsScheduleIds = departmentSchedule.map(schedule => schedule.scheduleId);
    await prisma.$transaction([
        prisma.schedule.deleteMany({
            where: {
                id: {
                    in: departmentsScheduleIds
                }
            }
        }),
        prisma.department.delete({
            where: { id: departmentId },
        })
    ]);

    res.status(200).send("Department deleted successfully");
}

async function getDepartmentSchedules(req: Request, res: Response) {
    const departmentId = Number(req.params.id);
    if (!departmentId) {
        return customThrowError(404, "Invalid department ID");
    }

    const schedules = await prisma.departmentSchedule.findMany({
        where: { departmentId: departmentId },
        include: {
            Schedule: true
        },
        orderBy: {
            Schedule: {
                startTime: 'asc'
            }
        },
    });

    // if (!schedules || schedules.length === 0) {
    //     return customThrowError(404, "No schedules found for this department");
    // }

    res.status(200).send(schedules);
}

async function getDepartmentSchedulesToday(req: Request, res: Response) {
    const departmentId = Number(req.params.id);
    if (!departmentId) {
        return customThrowError(404, "Invalid department ID");
    }

    const schedules = await prisma.departmentSchedule.findMany({
        where: {
            departmentId: departmentId,
            Schedule: {
                startTime: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999))
                }
            }
        },
        include: {
            Schedule: true
        },
        orderBy: {
            Schedule: {
                startTime: 'asc'
            }
        },
    });

    // if (!schedules || schedules.length === 0) {
    //     return customThrowError(404, "No schedules found for this department");
    // }

    res.status(200).send(schedules);
}

async function getDepartmentAttendance(req: Request, res: Response) {
    const departmentId = Number(req.params.id);
    if (!departmentId) {
        return customThrowError(400, "Invalid department ID");
    }

    const employee = await prisma.employee.findMany({
        where: { Department: { id: Number(req.params.id) } }
    });

    // Get all employee IDs for the department attendance
    const employeeIds = employee.map(emp => emp.id);

    if (employeeIds.length === 0) {
        return customThrowError(404, "No employees found in this department");
    }

    const attendance = await prisma.attendance.findMany({
        where: {
            employeeId: {
                in: employeeIds
            },
        },
        include: {
            employee: true
        },
    });

    res.status(200).send(attendance);
}

async function getDepartmentAttendanceToday(req: Request, res: Response) {
    const departmentId = Number(req.params.id);
    if (!departmentId) {
        return customThrowError(400, "Invalid department ID");
    }

    const employee = await prisma.employee.findMany({
        where: { Department: { id: Number(req.params.id) } }
    });

    // Get all employee IDs for the department attendance
    const employeeIds = employee.map(emp => emp.id);

    if (employeeIds.length === 0) {
        return customThrowError(404, "No employees found in this department");
    }

    const attendance = await prisma.attendance.findMany({
        where: {
            employeeId: {
                in: employeeIds
            },
            createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lt: new Date(new Date().setHours(23, 59, 59, 999))
            },
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            employee: true
        },
    });

    res.status(200).send(attendance);
}

async function updateDepartmentAssignEmployee(req: Request, res: Response) {
    const departmentId = Number(req.params.id);
    const role = String(req.body.role).toLocaleUpperCase();
    const username = req.body.username;
    validateDepartmentAssignEmployee({ departmentId, role, username });

    const department = await prisma.department.findUnique({
        where: { id: departmentId }
    });

    if (!department) {
        return customThrowError(404, "Department not found");
    }

    const employee = await prisma.employee.findUnique({
        where: { username: username }
    });

    if (!employee) {
        return customThrowError(404, "Employee not found");
    }

    await prisma.employee.update({
        where: { id: employee.id },
        data: {
            role: String(req.body.role).toLocaleUpperCase(),
            Department: {
                connect: {
                    id: departmentId
                }
            }
        }
    });

    res.status(200).send("Employee assigned to department successfully");
}

async function updateDepartmentRemoveEmployee(req: Request, res: Response) {
    const departmentId = Number(req.params.id);
    const employeeId = Number(req.body.employeeId);
    validateDepartmentRemoveEmployee({ departmentId, employeeId });

    if (req.body.info && req.body.info.id === employeeId) {
        return customThrowError(400, "You can't remove yourself from department");
    }

    const [department, employee] = await Promise.all([
        prisma.department.findUnique({
            where: { id: departmentId }
        }),
        prisma.employee.findUnique({
            where: { id: employeeId }
        })
    ]);

    if (!department) {
        return customThrowError(404, "Department not found");
    }

    if (!employee) {
        return customThrowError(404, "Employee not found");
    }

    await prisma.employee.update({
        where: { id: employee.id },
        data: {
            role: null,
            Department: {
                disconnect: true
            }
        }
    });

    res.status(200).send("fuck removed from department successfully");
}

async function updateDepartmentAssignLeader(req: Request, res: Response) {
    const departmentId = Number(req.params.id);
    const leaderId = Number(req.body.leaderId);
    validateDepartmentAssignLeader({ departmentId, leaderId });

    const [department, employee] = await Promise.all([
        prisma.department.findUnique({
            where: { id: departmentId }
        }),
        prisma.employee.findUnique({
            where: { id: leaderId }
        })
    ]);

    if (!department) {
        return customThrowError(404, "Department not found");
    }

    if (!employee) {
        return customThrowError(400, "Employee is not an admin or team leader");
    } else if (employee.accessLevel === "EMPLOYEE") {
        return customThrowError(400, "Employee is not an admin or team leader");
    }

    // update employee leads department
    await prisma.employee.update({
        where: { id: leaderId },
        data: {
            role: "TEAM LEADER",
            LeadsDepartment: {
                connect: {
                    id: departmentId
                }
            },
            Department: {
                connect: {
                    id: departmentId
                }
            },
        }
    });

    res.status(200).send("Leader assigned to department successfully");
}

async function updateDepartmentRemoveLeader(req: Request, res: Response) {
    const departmentId = Number(req.params.id);
    if (!departmentId) {
        return customThrowError(400, "Invalid department ID");
    }

    const department = await prisma.department.findUnique({
        where: { id: departmentId }
    });

    if (!department) {
        return customThrowError(404, "Department not found");
    }

    // update employee leads department
    const leader = await prisma.employee.findUnique({
        where: { id: department.leaderId || undefined }
    });

    if (!leader) {
        return customThrowError(404, "Leader not found");
    }

    await prisma.employee.update({
        where: { id: leader.id },
        data: {
            role: null,
            LeadsDepartment: {
                disconnect: true
            },
            Department: {
                disconnect: true
            }
        }
    });

    res.status(200).send("Leader removed from department successfully");
}

export default {
    getAllDepartments,
    getDepartmentById,
    getDepartmentEmployees,
    getDepartmentLeader,
    createDepartment,
    updateDepartmentById,
    deleteDepartmentById,
    getDepartmentSchedules,
    getDepartmentAttendance,
    getDepartmentAttendanceToday,
    getDepartmentSchedulesToday,
    updateDepartmentAssignEmployee,
    updateDepartmentRemoveEmployee,
    updateDepartmentAssignLeader,
    updateDepartmentRemoveLeader
};
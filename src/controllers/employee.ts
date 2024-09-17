import bcrypt from 'bcryptjs';
import { Request, Response } from "express";
import { prisma } from "../config/database";
import { validateCreateOneEmployee, validateEmployee, validateUpdateEmployee } from "../validate/employee.validation";
import { customThrowError } from '../middlewares/errorHandler';

async function getAllEmployees(req: Request, res: Response) {
    const allEmployees = await prisma.employee.findMany({
        select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            middleName: true,
            accessLevel: true,
            isActive: true,
            departmentId: true,
            role: true,
        },
        orderBy: {
            updatedAt: "desc",
        },
    });

    res.status(200).send(allEmployees);
}

async function getAllTeamLeaders(req: Request, res: Response) {
    const allTeamLeaders = await prisma.employee.findMany({
        where: {
            accessLevel: "TEAM_LEADER",
        },
        select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            middleName: true,
            accessLevel: true,
            isActive: true,
            departmentId: true,
            role: true,
        },
    });

    res.status(200).send(allTeamLeaders);
}

async function getAllOnlyEmployee(req: Request, res: Response) {
    const allTeamMembers = await prisma.employee.findMany({
        where: {
            accessLevel: "EMPLOYEE",
        },
        select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            middleName: true,
            accessLevel: true,
            isActive: true,
            departmentId: true,
            role: true,
        },
    });

    res.status(200).send(allTeamMembers);
}

async function getAllAdmin(req: Request, res: Response) {
    const allAdmins = await prisma.employee.findMany({
        where: {
            accessLevel: "ADMIN",
        },
        select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            middleName: true,
            accessLevel: true,
            isActive: true,
            departmentId: true,
            role: true,
        },
    });

    res.status(200).send(allAdmins);
}

async function getEmployeeById(req: Request, res: Response) {
    const employeeId = Number(req.params.id) || -1;

    const employee = await prisma.employee.findFirst({
        where: {
            id: employeeId,
        },
        select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            middleName: true,
            accessLevel: true,
            isActive: true,
            departmentId: true,
            role: true,
        },
    });

    if (!employee) {
        customThrowError(404, "Employee not found");
    }

    res.status(200).send(employee);
}

const createEmployee = async (req: Request, res: Response) => {
    validateCreateOneEmployee(req.body);

    const existingEmployeeUsername = await prisma.employee.findFirst({
        where: {
            username: req.body.username,
        },
    });

    if (existingEmployeeUsername) {
        customThrowError(400, "Username already exists");
    }

    const hashedPassword = await bcrypt.hash(req.body.passwordCredentials, 10);

    // Create employee
    await prisma.employee.create({
        data: {
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            middleName: req.body.middleName,
            accessLevel: req.body.accessLevel,
            isActive: req.body.isActive,
            passwordCredentials: hashedPassword,
            role: req.body.role,
        },
    });

    res.status(201).send();
};

const updateEmployee = async (req: Request, res: Response) => {
    const employeeId = Number(req.params.id) || -1;

    validateUpdateEmployee(req.body);

    const existingEmployee = await prisma.employee.findUnique({
        where: { id: employeeId },
    });

    if (!existingEmployee) {
        return customThrowError(404, "Employee not found");
    }

    // Update employee
    await prisma.employee.update({
        where: { id: Number(req.params.id) },
        data: {
            username: req.body.username ?? existingEmployee.username,
            firstName: req.body.firstName ?? existingEmployee.firstName,
            lastName: req.body.lastName ?? existingEmployee.lastName,
            middleName: req.body.middleName ?? existingEmployee.middleName,
            accessLevel: req.body.accessLevel ?? existingEmployee.accessLevel,
            isActive: req.body.isActive ?? existingEmployee.isActive,
            departmentId: req.body.departmentId ?? existingEmployee.departmentId,
            role: req.body.role ?? existingEmployee.role,
        },
    });

    res.status(200).send("Employee updated successfully");
};


const deleteEmployeeById = async (req: Request, res: Response) => {
    const employeeId = Number(req.params.id) || -1;

    if (req.body.info && req.body.info.id === employeeId) {
        return customThrowError(400, "You can't delete yourself");
    }

    const existingEmployee = await prisma.employee.findUnique({
        where: { id: employeeId },
    });

    if (!existingEmployee) {
        customThrowError(404, "Employee not found");
    }

    // Delete employee
    await prisma.employee.delete({
        where: { id: employeeId },
    });

    res.status(200).send("Employee deleted successfully");
};


export default {
    getAllEmployees,
    getAllTeamLeaders,
    getAllOnlyEmployee,
    getAllAdmin,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployeeById,
};

import { Department } from "@prisma/client";
import { access } from "fs";
import { z } from "zod";

function validateDepartment(department: Department) {
    const departmentSchema = z.object({
        id: z.number(),
        name: z.string().max(50),
        leaderId: z.number().optional(),
        Leader: z.unknown().optional(),
        DepartmentSchedule: z.unknown().array().optional(),
        Employees: z.unknown().array(),
    });

    departmentSchema.parse(department);
}

function validateCreateDepartment(department: Department) {
    const departmentSchema = z.object({
        name: z.string().max(50).optional(),
        leaderId: z.number().optional(),
        Leader: z.unknown().optional(),
        DepartmentSchedule: z.unknown().array().optional(),
        Employees: z.unknown().array().optional(),
    });

    departmentSchema.parse(department);
}

function validateUpdateDepartment(department: any) {
    const departmentSchema = z.object({
        name: z.string().max(50),
        leaderId: z.number().optional(),
        Leader: z.unknown().optional(),
    });

    departmentSchema.parse(department);
}

function validateDepartmentAssignEmployee(data: any) {
    const departmentSchema = z.object({
        username: z.string(),
        departmentId: z.number(),
        role: z.string(),
    });

    departmentSchema.parse(data);
}

function validateDepartmentRemoveEmployee(data: any) {
    const departmentSchema = z.object({
        departmentId: z.number(),
        employeeId: z.number(),
    });

    departmentSchema.parse(data);
}

function validateDepartmentAssignLeader(data: any) {
    const departmentSchema = z.object({
        leaderId: z.number(),
        departmentId: z.number(),
    });

    departmentSchema.parse(data);
}


export {
    validateDepartment,
    validateCreateDepartment,
    validateUpdateDepartment,
    validateDepartmentAssignEmployee,
    validateDepartmentRemoveEmployee,
    validateDepartmentAssignLeader
};
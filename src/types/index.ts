export interface Attendance {
    id: number;
    employeeId: number;
    date: Date;
    status: AttendanceStatus;
    scheduleTypes: ScheduleType;
    time_in: Date;
    time_out: Date | null;
    time_hours_worked: number | null;
    over_time_total: number | null;
    time_total: number | null;
    lunch_time_total: number | null;
    created_at: Date;
    updated_at: Date;
}

export interface Schedule {
    id: number;
    day: Day;
    name: string | null;
    description: string | null;
    scheduleType: ScheduleType;
    fixedStartTime: Date | null;
    fixedEndTime: Date | null;
    flexStartTime: Date | null;
    flexEndTime: Date | null;
    limitWorkHoursDay: number | null;
    allowedOvertime: boolean | null;
    lunchStartTime: Date | null;
    lunchEndTime: Date | null;
    isSoloSchedule: boolean;
    isDepartmentSchedule: boolean;
    isTemplateBased: boolean;
    updatedAt: Date;
    createdAt: Date;
}

export interface DepartmentSchedule {
    id: number;
    scheduleId: number;
    departmentId: number;
    updatedAt: Date;
    createdAt: Date;
}

export interface SoloSchedule {
    id: number;
    day: Day;
    employeeId: number;
    scheduleId: number;
    updatedAt: Date;
    createdAt: Date;
}

export interface Employee {
    id: number;
    accessLevel: AccessLevel;
    isActive: boolean;
    passwordCredentials: string;
    firstName: string;
    lastName: string;
    middleName: string;
    role: string;
    departmentId?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Department {
    id: number;
    name: string;
    description: string | null;
    leaderId: number | null;
    updatedAt: Date;
    createdAt: Date;
}

export const AccessLevel = {
    ADMIN: "ADMIN",
    TEAM_LEADER: "TEAM_LEADER",
    EMPLOYEE: "EMPLOYEE",
} as const;
export type AccessLevel = (typeof AccessLevel)[keyof typeof AccessLevel];

export const ScheduleType = {
    FIXED: "FIXED",
    SUPER_FLEXI: "SUPER_FLEXI",
    FLEXI: "FLEXI",
} as const;
export type ScheduleType = (typeof ScheduleType)[keyof typeof ScheduleType];

export const Day = {
    MONDAY: "MONDAY",
    TUESDAY: "TUESDAY",
    WEDNESDAY: "WEDNESDAY",
    THURSDAY: "THURSDAY",
    FRIDAY: "FRIDAY",
    SATURDAY: "SATURDAY",
    SUNDAY: "SUNDAY",
} as const;
export type Day = (typeof Day)[keyof typeof Day];

export const AttendanceStatus = {
    BREAK: "BREAK",
    DONE: "DONE",
    UNPAID_LEAVE: "UNPAID_LEAVE",
    PAID_TIME_OFF: "PAID_TIME_OFF",
} as const;
export type AttendanceStatus =
    (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

import express from 'express';
import departmentController from '../controllers/department';
import { asyncHandler } from '../middlewares/errorHandler';
import { adminMiddleware, teamLeaderMiddleware } from '../middlewares';

const routerDepartment = express.Router();


// routerDepartment.use(teamLeaderMiddleware)
routerDepartment
    .route('/')
    .get(asyncHandler(departmentController.getAllDepartments))
    .post(adminMiddleware, asyncHandler(departmentController.createDepartment));

routerDepartment
    .route('/:id')
    .get(asyncHandler(departmentController.getDepartmentById))
    .put(adminMiddleware, asyncHandler(departmentController.updateDepartmentById))
    .delete(adminMiddleware, asyncHandler(departmentController.deleteDepartmentById));

routerDepartment
    .route('/:id/schedules')
    .get(asyncHandler(departmentController.getDepartmentSchedules));

routerDepartment
    .route('/:id/schedules/today',)
    .get(asyncHandler(departmentController.getDepartmentSchedulesToday));

routerDepartment
    .route('/:id/attendance/today')
    .get(asyncHandler(departmentController.getDepartmentAttendanceToday));

routerDepartment
    .route('/:id/attendance')
    .get(asyncHandler(departmentController.getDepartmentAttendance));

routerDepartment
    .route('/:id/leader')
    .get(asyncHandler(departmentController.getDepartmentLeader))
    .put(adminMiddleware, asyncHandler(departmentController.updateDepartmentAssignLeader))
    .delete(adminMiddleware, asyncHandler(departmentController.updateDepartmentRemoveLeader));

routerDepartment
    .route('/:id/employee')
    .get(asyncHandler(departmentController.getDepartmentEmployees))
    .put(teamLeaderMiddleware, asyncHandler(departmentController.updateDepartmentAssignEmployee))
    .delete(teamLeaderMiddleware, asyncHandler(departmentController.updateDepartmentRemoveEmployee));

export default routerDepartment;

import express from 'express';
import departmentScheduleController from '../controllers/departmentSchedule';
import { asyncHandler } from '../middlewares/errorHandler';

const departmentScheduleRouter = express.Router();

departmentScheduleRouter.route('/')
    .get(asyncHandler(departmentScheduleController.getAllDepartmentSchedules))
    .post(asyncHandler(departmentScheduleController.createDepartmentSchedule));
departmentScheduleRouter.route('/:id')
    .put(asyncHandler(departmentScheduleController.updateDepartmentSchedule))
    .get(asyncHandler(departmentScheduleController.getDepartmentScheduleById))
    .delete(asyncHandler(departmentScheduleController.removeScheduleFromDepartment));

export default departmentScheduleRouter;
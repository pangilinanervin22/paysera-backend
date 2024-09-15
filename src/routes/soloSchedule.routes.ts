// import express from 'express';
// import soloScheduleController from '../controllers/soloSchedule';
// import { asyncHandler } from '../middlewares/errorHandler';

// const routerSoloSchedule = express.Router();

// routerSoloSchedule.route('/')
//     .get(asyncHandler(soloScheduleController.getAllSoloSchedules))
//     .post(asyncHandler(soloScheduleController.assignSoloSchedule));

// routerSoloSchedule.route('/:id')
//     .get(asyncHandler(soloScheduleController.getSoloScheduleById))
//     .put(asyncHandler(soloScheduleController.updateSoloSchedule))
//     .delete(asyncHandler(soloScheduleController.removeSoloSchedule));

// routerSoloSchedule.get('/employee/:id', asyncHandler(soloScheduleController.getSoloScheduleByEmployeeId));

// export default routerSoloSchedule;
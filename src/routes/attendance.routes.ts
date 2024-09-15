import express from "express";
import attendance from '../controllers/attendance';
import { asyncHandler } from "../middlewares/errorHandler";
import { lunchIn, lunchOut, timeIn, timeOut } from "../controllers/clock";


const routerAttendance = express.Router();

routerAttendance
    .route('/')
    .get(asyncHandler(attendance.getAllAttendance))
    .post(asyncHandler(attendance.createAttendance));

routerAttendance
    .route('/:id')
    .get(asyncHandler(attendance.getAttendanceById))
    .put(asyncHandler(attendance.updateAttendance))
    .delete(asyncHandler(attendance.deleteAttendance));

routerAttendance
    .route('/employee/:id')
    .get(asyncHandler(attendance.getAttendanceByEmployeeId))
    .put(asyncHandler(attendance.updateAttendanceByEmployeeId));

routerAttendance.post('/time-in', asyncHandler(timeIn));
routerAttendance.post('/time-out', asyncHandler(timeOut));
routerAttendance.post('/lunch-in', asyncHandler(lunchIn));
routerAttendance.post('/lunch-out', asyncHandler(lunchOut));

export default routerAttendance;

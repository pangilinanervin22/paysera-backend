import express from "express";
import employee from "../controllers/employee";
import { asyncHandler } from "../middlewares/errorHandler";
import { adminMiddleware, teamLeaderMiddleware } from "../middlewares";

const routerEmployee = express.Router();

routerEmployee.route("/team-leader").get(asyncHandler(employee.getAllTeamLeaders));
routerEmployee.route("/only-employee").get(asyncHandler(employee.getAllOnlyEmployee));
routerEmployee.route("/admin").get(asyncHandler(employee.getAllAdmin));

routerEmployee
    .route("/")
    .get(asyncHandler(employee.getAllEmployees))
    .post(adminMiddleware, asyncHandler(employee.createEmployee));
routerEmployee
    .route("/:id")
    .get(asyncHandler(employee.getEmployeeById))
    .delete(adminMiddleware, asyncHandler(employee.deleteEmployeeById))
    .put(adminMiddleware, asyncHandler(employee.updateEmployee));


export default routerEmployee;
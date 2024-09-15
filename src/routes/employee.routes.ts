import express from "express";
import employee from "../controllers/employee";
import { asyncHandler } from "../middlewares/errorHandler";

const routerEmployee = express.Router();

routerEmployee.route("/team-leader").get(asyncHandler(employee.getAllTeamLeaders));
routerEmployee.route("/only-employee").get(asyncHandler(employee.getAllOnlyEmployee));
routerEmployee.route("/admin").get(asyncHandler(employee.getAllAdmin));

routerEmployee
    .route("/")
    .get(asyncHandler(employee.getAllEmployees))
    .post(asyncHandler(employee.createEmployee));
routerEmployee
    .route("/:id")
    .get(asyncHandler(employee.getEmployeeById))
    .delete(asyncHandler(employee.deleteEmployeeById))
    .put(asyncHandler(employee.updateEmployee));


export default routerEmployee;
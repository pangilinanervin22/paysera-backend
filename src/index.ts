import { configEnv } from './config/dotenv';
import express from 'express';
import http from 'http';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import csurf from 'csurf';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import globalErrorHandler from './middlewares/errorHandler';
import YAML from 'yamljs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import routerEmployee from './routes/employee.routes';
import routerDepartment from './routes/department.routes';
import routerAttendance from './routes/attendance.routes';
import routerAuth from './routes/auth.routes';
import sampleRouter from './routes/sample.routes';
import departmentScheduleRouter from './routes/departmentSchedule.routes';
import { httpLoggerMiddleware } from './middlewares/logger';

const app = express();
const port = configEnv.PORT || 3000;

// Rate limiting to prevent brute-force attacks
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
});

// Essential Middleware
app.use(limiter); // Rate limiting
app.use(cookieParser()); // Parse cookies
app.use(cors({
    origin: [configEnv.ORIGIN], // Reflect the request origin
    credentials: true, // Allow sending cookies
})); // Enable CORS
if (configEnv.NODE_ENV === 'development') {
    app.use(httpLoggerMiddleware);
}
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies
app.use(helmet()); // Security headers with Helmet
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(compression()); // Compress responses
// app.use(csurf({ cookie: true })); // CSRF protection

// Routes
app.use(sampleRouter);
app.use("/api", routerAuth);
app.use("/api/employee", routerEmployee);
app.use("/api/department", routerDepartment);
app.use("/api/attendance", routerAttendance)
app.use("/api/department-schedule", departmentScheduleRouter);

// Docs
// Serve static files for Swagger UI
const swaggerDocument = YAML.load(path.resolve(__dirname, './docs/swagger.yaml'));
app.use('/swagger-ui', express.static(path.join(__dirname, '../node_modules/swagger-ui-dist')));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { customCssUrl: '/swagger-ui/swagger-ui.css' }));

// Handle Error Middleware
app.use(globalErrorHandler);

// 404 Error Middleware`
app.use((req, res, next) => {
    res.status(404).send({ error: 'Route Not Found' });
});

if (configEnv.NODE_ENV === 'development') {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

// Export the server for testing
const server = http.createServer(app);
export { server };

export default app;
import { Router } from "express";
import data from "./data.routes";
import authRoute from "./auth.routes";
import orgRoutes from './org.routes';
import projectRoutes from './project.routes';
// import taskRoutes from './task.routes';

const $ = Router();

$.use('/api/auth', authRoute)
$.use(data);
$.use('/api/org', orgRoutes)
$.use("/api", projectRoutes);
// $.use('/api', taskRoutes)

export default $;

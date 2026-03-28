import { Router } from 'express';
import authRoutes from './auth.routes.js';
import projectRoutes from './project.routes.js';
import aiRoutes from './ai.routes.js';
import buildRoutes from './build.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/ai', aiRoutes);
router.use('/', buildRoutes);

export default router;

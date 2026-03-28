import { Router, Response } from 'express';
import { createBuildSchema, createDeploySchema } from '@lovable-clone/shared';
import { validate } from '../middleware/validate.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { buildService } from '../services/build.service.js';
import { deployService } from '../services/deploy.service.js';
import { projectService } from '../services/project.service.js';

const router = Router();
router.use(authMiddleware);

// Create build
router.post('/projects/:id/builds', validate(createBuildSchema), async (req: AuthRequest, res: Response) => {
  const project = await projectService.get(req.params.id, req.userId!);
  if (!project) { res.status(404).json({ success: false, error: 'Project not found' }); return; }
  const build = await buildService.create(project.id, req.body.platform);
  res.json({ success: true, data: build });
});

// List builds
router.get('/projects/:id/builds', async (req: AuthRequest, res: Response) => {
  const project = await projectService.get(req.params.id, req.userId!);
  if (!project) { res.status(404).json({ success: false, error: 'Project not found' }); return; }
  const builds = await buildService.list(project.id);
  res.json({ success: true, data: builds });
});

// Get build
router.get('/builds/:buildId', async (req: AuthRequest, res: Response) => {
  const build = await buildService.get(req.params.buildId);
  if (!build) { res.status(404).json({ success: false, error: 'Build not found' }); return; }
  res.json({ success: true, data: build });
});

// Deploy build
router.post('/builds/:buildId/deploy', validate(createDeploySchema), async (req: AuthRequest, res: Response) => {
  const build = await buildService.get(req.params.buildId);
  if (!build) { res.status(404).json({ success: false, error: 'Build not found' }); return; }
  if (build.status !== 'success') {
    res.status(400).json({ success: false, error: 'Build must be successful before deploying' });
    return;
  }
  const deployment = await deployService.create(build.id, req.body.store);
  res.json({ success: true, data: deployment });
});

// Get deployment
router.get('/deployments/:deployId', async (req: AuthRequest, res: Response) => {
  const deployment = await deployService.get(req.params.deployId);
  if (!deployment) { res.status(404).json({ success: false, error: 'Deployment not found' }); return; }
  res.json({ success: true, data: deployment });
});

export default router;

import { Router, Response } from 'express';
import { createProjectSchema } from '@lovable-clone/shared';
import { validate } from '../middleware/validate.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { projectService } from '../services/project.service.js';
import { fileManager } from '../services/fileManager.service.js';
import { previewManager } from '../services/previewManager.service.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  const projects = await projectService.list(req.userId!);
  res.json({ success: true, data: projects });
});

router.post('/', validate(createProjectSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { name, framework, description } = req.body;
    const project = await projectService.create(req.userId!, name, framework, description);
    res.json({ success: true, data: project });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const project = await projectService.get(req.params.id, req.userId!);
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' });
    return;
  }
  res.json({ success: true, data: project });
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await projectService.delete(req.params.id, req.userId!);
  res.json({ success: true });
});

// File system routes
router.get('/:id/files', async (req: AuthRequest, res: Response) => {
  const project = await projectService.get(req.params.id, req.userId!);
  if (!project) { res.status(404).json({ success: false, error: 'Project not found' }); return; }
  const tree = await fileManager.readTree(project.storagePath);
  res.json({ success: true, data: tree });
});

router.get('/:id/files/*', async (req: AuthRequest, res: Response) => {
  const project = await projectService.get(req.params.id, req.userId!);
  if (!project) { res.status(404).json({ success: false, error: 'Project not found' }); return; }
  try {
    const filePath = (req.params as any)[0];
    const content = await fileManager.readFile(project.storagePath, filePath);
    res.json({ success: true, data: { content } });
  } catch (err: any) {
    res.status(404).json({ success: false, error: 'File not found' });
  }
});

router.put('/:id/files/*', async (req: AuthRequest, res: Response) => {
  const project = await projectService.get(req.params.id, req.userId!);
  if (!project) { res.status(404).json({ success: false, error: 'Project not found' }); return; }
  try {
    const filePath = (req.params as any)[0];
    await fileManager.writeFile(project.storagePath, filePath, req.body.content);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/:id/files/*', async (req: AuthRequest, res: Response) => {
  const project = await projectService.get(req.params.id, req.userId!);
  if (!project) { res.status(404).json({ success: false, error: 'Project not found' }); return; }
  try {
    const filePath = (req.params as any)[0];
    await fileManager.deleteFile(project.storagePath, filePath);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Preview routes
router.post('/:id/preview/start', async (req: AuthRequest, res: Response) => {
  const project = await projectService.get(req.params.id, req.userId!);
  if (!project) { res.status(404).json({ success: false, error: 'Project not found' }); return; }
  try {
    const result = await previewManager.startPreview(project.id, project.framework, project.storagePath);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id/preview', async (req: AuthRequest, res: Response) => {
  const project = await projectService.get(req.params.id, req.userId!);
  if (!project) { res.status(404).json({ success: false, error: 'Project not found' }); return; }
  const result = await previewManager.getPreview(project.id);
  res.json({ success: true, data: result });
});

router.post('/:id/preview/restart', async (req: AuthRequest, res: Response) => {
  const project = await projectService.get(req.params.id, req.userId!);
  if (!project) { res.status(404).json({ success: false, error: 'Project not found' }); return; }
  try {
    const result = await previewManager.restartPreview(project.id, project.framework, project.storagePath);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/preview/stop', async (req: AuthRequest, res: Response) => {
  const project = await projectService.get(req.params.id, req.userId!);
  if (!project) { res.status(404).json({ success: false, error: 'Project not found' }); return; }
  await previewManager.stopPreview(project.id);
  res.json({ success: true });
});

export default router;

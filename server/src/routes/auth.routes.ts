import { Router, Request, Response } from 'express';
import { loginSchema, signupSchema } from '@lovable-clone/shared';
import { validate } from '../middleware/validate.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { authService } from '../services/auth.service.js';

const router = Router();

router.post('/signup', validate(signupSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const result = await authService.signup(email, password, name);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(401).json({ success: false, error: err.message });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.getUser(req.userId!);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

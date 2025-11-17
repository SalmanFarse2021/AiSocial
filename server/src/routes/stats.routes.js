import { Router } from 'express';
import { getPublicStats } from '../controllers/stats.controller.js';

const router = Router();

// Public endpoint - no authentication required
router.get('/public', getPublicStats);

export default router;

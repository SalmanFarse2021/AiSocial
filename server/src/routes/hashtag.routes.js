import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { searchHashtags } from '../controllers/post.controller.js';

const router = Router();

router.get('/search', authRequired, searchHashtags);

export default router;

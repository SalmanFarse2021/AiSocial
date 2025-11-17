import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { createStory, feedStories, userStories, reactStory, unreactStory } from '../controllers/story.controller.js';

const router = Router();

router.post('/', authRequired, createStory);
router.get('/feed', authRequired, feedStories);
router.get('/user/:username', authRequired, userStories);
router.post('/:id/react', authRequired, reactStory);
router.delete('/:id/react', authRequired, unreactStory);

export default router;

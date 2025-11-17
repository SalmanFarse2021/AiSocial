import express from 'express';
import { 
  generateCaption, 
  analyzeImage, 
  modifyImageWithPrompt,
  generateHashtags,
  generateBio 
} from '../controllers/aiController.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

// Generate captions using Gemini AI
router.post('/generate-caption', authRequired, generateCaption);

// Analyze image for enhancement suggestions
router.post('/analyze-image', authRequired, analyzeImage);

// Generate modification suggestions based on user prompt
router.post('/modify-image', authRequired, modifyImageWithPrompt);

// Generate hashtags for image
router.post('/generate-hashtags', authRequired, generateHashtags);

// Generate AI bio based on user's posts and interests
router.post('/generate-bio', authRequired, generateBio);

export default router;

import express from 'express';
import { authRequired } from '../middleware/auth.js';
import {
  createCall,
  updateCallStatus,
  getCallHistory,
  getCallStats,
} from '../controllers/call.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authRequired);

// Create a new call
router.post('/', createCall);

// Update call status
router.patch('/:callId', updateCallStatus);

// Get call history
router.get('/history', getCallHistory);

// Get call statistics
router.get('/stats', getCallStats);

export default router;

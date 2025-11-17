import express from 'express';
import { authRequired } from '../middleware/auth.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notification.controller.js';

const router = express.Router();

// Get all notifications for current user
router.get('/', authRequired, getNotifications);

// Mark notification as read
router.put('/:id/read', authRequired, markAsRead);

// Mark all notifications as read
router.put('/read-all', authRequired, markAllAsRead);

// Delete a notification
router.delete('/:id', authRequired, deleteNotification);

export default router;
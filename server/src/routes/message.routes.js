import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import {
  getOrCreateDirectConversation,
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  addMessageReaction,
  removeMessageReaction,
  deleteMessage,
  createGroupChat,
  updateGroupChat,
  addGroupParticipant,
  removeGroupParticipant,
  getUnreadCount,
  muteConversation,
  deleteConversation,
} from '../controllers/message.controller.js';

const router = Router();

// Conversation routes
router.post('/conversations/direct', authRequired, getOrCreateDirectConversation);
router.get('/conversations', authRequired, getConversations);
router.get('/unread-count', authRequired, getUnreadCount);
router.post('/conversations/group', authRequired, createGroupChat);
router.patch('/conversations/:conversationId', authRequired, updateGroupChat);
router.patch('/conversations/:conversationId/mute', authRequired, muteConversation);
router.delete('/conversations/:conversationId', authRequired, deleteConversation);

// Message routes
router.get('/conversations/:conversationId/messages', authRequired, getMessages);
router.post('/conversations/:conversationId/messages', authRequired, sendMessage);
router.patch('/conversations/:conversationId/mark-read', authRequired, markMessagesAsRead);

// Message actions
router.post('/messages/:messageId/reactions', authRequired, addMessageReaction);
router.delete('/messages/:messageId/reactions', authRequired, removeMessageReaction);
router.delete('/messages/:messageId', authRequired, deleteMessage);

// Group participant management
router.post('/conversations/:conversationId/participants', authRequired, addGroupParticipant);
router.delete('/conversations/:conversationId/participants/:userId', authRequired, removeGroupParticipant);

// Call routes
router.post('/conversations/:conversationId/call', authRequired, (req, res) => {
  // This endpoint handles call initiation
  // In production, integrate with Socket.io for real-time signaling
  res.json({ success: true, message: 'Call initiated' });
});

export default router;

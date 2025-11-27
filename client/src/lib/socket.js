import io from 'socket.io-client';

let socket = null;
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050';

/**
 * Initialize Socket.io connection
 */
export const initSocket = (userId) => {
  if (socket && socket.connected) {
    console.log('Socket already connected');
    return socket;
  }

  socket = io(API_URL, {
    auth: {
      token: localStorage.getItem('token'),
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    socket.emit('user-connected', userId);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

/**
 * Disconnect Socket.io
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Emit send message event
 */
export const emitSendMessage = (conversationId, message) => {
  if (socket && socket.connected) {
    socket.emit('send-message', {
      conversationId,
      message,
    });
  }
};

/**
 * Emit join conversation event
 */
export const emitJoinConversation = (conversationId) => {
  if (socket && socket.connected) {
    socket.emit('join-conversation', conversationId);
  }
};

/**
 * Emit leave conversation event
 */
export const emitLeaveConversation = (conversationId) => {
  if (socket && socket.connected) {
    socket.emit('leave-conversation', conversationId);
  }
};

/**
 * Emit typing event
 */
export const emitTyping = (conversationId, isTyping) => {
  if (socket && socket.connected) {
    socket.emit('typing', {
      conversationId,
      isTyping,
    });
  }
};

/**
 * Listen for incoming messages
 */
export const onMessageReceived = (callback) => {
  if (socket) {
    socket.on('message-received', callback);
  }
};

/**
 * Listen for message read receipts
 */
export const onMessageRead = (callback) => {
  if (socket) {
    socket.on('message-read', callback);
  }
};

/**
 * Listen for typing indicators
 */
export const onUserTyping = (callback) => {
  if (socket) {
    socket.on('user-typing', callback);
  }
};

/**
 * Listen for emoji reactions
 */
export const onReactionAdded = (callback) => {
  if (socket) {
    socket.on('reaction-added', callback);
  }
};

/**
 * Listen for message deletion
 */
export const onMessageDeleted = (callback) => {
  if (socket) {
    socket.on('message-deleted', callback);
  }
};

/**
 * Emit add reaction event
 */
export const emitAddReaction = (messageId, reaction) => {
  if (socket && socket.connected) {
    socket.emit('add-reaction', {
      messageId,
      reaction,
    });
  }
};

/**
 * Emit remove reaction event
 */
export const emitRemoveReaction = (messageId, reaction) => {
  if (socket && socket.connected) {
    socket.emit('remove-reaction', {
      messageId,
      reaction,
    });
  }
};

/**
 * Emit delete message event
 */
export const emitDeleteMessage = (messageId, conversationId) => {
  if (socket && socket.connected) {
    socket.emit('delete-message', {
      messageId,
      conversationId,
    });
  }
};

/**
 * Get socket instance
 */
export const getSocket = () => socket;

/**
 * Check if socket is connected
 */
export const isSocketConnected = () => socket && socket.connected;

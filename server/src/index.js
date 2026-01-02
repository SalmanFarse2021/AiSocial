import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './modules/db.js';
import { initCloudinary } from './modules/cloudinary.js';
import passport, { initPassport } from './modules/passport.js';
import { sanitizeUsersGeo } from './maintenance/sanitizeGeo.js';
import authRoutes from './routes/auth.routes.js';
import healthRoutes from './routes/health.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import userRoutes from './routes/user.routes.js';
import postRoutes from './routes/post.routes.js';
import storyRoutes from './routes/story.routes.js';
import albumRoutes from './routes/album.routes.js';
import messageRoutes from './routes/message.routes.js';
import aiRoutes from './routes/aiRoutes.js';
import notificationRoutes from './routes/notification.routes.js';
import hashtagRoutes from './routes/hashtag.routes.js';
import statsRoutes from './routes/stats.routes.js';
import { registerCallHandlers } from './socket/callHandlers.js';
import { socketAuth } from './middleware/socketAuth.js';

// Default port matches client fallback (5050) and avoids macOS Control Center using 5000
const DEFAULT_PORT = 5050;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

const app = express();
// Required for correct protocol/host detection behind proxies (e.g., Vercel) for OAuth redirects
app.set('trust proxy', 1);
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, credentials: true },
});

io.use(socketAuth);



app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(passport.initialize());

app.get('/', (_req, res) => {
  res.json({ name: 'AiSocial API', status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/hashtags', hashtagRoutes);
app.use('/api/stats', statsRoutes);

// Debug route for sockets
app.get('/api/debug/sockets', (req, res) => {
  // This is dirty but effective for debugging since we can't export the map easily from inside start()
  // Wait, we can't access userSockets here because it's scoped to start().
  // We attached it to global in Step 926!
  // But Step 926 showed: global.io = io; global.emitToUser = emitToUser; 
  // It did NOT attach userSockets.
  // However, we can use the result of io.sockets.sockets to see all connected sockets.

  // Better: let's expose userSockets to global temporarily in start() function.

  // For now, let's just inspect io.sockets
  const connected = [];
  if (global.io) {
    global.io.sockets.sockets.forEach((s) => {
      connected.push({
        id: s.id,
        userId: s.userId,
        connected: s.connected
      });
    });
  }
  res.json({ count: connected.length, sockets: connected });
});

async function start() {
  try {
    await connectDB();
    initCloudinary();
    initPassport();
    await sanitizeUsersGeo();

    // Socket.io setup

    // Global User Registry: Map<userId, Set<socketId>>
    // This handles multi-device support
    const userSockets = new Map();

    // Helper: Emit to specific user (all their devices)
    const emitToUser = (userId, event, payload) => {
      const sockets = userSockets.get(String(userId));
      if (sockets) {
        sockets.forEach(socketId => {
          io.to(socketId).emit(event, payload);
        });
        return true;
      }
      return false;
    };

    // Helper: Check if user is online
    const isOnline = (userId) => {
      return userSockets.has(String(userId)) && userSockets.get(String(userId)).size > 0;
    };

    io.on('connection', (socket) => {
      console.log(`✅ User connected: ${socket.userId} (${socket.id})`);

      // Add to registry
      const userId = socket.userId;
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);

      // Join user-specific room (user:userId) for easy targeting if needed, 
      // but registry is often more robust for multi-device tracking logic.
      socket.join(`user:${userId}`);

      // Broadcast online status only if this is their first connection
      if (userSockets.get(userId).size === 1) {
        socket.broadcast.emit('user-online', userId);
      }

      console.log(`User ${userId} active on ${userSockets.get(userId).size} device(s)`);

      // Initialize Call Handlers
      registerCallHandlers(io, socket, { emitToUser, isOnline });


      // Handle sending messages
      socket.on('send-message', (data) => {
        const { conversationId, message } = data;
        io.to(`conversation:${conversationId}`).emit('message-received', message);
      });

      // Join conversation room
      socket.on('join-conversation', (conversationId) => {
        socket.join(`conversation:${conversationId}`);
      });

      // Leave conversation room
      socket.on('leave-conversation', (conversationId) => {
        socket.leave(`conversation:${conversationId}`);
      });

      // Handle typing
      socket.on('typing', (data) => {
        const { conversationId, isTyping } = data;
        socket.to(`conversation:${conversationId}`).emit('user-typing', {
          userId: socket.userId,
          isTyping,
        });
      });

      // Handle reaction added
      socket.on('add-reaction', (data) => {
        const { messageId, reaction, conversationId } = data;
        io.to(`conversation:${conversationId}`).emit('reaction-added', {
          messageId,
          reaction,
          userId: socket.userId,
        });
      });

      // Handle reaction removed
      socket.on('remove-reaction', (data) => {
        const { messageId, reaction, conversationId } = data;
        io.to(`conversation:${conversationId}`).emit('reaction-removed', {
          messageId,
          reaction,
          userId: socket.userId,
        });
      });

      // Handle message deletion
      socket.on('delete-message', (data) => {
        const { messageId, conversationId } = data;
        io.to(`conversation:${conversationId}`).emit('message-deleted', {
          messageId,
        });
      });

      // Handle message read
      socket.on('mark-read', (data) => {
        const { conversationId, userId: senderId } = data;
        // Emit to the sender that their message was read
        emitToUser(senderId, 'message-read', { conversationId });
      });

      // WebRTC Audio Call Signaling
      socket.on('call:initiate', (data) => {
        const { to, from, conversationId } = data;
        console.log(`📞 Call initiated from ${from} to ${to}`);
        io.to(`user:${to}`).emit('call:incoming', {
          from,
          conversationId,
        });
      });

      socket.on('call:accept', (data) => {
        const { to, from } = data;
        console.log(`✅ Call accepted by ${from} to ${to}`);
        io.to(`user:${to}`).emit('call:accepted', { from });
      });

      socket.on('call:reject', (data) => {
        const { to, from } = data;
        console.log(`❌ Call rejected by ${from}`);
        io.to(`user:${to}`).emit('call:rejected', { from });
      });

      socket.on('call:end', (data) => {
        const { to, from } = data;
        console.log(`📴 Call ended by ${from}`);
        io.to(`user:${to}`).emit('call:ended', { from });
      });

      socket.on('call:offer', (data) => {
        const { to, offer, from } = data;
        console.log(`📤 WebRTC offer sent from ${from} to ${to}`);
        io.to(`user:${to}`).emit('call:offer', { offer, from });
      });

      socket.on('call:answer', (data) => {
        const { to, answer, from } = data;
        console.log(`📥 WebRTC answer sent from ${from} to ${to}`);
        io.to(`user:${to}`).emit('call:answer', { answer, from });
      });

      socket.on('call:ice-candidate', (data) => {
        const { to, candidate, from } = data;
        io.to(`user:${to}`).emit('call:ice-candidate', { candidate, from });
      });

      socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${userId} (${socket.id})`);

        // Remove from registry
        if (userSockets.has(userId)) {
          const userdevs = userSockets.get(userId);
          userdevs.delete(socket.id);

          if (userdevs.size === 0) {
            userSockets.delete(userId);
            socket.broadcast.emit('user-offline', userId);
          }
        }
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });

    // Make io events accessible globally via app or export if needed later
    // For now we'll keep logic here or move to modular handlers in Step 3
    global.io = io;
    global.emitToUser = emitToUser;
    global.isOnline = isOnline;

    httpServer.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

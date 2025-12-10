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

async function start() {
  try {
    await connectDB();
    initCloudinary();
    initPassport();
    await sanitizeUsersGeo();

    // Socket.io setup
    io.on('connection', (socket) => {
      console.log('✅ New user connected:', socket.id);

      // Store user ID with socket
      socket.on('user-connected', (userId) => {
        socket.userId = userId;
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined room user:${userId}`);
      });

      // Handle sending messages
      socket.on('send-message', (data) => {
        const { conversationId, message } = data;
        console.log(`📨 Message sent in conversation ${conversationId}:`, message);
        io.to(`conversation:${conversationId}`).emit('message-received', message);
      });

      // Join conversation room
      socket.on('join-conversation', (conversationId) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`✅ Socket ${socket.id} joined conversation:${conversationId}`);
      });

      // Leave conversation room
      socket.on('leave-conversation', (conversationId) => {
        socket.leave(`conversation:${conversationId}`);
        console.log(`❌ Socket ${socket.id} left conversation:${conversationId}`);
      });

      // Handle typing
      socket.on('typing', (data) => {
        const { conversationId, isTyping } = data;
        io.to(`conversation:${conversationId}`).emit('user-typing', {
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
        io.to(`user:${senderId}`).emit('message-read', {
          conversationId,
        });
      });

      socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });

    httpServer.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

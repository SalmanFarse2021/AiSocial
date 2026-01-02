import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }

        const secret = process.env.JWT_SECRET || 'dev-secret';
        const payload = jwt.verify(token, secret);

        // Check if user exists (optional but recommended for security)
        const user = await User.findById(payload.sub).select('_id username');
        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }

        // Attach user ID to socket
        socket.userId = user._id.toString();
        socket.user = user;

        next();
    } catch (err) {
        console.error('Socket auth error:', err.message);
        next(new Error('Authentication error: Invalid token'));
    }
};

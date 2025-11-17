import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { signToken } from '../modules/token.js';

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function register(req, res) {
  try {
    const { username, email, password } = registerSchema.parse(req.body);
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(409).json({ message: 'User already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });
    const token = signToken(user);
    res.status(201).json({
      user: { id: user._id, username: user.username, email: user.email },
      token,
    });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ message: 'Invalid input', issues: err.issues });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ user: { id: user._id, username: user.username, email: user.email }, token });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ message: 'Invalid input', issues: err.issues });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

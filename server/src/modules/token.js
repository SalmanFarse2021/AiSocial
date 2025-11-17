import jwt from 'jsonwebtoken';

export function signToken(user) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign({ sub: user._id, username: user.username }, secret, { expiresIn: '7d' });
}


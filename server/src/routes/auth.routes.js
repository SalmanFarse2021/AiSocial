import { Router } from 'express';
import passport from 'passport';
import { login, register } from '../controllers/auth.controller.js';
import { signToken } from '../modules/token.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);

const isGoogleConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const requireGoogleOAuth = (req, res, next) => {
  if (!isGoogleConfigured()) {
    return res.status(501).json({ message: 'Google OAuth not configured' });
  }
  return next();
};

// Google OAuth
router.get(
  '/google',
  requireGoogleOAuth,
  passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })
);

router.get(
  '/google/callback',
  requireGoogleOAuth,
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        console.error('❌ No user in callback');
        return res.redirect('/login?error=no_user');
      }

      const token = signToken(user);
      console.log('✅ Google OAuth success for:', user.username);

      const origin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
      const redirect = new URL('/login', origin);
      redirect.searchParams.set('token', token);
      redirect.searchParams.set('username', user.username);

      console.log('🔄 Redirecting to:', redirect.toString());
      res.redirect(redirect.toString());
    } catch (err) {
      console.error('❌ OAuth callback error:', err);
      res.redirect('/login?error=server_error');
    }
  }
);

// Facebook OAuth
const hasFb = !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);
if (hasFb) {
  router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
  router.get(
    '/facebook/callback',
    passport.authenticate('facebook', { session: false, failureRedirect: '/?auth=failed' }),
    (req, res) => {
      const user = req.user;
      const token = signToken(user);
      const origin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
      const redirect = new URL('/login', origin);
      redirect.searchParams.set('token', token);
      redirect.searchParams.set('username', user.username);
      res.redirect(redirect.toString());
    }
  );
} else {
  router.get('/facebook', (_req, res) => res.status(501).json({ message: 'Facebook OAuth not configured' }));
}

// Facebook OAuth removed; Google only

export default router;

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { User } from '../models/User.js';

function sanitizeUsername(base) {
  return base
    .toLowerCase()
    .replace(/[^a-z0-9_\.\-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24) || 'user';
}

async function ensureUniqueUsername(suggested) {
  let candidate = sanitizeUsername(suggested);
  let suffix = 0;
  // Try up to 20 variants
  while (suffix < 20) {
    const username = suffix === 0 ? candidate : `${candidate}${suffix}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.exists({ username });
    if (!exists) return username;
    suffix += 1;
  }
  // Fallback to random
  return `user${Date.now().toString(36)}`;
}

export function initPassport() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET } = process.env;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback';
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️ Google OAuth env vars missing; set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
    return passport;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value?.toLowerCase();
          const displayName = profile.displayName || 'User';
          const avatar = profile.photos?.[0]?.value;

          let user = await User.findOne({ $or: [{ googleId }, { email }] });
          if (user) {
            if (!user.googleId) user.googleId = googleId;
            if (avatar && !user.profilePic) user.profilePic = avatar;
            await user.save();
          } else {
            const baseUsername = email ? email.split('@')[0] : displayName.replace(/\s+/g, '-');
            const username = await ensureUniqueUsername(baseUsername);
            user = await User.create({ username, email, googleId, profilePic: avatar, displayName });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Facebook strategy
  if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: FACEBOOK_APP_ID,
          clientSecret: FACEBOOK_APP_SECRET,
          callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/api/auth/facebook/callback',
          profileFields: ['id', 'displayName', 'photos', 'email'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const facebookId = profile.id;
            const email = profile.emails?.[0]?.value?.toLowerCase();
            const displayName = profile.displayName || 'User';
            const avatar = profile.photos?.[0]?.value;

            let user = await User.findOne({ $or: [{ facebookId }, { email }] });
            if (user) {
              if (!user.facebookId) user.facebookId = facebookId;
              if (avatar && !user.profilePic) user.profilePic = avatar;
              await user.save();
            } else {
              const baseUsername = email ? email.split('@')[0] : displayName.replace(/\s+/g, '-');
              const username = await ensureUniqueUsername(baseUsername);
              user = await User.create({ username, email, facebookId, profilePic: avatar, displayName });
            }
            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  }
  
  return passport;
}

export default passport;

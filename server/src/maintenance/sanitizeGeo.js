import { User } from '../models/User.js';

export async function sanitizeUsersGeo() {
  try {
    const r1 = await User.updateMany({ 'location.type': 'Point', 'location.coordinates': { $exists: false } }, { $unset: { location: '' } });
    const r2 = await User.updateMany({ 'location.type': 'Point', 'location.coordinates': { $size: 0 } }, { $unset: { location: '' } });
    const modified = (r1?.modifiedCount || 0) + (r2?.modifiedCount || 0);
    if (modified) console.log(`Sanitized users with invalid location: ${modified}`);
  } catch (e) {
    console.warn('Geo sanitize skipped:', e.message);
  }
}


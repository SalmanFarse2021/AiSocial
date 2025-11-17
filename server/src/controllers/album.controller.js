import { z } from 'zod';
import { Album } from '../models/Album.js';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';

const createAlbumSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  privacy: z.enum(['public', 'friends', 'private', 'custom']).optional(),
});

export async function createAlbum(req, res) {
  try {
    const body = createAlbumSchema.parse(req.body);
    const exists = await Album.findOne({ user: req.user._id, name: body.name });
    if (exists) return res.status(400).json({ message: 'Album with this name already exists' });
    const album = await Album.create({
      user: req.user._id,
      name: body.name.trim(),
      description: body.description || '',
      privacy: body.privacy || 'public',
      isSystem: false,
    });
    res.status(201).json({ album });
  } catch (e) {
    if (e?.issues) return res.status(400).json({ message: 'Invalid input', issues: e.issues });
    res.status(500).json({ message: 'Server error' });
  }
}

export async function listUserAlbums(req, res) {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('_id username profilePic').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const albums = await Album.find({ user: user._id }).sort({ isSystem: -1, createdAt: -1 }).lean();

    // Compute counts and covers
    const result = [];
    for (const a of albums) {
      const count = await Post.countDocuments({ user: user._id, album: a._id, 'media.0': { $exists: true } });
      const cover = await Post.findOne({ user: user._id, album: a._id, 'media.0': { $exists: true } })
        .sort({ createdAt: -1 })
        .select('media')
        .lean();
      result.push({ id: a._id, name: a.name, description: a.description || '', privacy: a.privacy, isSystem: !!a.isSystem, count, coverUrl: cover?.media?.[0]?.url || '' });
    }

    // Virtual "Uploads" album: media posts without an album
    const uploadsCount = await Post.countDocuments({ user: user._id, album: { $exists: false }, 'media.0': { $exists: true } });
    if (uploadsCount > 0) {
      const cover = await Post.findOne({ user: user._id, album: { $exists: false }, 'media.0': { $exists: true } })
        .sort({ createdAt: -1 })
        .select('media')
        .lean();
      result.unshift({ id: 'virtual:uploads', name: 'Uploads', description: '', privacy: 'public', isSystem: true, count: uploadsCount, coverUrl: cover?.media?.[0]?.url || '' });
    }

    res.json({ albums: result });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function listAlbumPhotos(req, res) {
  try {
    const { id } = req.params; // album id or 'virtual:uploads'
    const limit = Math.min(parseInt(req.query.limit, 10) || 60, 120);
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;
    let query;
    if (id === 'virtual:uploads') {
      // photos without album for the current user or requested username
      const userId = req.query.userId || req.user._id;
      query = { user: userId, album: { $exists: false }, 'media.0': { $exists: true } };
    } else {
      // enforce privacy: owner or public/friends if allowed
      const album = await Album.findById(id).lean();
      if (!album) return res.status(404).json({ message: 'Album not found' });
      const isOwner = String(album.user) === String(req.user._id);
      if (!isOwner) {
        if (album.privacy === 'private') return res.status(403).json({ message: 'Album is private' });
        if (album.privacy === 'friends') {
          const owner = await User.findById(album.user).select('friends').lean();
          const isFriend = (owner?.friends || []).map(String).includes(String(req.user._id));
          if (!isFriend) return res.status(403).json({ message: 'Album visible to friends only' });
        }
      }
      query = { album: album._id, 'media.0': { $exists: true } };
    }
    if (cursor && !isNaN(cursor.getTime())) query.createdAt = { $lt: cursor };
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('user', 'username profilePic')
      .lean();
    const nextCursor = posts.length > limit ? posts[limit - 1]?.createdAt : null;
    const items = posts.slice(0, limit).map((p) => ({
      ...p,
      didLike: (p.likedBy || []).some((id) => String(id) === String(req.user._id)),
      likes: (p.likedBy || []).length,
    }));
    res.json({ posts: items, nextCursor });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}


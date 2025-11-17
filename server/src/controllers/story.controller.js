import { z } from 'zod';
import { Story } from '../models/Story.js';
import { User } from '../models/User.js';

const createSchema = z.object({
  url: z.string().url(),
  width: z.number().optional(),
  height: z.number().optional(),
  format: z.string().optional(),
  type: z.enum(['image', 'video']).optional(),
  ttlHours: z.number().min(1).max(72).optional(),
});

export async function createStory(req, res) {
  try {
    const { url, width, height, format, type, ttlHours } = createSchema.parse(req.body);
    const hours = ttlHours || 24;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    const story = await Story.create({
      user: req.user._id,
      media: { url, width, height, format, type: type || 'image' },
      expiresAt,
    });
    const populated = await Story.findById(story._id).populate('user', 'username profilePic').lean();
    res.status(201).json({ story: populated });
  } catch (e) {
    if (e?.issues) return res.status(400).json({ message: 'Invalid input', issues: e.issues });
    res.status(500).json({ message: 'Server error' });
  }
}

export async function feedStories(req, res) {
  try {
    const now = new Date();
    const docs = await Story.find({ expiresAt: { $gt: now } })
      .sort({ createdAt: -1 })
      .populate('user', 'username profilePic')
      .lean();

    const grouped = [];
    const byUser = new Map();
    for (const s of docs) {
      // add viewer's reaction if any
      const myReaction = (s.reactions || []).find((r) => String(r.user) === String(req.user._id))?.type;
      s.myReaction = myReaction || null;
      const uid = String(s.user._id);
      if (!byUser.has(uid)) {
        const group = { user: s.user, stories: [] };
        byUser.set(uid, group);
        grouped.push(group);
      }
      // avoid sending full reactions array to client
      delete s.reactions;
      byUser.get(uid).stories.push(s);
    }
    res.json({ groups: grouped });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function userStories(req, res) {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('_id username profilePic').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const now = new Date();
    const stories = await Story.find({ user: user._id, expiresAt: { $gt: now } })
      .sort({ createdAt: 1 })
      .lean();
    res.json({ user, stories });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

const reactSchema = z.object({
  type: z.enum(['❤️', '😂', '🔥', '👍', '👏', '😮', '😢', '😡']),
});

export async function reactStory(req, res) {
  try {
    const { id } = req.params;
    const { type } = reactSchema.parse(req.body);
    const exists = await Story.exists({ _id: id });
    if (!exists) return res.status(404).json({ message: 'Story not found' });
    const userId = req.user._id;
    await Story.updateOne({ _id: id }, { $pull: { reactions: { user: userId } } });
    await Story.updateOne({ _id: id }, { $push: { reactions: { user: userId, type, createdAt: new Date() } } });
    res.json({ ok: true, type });
  } catch (e) {
    if (e?.issues) return res.status(400).json({ message: 'Invalid reaction' });
    res.status(500).json({ message: 'Server error' });
  }
}

export async function unreactStory(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    await Story.updateOne({ _id: id }, { $pull: { reactions: { user: userId } } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

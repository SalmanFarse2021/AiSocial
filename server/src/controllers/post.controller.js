import { z } from 'zod';
import mongoose from 'mongoose';
import { Post } from '../models/Post.js';
import { Album } from '../models/Album.js';
import { User } from '../models/User.js';
import { Comment } from '../models/Comment.js';
import { createNotification } from './notification.controller.js';

const createSchema = z
  .object({
    caption: z.string().max(2200).optional(),
    type: z.enum(['post', 'reel']).default('post'),
    media: z
      .array(
        z.object({ url: z.string().url(), width: z.number().optional(), height: z.number().optional(), format: z.string().optional() })
      )
      .optional(),
    privacy: z.enum(['public','friends','private','custom']).optional(),
    taggedUsernames: z.array(z.string()).optional(),
    taggedIds: z.array(z.string()).optional(),
    albumId: z.string().optional(),
    albumName: z.string().max(120).optional(),
    location: z.object({ name: z.string(), lat: z.number().min(-90).max(90).optional(), lng: z.number().min(-180).max(180).optional() }).optional(),
    feeling: z.string().max(40).optional(),
    activity: z.string().max(60).optional(),
  })
  .refine((d) => (d.caption && d.caption.trim().length > 0) || (Array.isArray(d.media) && d.media.length > 0), {
    message: 'Provide text or at least one media',
  });

export async function create(req, res) {
  try {
    const body = createSchema.parse(req.body);
    // resolve tagged users
    let taggedUsers = [];
    if (body.taggedIds?.length) {
      taggedUsers = body.taggedIds.filter(Boolean);
    } else if (body.taggedUsernames?.length) {
      const users = await User.find({ username: { $in: body.taggedUsernames } }).select('_id');
      taggedUsers = users.map((u) => u._id);
    }
    // resolve album if provided
    let albumId = null;
    if (body.albumId) {
      const album = await Album.findOne({ _id: body.albumId, user: req.user._id });
      if (album) albumId = album._id;
    } else if (body.albumName) {
      const name = body.albumName.trim();
      const isSystem = ['Profile Pictures', 'Cover Photos'].includes(name);
      const systemType = name === 'Profile Pictures' ? 'profile' : name === 'Cover Photos' ? 'cover' : null;
      let album = await Album.findOne({ user: req.user._id, name });
      if (!album) {
        album = await Album.create({ user: req.user._id, name, isSystem, systemType: systemType || null, privacy: body.privacy || 'public' });
      }
      albumId = album._id;
    }

    const doc = await Post.create({
      user: req.user._id,
      type: body.type || 'post',
      caption: body.caption || '',
      media: body.media || [],
      privacy: body.privacy || 'public',
      album: albumId || undefined,
      taggedUsers,
      location: body.location
        ? { name: body.location.name, point: body.location.lat != null && body.location.lng != null ? { type: 'Point', coordinates: [body.location.lng, body.location.lat] } : undefined }
        : undefined,
      feeling: body.feeling,
      activity: body.activity,
    });
    const populated = await Post.findById(doc._id).populate('user', 'username profilePic').lean();
    res.status(201).json({ post: { ...populated, didLike: false, likes: 0 } });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ message: 'Invalid input', issues: err.issues });
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getUserPosts(req, res) {
  try {
    const { username } = req.params;
    const type = (req.query.type || 'post').toString();
    const limit = Math.min(parseInt(req.query.limit, 10) || 24, 48);
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const query = { user: user._id, type };
    if (cursor && !isNaN(cursor.getTime())) {
      query.createdAt = { $lt: cursor };
    }

    const posts = await Post.find(query)
      .sort({ pinnedAt: -1, createdAt: -1 })
      .limit(limit + 1)
      .populate('user', 'username profilePic')
      .lean();
    const nextCursor = posts.length > limit ? posts[limit - 1]?.createdAt : null;
    const slice = posts.slice(0, limit);
    const withState = slice.map((p) => ({
      ...p,
      didLike: req.user ? (p.likedBy || []).some((id) => String(id) === String(req.user._id)) : false,
      likes: (p.likedBy || []).length,
      canDelete: req.user ? String(p.user?._id || p.user) === String(req.user._id) : false,
      pinned: !!p.pinned,
    }));
    res.json({ posts: withState, nextCursor });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function countUserPosts(userId) {
  const [posts, reels] = await Promise.all([
    Post.countDocuments({ user: userId, type: 'post' }),
    Post.countDocuments({ user: userId, type: 'reel' }),
  ]);
  return { posts, reels };
}

export async function feed(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;
    const query = {};
    if (cursor && !isNaN(cursor.getTime())) query.createdAt = { $lt: cursor };
    const docs = await Post.find(query)
      .sort({ pinnedAt: -1, createdAt: -1 })
      .limit(limit + 1)
      .populate('user', 'username profilePic')
      .populate({
        path: 'sharedFrom',
        populate: { path: 'user', select: 'username profilePic' }
      })
      .lean();
    const slice = docs.slice(0, limit);
    const nextCursor = docs.length > limit ? docs[limit - 1]?.createdAt : null;
    const items = slice.map((p) => ({
      ...p,
      didLike: (p.likedBy || []).some((id) => String(id) === String(req.user._id)),
      likes: (p.likedBy || []).length,
      canDelete: String(p.user?._id || p.user) === String(req.user._id),
      pinned: !!p.pinned,
    }));
    res.json({ posts: items, nextCursor });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function likePost(req, res) {
  try {
    const id = req.params.id;
    const userId = req.user._id;
    const updated = await Post.findByIdAndUpdate(
      id,
      { $addToSet: { likedBy: userId } },
      { new: true }
    )
      .populate('user', 'username profilePic')
      .lean();
    if (!updated) return res.status(404).json({ message: 'Post not found' });
    
    // Create notification for the post author
    await createNotification({
      recipient: updated.user._id,
      sender: userId,
      type: 'like',
      post: id,
      message: 'liked your post',
    });
    
    res.json({ likes: (updated.likedBy || []).length, didLike: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function unlikePost(req, res) {
  try {
    const id = req.params.id;
    const userId = req.user._id;
    const updated = await Post.findByIdAndUpdate(
      id,
      { $pull: { likedBy: userId } },
      { new: true }
    )
      .populate('user', 'username profilePic')
      .lean();
    if (!updated) return res.status(404).json({ message: 'Post not found' });
    res.json({ likes: (updated.likedBy || []).length, didLike: false });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

const commentSchema = z.object({ content: z.string().min(1).max(1000) });

export async function addComment(req, res) {
  try {
    const id = req.params.id;
    const { content } = commentSchema.parse(req.body);
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const c = await Comment.create({ post: id, user: req.user._id, content });
    await Post.updateOne({ _id: id }, { $inc: { commentsCount: 1 } });
    const populated = await Comment.findById(c._id).populate('user', 'username profilePic').lean();
    
    // Create notification for the post author
    await createNotification({
      recipient: post.user,
      sender: req.user._id,
      type: 'comment',
      post: id,
      comment: c._id,
      message: 'commented on your post',
    });
    
    // Add didLike field
    const commentWithLike = {
      ...populated,
      didLike: false,
      likesCount: 0,
      repliesCount: 0,
    };
    
    res.status(201).json({ comment: commentWithLike });
  } catch (e) {
    if (e?.issues) return res.status(400).json({ message: 'Invalid input' });
    res.status(500).json({ message: 'Server error' });
  }
}

const reactSchema2 = z.object({ type: z.enum(['like','love','care','haha','wow','sad','angry']) });
export async function reactPost(req, res) {
  try {
    const id = req.params.id;
    const { type } = reactSchema2.parse(req.body);
    const userId = req.user._id;
    await Post.updateOne({ _id: id }, { $pull: { reactions: { user: userId } } });
    await Post.updateOne({ _id: id }, { $push: { reactions: { user: userId, type, createdAt: new Date() } } });
    res.json({ ok: true, type });
  } catch (e) {
    if (e?.issues) return res.status(400).json({ message: 'Invalid reaction' });
    res.status(500).json({ message: 'Server error' });
  }
}

export async function unreactPost(req, res) {
  try {
    const id = req.params.id;
    const userId = req.user._id;
    await Post.updateOne({ _id: id }, { $pull: { reactions: { user: userId } } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function sharePost(req, res) {
  try {
    const id = req.params.id;
    const original = await Post.findById(id);
    if (!original) return res.status(404).json({ message: 'Post not found' });
    const caption = (req.body?.caption || '').toString();
    const doc = await Post.create({ user: req.user._id, type: 'post', caption, media: original.media || [], sharedFrom: original._id, privacy: 'public' });
    const populated = await Post.findById(doc._id).populate('user', 'username profilePic').lean();
    res.status(201).json({ post: { ...populated, didLike: false, likes: 0 } });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function pinPost(req, res) {
  try {
    const id = req.params.id;
    const post = await Post.findById(id).select('user');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (String(post.user) !== String(req.user._id)) return res.status(403).json({ message: 'Not allowed' });
    await Post.updateMany({ user: req.user._id, pinned: true }, { $set: { pinned: false, pinnedAt: null } });
    await Post.updateOne({ _id: id }, { $set: { pinned: true, pinnedAt: new Date() } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function unpinPost(req, res) {
  try {
    const id = req.params.id;
    const post = await Post.findById(id).select('user');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (String(post.user) !== String(req.user._id)) return res.status(403).json({ message: 'Not allowed' });
    await Post.updateOne({ _id: id }, { $set: { pinned: false, pinnedAt: null } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function listComments(req, res) {
  try {
    const id = req.params.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const comments = await Comment.find({ post: id, parentComment: null })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'username profilePic')
      .lean();
    
    // Add didLike field for each comment
    const commentsWithLikes = comments.map(comment => ({
      ...comment,
      didLike: comment.likes && comment.likes.some(likeId => String(likeId) === String(req.user._id)),
      likesCount: comment.likesCount || 0,
      repliesCount: comment.repliesCount || 0,
    }));
    
    res.json({ comments: commentsWithLikes });
  } catch (e) {
    console.error('List comments error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function deletePost(req, res) {
  try {
    const id = req.params.id;
    const post = await Post.findById(id).select('user');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (String(post.user) !== String(req.user._id)) return res.status(403).json({ message: 'Not allowed' });
    await Comment.deleteMany({ post: id });
    await Post.deleteOne({ _id: id });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
}

const updateSchema = z.object({ caption: z.string().max(2200).optional() });

export async function updatePost(req, res) {
  try {
    const id = req.params.id;
    const body = updateSchema.parse(req.body);
    const post = await Post.findById(id).select('user caption');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (String(post.user) !== String(req.user._id)) return res.status(403).json({ message: 'Not allowed' });
    if (typeof body.caption !== 'undefined') post.caption = body.caption;
    await post.save();
    const populated = await Post.findById(id).populate('user', 'username profilePic').lean();
    const withState = {
      ...populated,
      likes: (populated.likedBy || []).length,
      didLike: (populated.likedBy || []).some((uid) => String(uid) === String(req.user._id)),
      canDelete: true,
    };
    res.json({ post: withState });
  } catch (e) {
    if (e?.issues) return res.status(400).json({ message: 'Invalid input' });
    return res.status(500).json({ message: 'Server error' });
  }
}

// List photos where the given user is tagged
export async function listTaggedPhotos(req, res) {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('_id');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const limit = Math.min(parseInt(req.query.limit, 10) || 60, 120);
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;
    const query = { type: 'post', taggedUsers: user._id, 'media.0': { $exists: true } };
    if (cursor && !isNaN(cursor.getTime())) query.createdAt = { $lt: cursor };
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('user', 'username profilePic')
      .lean();
    const nextCursor = posts.length > limit ? posts[limit - 1]?.createdAt : null;
    const slice = posts.slice(0, limit).map((p) => ({
      ...p,
      didLike: (p.likedBy || []).some((id) => String(id) === String(req.user._id)),
      likes: (p.likedBy || []).length,
    }));
    res.json({ posts: slice, nextCursor });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

// Search posts by caption or hashtags
export async function searchPosts(req, res) {
  try {
    const query = req.query.q || '';
    const limit = parseInt(req.query.limit) || 10;
    
    if (!query.trim()) {
      return res.json({ posts: [] });
    }

    // Search by caption or hashtags
    const posts = await Post.find({
      type: 'post',
      $or: [
        { caption: { $regex: query, $options: 'i' } },
        { hashtags: { $regex: query, $options: 'i' } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'username profilePic displayName verified')
      .lean();

    const formattedPosts = posts.map((p) => ({
      ...p,
      didLike: (p.likedBy || []).some((id) => String(id) === String(req.user._id)),
      likes: (p.likedBy || []).length,
      commentsCount: (p.comments || []).length,
    }));

    res.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Search hashtags
export async function searchHashtags(req, res) {
  try {
    const query = req.query.q || '';
    const limit = parseInt(req.query.limit) || 10;
    
    if (!query.trim()) {
      return res.json({ hashtags: [] });
    }

    // Remove # if user included it
    const searchTerm = query.replace(/^#/, '');

    // Get posts with matching hashtags and aggregate counts
    const hashtags = await Post.aggregate([
      {
        $match: {
          type: 'post',
          hashtags: { $regex: searchTerm, $options: 'i' }
        }
      },
      {
        $unwind: '$hashtags'
      },
      {
        $match: {
          hashtags: { $regex: searchTerm, $options: 'i' }
        }
      },
      {
        $group: {
          _id: { $toLower: '$hashtags' },
          count: { $sum: 1 },
          tag: { $first: '$hashtags' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 0,
          tag: '$tag',
          count: 1
        }
      }
    ]);

    res.json({ hashtags });
  } catch (error) {
    console.error('Search hashtags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Comment Like/Unlike
export async function likeComment(req, res) {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already liked' });
    }

    comment.likes.push(req.user._id);
    comment.likesCount = comment.likes.length;
    await comment.save();

    res.json({ ok: true, likesCount: comment.likesCount });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function unlikeComment(req, res) {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const index = comment.likes.indexOf(req.user._id);
    if (index === -1) {
      return res.status(400).json({ message: 'Not liked' });
    }

    comment.likes.splice(index, 1);
    comment.likesCount = comment.likes.length;
    await comment.save();

    res.json({ ok: true, likesCount: comment.likesCount });
  } catch (error) {
    console.error('Unlike comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Reply to Comment
export async function replyToComment(req, res) {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content required' });
    }

    const parentComment = await Comment.findById(commentId);
    if (!parentComment) return res.status(404).json({ message: 'Comment not found' });

    const reply = await Comment.create({
      post: postId,
      user: req.user._id,
      content: content.trim(),
      parentComment: commentId,
    });

    // Increment replies count on parent comment
    parentComment.repliesCount = (parentComment.repliesCount || 0) + 1;
    await parentComment.save();

    const populated = await Comment.findById(reply._id)
      .populate('user', 'username profilePic')
      .lean();

    // Add didLike, likesCount, and repliesCount fields
    const replyWithLike = {
      ...populated,
      didLike: false,
      likesCount: populated.likesCount || 0,
      repliesCount: populated.repliesCount || 0,
    };

    res.status(201).json({ comment: replyWithLike });
  } catch (error) {
    console.error('Reply to comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get Replies
export async function getReplies(req, res) {
  try {
    const { commentId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const replies = await Comment.find({ parentComment: commentId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .populate('user', 'username profilePic')
      .lean();

    // Add didLike field for each reply
    const repliesWithLikes = replies.map(reply => ({
      ...reply,
      didLike: reply.likes && reply.likes.some(likeId => String(likeId) === String(req.user._id)),
      likesCount: reply.likesCount || 0,
    }));

    res.json({ replies: repliesWithLikes });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

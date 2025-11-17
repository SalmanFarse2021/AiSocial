import { z } from 'zod';
import { User } from '../models/User.js';
import { countUserPosts } from './post.controller.js';
import { createNotification } from './notification.controller.js';

export async function me(req, res) {
  res.json({ user: req.user });
}

const profileSchema = z.object({
  displayName: z.string().max(60).optional(),
  nickname: z.string().max(60).optional(),
  website: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(280).optional(),
  about: z.string().max(1000).optional(),
  profilePic: z.string().url().optional(),
  coverPhoto: z.string().url().optional(),
  gender: z.string().max(40).optional(),
  pronouns: z.string().max(40).optional(),
  birthday: z.coerce.date().optional().nullable(),
  relationshipStatus: z.string().max(40).optional(),
  languages: z.array(z.string().max(40)).optional(),
  interests: z.array(z.string().max(60)).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().email().optional().or(z.literal('')),
  socialLinks: z.array(z.object({ label: z.string().max(30), url: z.string().url() })).optional(),
  city: z.string().max(64).optional(),
  currentCity: z.string().max(64).optional(),
  hometown: z.string().max(64).optional(),
  country: z.string().max(64).optional(),
  location: z.union([
    z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
    z.string().max(100)
  ]).optional(),
  work: z
    .array(
      z.object({
        role: z.string().max(80).optional(),
        company: z.string().max(120).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        current: z.boolean().optional(),
        description: z.string().max(500).optional(),
      })
    )
    .optional(),
  education: z
    .array(
      z.object({
        school: z.string().max(120).optional(),
        degree: z.string().max(120).optional(),
        field: z.string().max(120).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        description: z.string().max(500).optional(),
      })
    )
    .optional(),
  family: z
    .array(z.object({ name: z.string().max(120), relation: z.string().max(80) }))
    .optional(),
  favoriteQuotes: z.string().max(500).optional(),
  lifeEvents: z
    .array(z.object({ title: z.string().max(120), type: z.string().max(80).optional(), date: z.coerce.date().optional(), description: z.string().max(500).optional() }))
    .optional(),
});

export async function updateProfile(req, res) {
  try {
    console.log('📥 Received profile update request for user:', req.user._id);
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    const data = profileSchema.parse(req.body);
    console.log('✅ Schema validation passed');
    
    const updates = { ...data };
    
    // Handle location - can be either object with lat/lng or string
    if (data.location) {
      if (typeof data.location === 'object' && data.location.lat && data.location.lng) {
        updates.location = { type: 'Point', coordinates: [data.location.lng, data.location.lat] };
        console.log('📍 Location updated to coordinates:', updates.location);
      } else if (typeof data.location === 'string') {
        // If it's a string, store it in city field for simplicity
        updates.city = data.location;
        updates.location = undefined;
        console.log('📍 Location stored as city string:', data.location);
      }
    }
    
    console.log('💾 Updates to apply:', JSON.stringify(updates, null, 2));
    
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select(
      '-passwordHash -twoFactorSecret -twoFactorTempSecret'
    );
    
    if (!user) {
      console.error('❌ User not found:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('✅ Profile updated successfully for user:', req.user._id);
    console.log('✅ Updated user data:', JSON.stringify(user, null, 2));
    res.json({ user });
  } catch (err) {
    console.error('❌ Profile update error:', err);
    console.error('❌ Error name:', err.name);
    console.error('❌ Error message:', err.message);
    if (err?.issues) {
      console.error('❌ Validation issues:', JSON.stringify(err.issues, null, 2));
      return res.status(400).json({ message: 'Invalid input', issues: err.issues });
    }
    res.status(500).json({ message: err.message || 'Server error' });
  }
}

export async function follow(req, res) {
  try {
    const targetId = req.params.id;
    if (String(req.user._id) === targetId) return res.status(400).json({ message: 'Cannot follow yourself' });
    const me = await User.findById(req.user._id);
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (!me.following.map(String).includes(targetId)) me.following.push(target._id);
    if (!target.followers.map(String).includes(String(me._id))) target.followers.push(me._id);
    await me.save();
    await target.save();
    
    // Create notification for the followed user
    await createNotification({
      recipient: targetId,
      sender: req.user._id,
      type: 'follow',
      message: 'started following you',
    });
    
    res.json({ following: me.following.length, followers: target.followers.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function unfollow(req, res) {
  try {
    const targetId = req.params.id;
    if (String(req.user._id) === targetId) return res.status(400).json({ message: 'Cannot unfollow yourself' });
    const me = await User.findById(req.user._id);
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });
    me.following = me.following.filter((id) => String(id) !== targetId);
    target.followers = target.followers.filter((id) => String(id) !== String(me._id));
    await me.save();
    await target.save();
    res.json({ following: me.following.length, followers: target.followers.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function suggestions(req, res) {
  try {
    const type = (req.query.type || 'mutual').toString();
    const myId = req.user._id;
    if (type === 'nearby') {
      const { lat, lng } = req.query;
      if (!lat || !lng) return res.status(400).json({ message: 'lat and lng required' });
      const docs = await User.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: 'distance',
            spherical: true,
            query: { _id: { $ne: myId } },
            maxDistance: 50000, // 50km
          },
        },
        { $limit: 10 },
        { $project: { username: 1, profilePic: 1, city: 1, country: 1 } },
      ]);
      return res.json({ users: docs });
    }
    // mutuals: users not yet followed by me, ordered by overlap of our followers with my following
    const me = await User.findById(myId).select('following');
    const followingIds = me.following || [];
    
    // Convert followingIds to ObjectIds for proper comparison
    const followingObjectIds = followingIds.map(id => id);
    
    const users = await User.aggregate([
      { 
        $match: { 
          _id: { 
            $ne: myId,
            $nin: followingObjectIds // Exclude users already being followed
          } 
        } 
      },
      {
        $addFields: {
          mutualCount: {
            $size: {
              $setIntersection: ['$followers', followingIds],
            },
          },
        },
      },
      { $match: { mutualCount: { $gt: 0 } } },
      { $sort: { mutualCount: -1 } },
      { $limit: 10 },
      { $project: { username: 1, profilePic: 1, mutualCount: 1 } },
    ]);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getProfileByUsername(req, res) {
  try {
    const { username } = req.params;
    const viewer = req.user; // authRequired applied on route
    const user = await User.findOne({ username }).select('-passwordHash').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const counts = await countUserPosts(user._id);
    const followersCount = Array.isArray(user.followers) ? user.followers.length : 0;
    const followingCount = Array.isArray(user.following) ? user.following.length : 0;
    const isMe = viewer && String(viewer._id) === String(user._id);
    const isFollowing = !isMe && viewer ? viewer.following.map(String).includes(String(user._id)) : false;
    // Friendship flags
    let areFriends = false;
    let sentFriendRequest = false;
    let receivedFriendRequest = false;
    if (!isMe && viewer) {
      const viewerDoc = await User.findById(viewer._id).select('friends friendRequestsSent friendRequestsReceived');
      areFriends = viewerDoc?.friends?.map(String).includes(String(user._id)) || false;
      sentFriendRequest = viewerDoc?.friendRequestsSent?.map(String).includes(String(user._id)) || false;
      receivedFriendRequest = viewerDoc?.friendRequestsReceived?.map(String).includes(String(user._id)) || false;
    }
    res.json({
      profile: {
        id: user._id,
        username: user.username,
        displayName: user.displayName || user.username,
        nickname: user.nickname || '',
        bio: user.bio || '',
        website: user.website || '',
        profilePic: user.profilePic || '',
        coverPhoto: user.coverPhoto || '',
        verified: user.verified || false,
        counts: { posts: counts.posts, reels: counts.reels, followers: followersCount, following: followingCount },
        isMe,
        isFollowing,
        areFriends,
        sentFriendRequest,
        receivedFriendRequest,
        gender: user.gender || '',
        pronouns: user.pronouns || '',
        birthday: user.birthday || null,
        relationshipStatus: user.relationshipStatus || '',
        languages: user.languages || [],
        interests: user.interests || [],
        phone: user.phone || '',
        email: isMe ? user.email : '', // Only show email to self
        socialLinks: user.socialLinks || [],
        location: user.location || '',
        currentCity: user.currentCity || user.city || '',
        hometown: user.hometown || '',
        country: user.country || '',
        work: user.work || [],
        education: user.education || [],
        family: user.family || [],
        favoriteQuotes: user.favoriteQuotes || '',
        about: user.about || '',
        lifeEvents: user.lifeEvents || [],
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function requestFriend(req, res) {
  try {
    const targetId = req.params.id;
    if (String(req.user._id) === targetId) return res.status(400).json({ message: 'Cannot friend yourself' });
    const me = await User.findById(req.user._id);
    const other = await User.findById(targetId);
    if (!other) return res.status(404).json({ message: 'User not found' });
    if (me.friends.map(String).includes(targetId)) return res.json({ status: 'friends' });
    if (!me.friendRequestsSent.map(String).includes(targetId)) me.friendRequestsSent.push(other._id);
    if (!other.friendRequestsReceived.map(String).includes(String(me._id))) other.friendRequestsReceived.push(me._id);
    await me.save();
    await other.save();
    res.json({ status: 'requested' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function cancelFriendRequest(req, res) {
  try {
    const targetId = req.params.id;
    const me = await User.findById(req.user._id);
    const other = await User.findById(targetId);
    if (!other) return res.status(404).json({ message: 'User not found' });
    me.friendRequestsSent = me.friendRequestsSent.filter((id) => String(id) !== targetId);
    me.friendRequestsReceived = me.friendRequestsReceived.filter((id) => String(id) !== targetId);
    other.friendRequestsSent = other.friendRequestsSent.filter((id) => String(id) !== String(me._id));
    other.friendRequestsReceived = other.friendRequestsReceived.filter((id) => String(id) !== String(me._id));
    await me.save();
    await other.save();
    res.json({ status: 'none' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function acceptFriend(req, res) {
  try {
    const targetId = req.params.id;
    const me = await User.findById(req.user._id);
    const other = await User.findById(targetId);
    if (!other) return res.status(404).json({ message: 'User not found' });
    if (!me.friendRequestsReceived.map(String).includes(targetId)) return res.status(400).json({ message: 'No incoming request' });
    // remove pending
    me.friendRequestsReceived = me.friendRequestsReceived.filter((id) => String(id) !== targetId);
    other.friendRequestsSent = other.friendRequestsSent.filter((id) => String(id) !== String(me._id));
    // add to friends
    if (!me.friends.map(String).includes(targetId)) me.friends.push(other._id);
    if (!other.friends.map(String).includes(String(me._id))) other.friends.push(me._id);
    await me.save();
    await other.save();
    res.json({ status: 'friends' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function removeFriend(req, res) {
  try {
    const targetId = req.params.id;
    const me = await User.findById(req.user._id);
    const other = await User.findById(targetId);
    if (!other) return res.status(404).json({ message: 'User not found' });
    me.friends = me.friends.filter((id) => String(id) !== targetId);
    other.friends = other.friends.filter((id) => String(id) !== String(me._id));
    await me.save();
    await other.save();
    res.json({ status: 'none' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function listFollowers(req, res) {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('followers').populate('followers', 'username profilePic displayName').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ users: (user.followers || []).map((u) => ({ id: u._id, username: u.username, profilePic: u.profilePic, displayName: u.displayName })) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function listFollowing(req, res) {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('following').populate('following', 'username profilePic displayName').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ users: (user.following || []).map((u) => ({ id: u._id, username: u.username, profilePic: u.profilePic, displayName: u.displayName })) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

// List friends of a user with mutual counts relative to the viewer
export async function listFriends(req, res) {
  try {
    const { username } = req.params;
    const target = await User.findOne({ username }).select('friends username').populate('friends', 'username profilePic displayName friends').lean();
    if (!target) return res.status(404).json({ message: 'User not found' });
    const viewer = await User.findById(req.user._id).select('friends');
    const myFriends = new Set((viewer?.friends || []).map((id) => String(id)));
    const items = (target.friends || []).map((u) => ({
      id: u._id,
      username: u.username,
      profilePic: u.profilePic,
      displayName: u.displayName,
      mutualCount: Array.isArray(u.friends) ? u.friends.reduce((acc, fid) => acc + (myFriends.has(String(fid)) ? 1 : 0), 0) : 0,
    }));
    res.json({ users: items, total: items.length });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

// Friend requests for the current user
export async function listFriendRequests(req, res) {
  try {
    const me = await User.findById(req.user._id)
      .select('friendRequestsReceived friendRequestsSent')
      .populate('friendRequestsReceived', 'username profilePic displayName')
      .populate('friendRequestsSent', 'username profilePic displayName')
      .lean();
    const incoming = (me.friendRequestsReceived || []).map((u) => ({ id: u._id, username: u.username, profilePic: u.profilePic, displayName: u.displayName }));
    const outgoing = (me.friendRequestsSent || []).map((u) => ({ id: u._id, username: u.username, profilePic: u.profilePic, displayName: u.displayName }));
    res.json({ incoming, outgoing });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

const friendListSchema = z.object({ list: z.enum(['close','family','restricted']), action: z.enum(['add','remove']) });
export async function setFriendList(req, res) {
  try {
    const targetId = req.params.id;
    const { list, action } = friendListSchema.parse(req.body);
    const me = await User.findById(req.user._id).select('friends friendLists');
    if (!me.friends.map(String).includes(String(targetId))) return res.status(400).json({ message: 'Not friends' });
    const arr = me.friendLists?.[list] || [];
    const exists = arr.map(String).includes(String(targetId));
    if (action === 'add' && !exists) {
      arr.push(targetId);
    } else if (action === 'remove' && exists) {
      me.friendLists[list] = arr.filter((id) => String(id) !== String(targetId));
    }
    me.friendLists[list] = arr;
    await me.save();
    res.json({ ok: true, friendLists: me.friendLists });
  } catch (e) {
    if (e?.issues) return res.status(400).json({ message: 'Invalid input' });
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getFriendLists(req, res) {
  try {
    const me = await User.findById(req.user._id).select('friendLists').populate('friendLists.close', 'username profilePic displayName').populate('friendLists.family', 'username profilePic displayName').populate('friendLists.restricted', 'username profilePic displayName').lean();
    const fmt = (arr) => (arr || []).map((u) => ({ id: u._id, username: u.username, profilePic: u.profilePic, displayName: u.displayName }));
    res.json({
      close: fmt(me.friendLists?.close),
      family: fmt(me.friendLists?.family),
      restricted: fmt(me.friendLists?.restricted),
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function searchUsers(req, res) {
  try {
    const query = req.query.q || '';
    const limit = parseInt(req.query.limit) || 10;
    
    if (!query.trim()) {
      return res.json({ users: [] });
    }

    // Search by username, displayName, or bio
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } }
      ]
    })
      .select('username displayName profilePic bio verified')
      .limit(limit)
      .lean();

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

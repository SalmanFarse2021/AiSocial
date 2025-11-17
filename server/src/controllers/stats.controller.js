import { User } from '../models/User.js';
import { Post } from '../models/Post.js';

export async function getPublicStats(req, res) {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get total posts count
    const totalPosts = await Post.countDocuments({ type: 'post' });

    // Get total connections (sum of all followers)
    const connectionsResult = await User.aggregate([
      {
        $project: {
          followersCount: { $size: { $ifNull: ['$followers', []] } }
        }
      },
      {
        $group: {
          _id: null,
          totalConnections: { $sum: '$followersCount' }
        }
      }
    ]);

    const totalConnections = connectionsResult.length > 0 ? connectionsResult[0].totalConnections : 0;

    res.json({
      users: totalUsers,
      posts: totalPosts,
      connections: totalConnections
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

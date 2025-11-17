"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete, apiPatch } from '@/lib/api';

function Icon({ name, className = "w-6 h-6" }) {
  const paths = {
    back: <path d="M19 12H5m7-7l-7 7 7 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    trash: <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>,
    eye: <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" fill="none"/>,
    eyeOff: <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>,
    heart: <path d="M12.1 21S3 14.7 3 8.9C3 6 5.3 4 7.8 4c1.6 0 3.2.8 4.2 2.1C13 4.8 14.6 4 16.2 4 18.7 4 21 6 21 8.9c0 5.8-9.1 12.1-9.1 12.1Z" fill="currentColor"/>,
    comment: <path d="M20 8a6 6 0 0 1-6 6H9l-5 5V8a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6Z" fill="currentColor"/>,
    check: <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
  };
  return (
    <svg viewBox="0 0 24 24" className={className}>
      {paths[name]}
    </svg>
  );
}

function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadActivities();
  }, [filter]);

  async function loadActivities() {
    setLoading(true);
    try {
      const { user } = await apiGet('/api/users/me');
      
      // Fetch user posts to track likes and comments
      const { posts } = await apiGet(`/api/posts/user/${user.username}?limit=100`);
      
      let activityList = [];
      
      // Add post creation activities
      posts.forEach(post => {
        if (filter === 'all' || filter === 'posts') {
          activityList.push({
            id: post._id,
            type: 'post_created',
            timestamp: post.createdAt,
            data: post,
            label: 'Created a post',
          });
        }
      });

      // Get likes and comments from posts (would need backend endpoint for this)
      for (const post of posts) {
        if (post.likes > 0 && (filter === 'all' || filter === 'likes')) {
          activityList.push({
            id: `${post._id}-likes`,
            type: 'received_likes',
            timestamp: post.createdAt,
            data: { post, count: post.likes },
            label: `Received ${post.likes} like${post.likes !== 1 ? 's' : ''}`,
          });
        }
        if (post.commentsCount > 0 && (filter === 'all' || filter === 'comments')) {
          activityList.push({
            id: `${post._id}-comments`,
            type: 'received_comments',
            timestamp: post.createdAt,
            data: { post, count: post.commentsCount },
            label: `Received ${post.commentsCount} comment${post.commentsCount !== 1 ? 's' : ''}`,
          });
        }
      }

      // Sort by timestamp descending
      activityList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setActivities(activityList);
    } catch (e) {
      console.error('Failed to load activities:', e.message);
    } finally {
      setLoading(false);
    }
  }

  function timeAgo(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'just now';
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const dys = Math.floor(h / 24);
    if (dys < 7) return `${dys}d ago`;
    const w = Math.floor(dys / 7);
    if (w < 5) return `${w}w ago`;
    const mo = Math.floor(dys / 30);
    if (mo < 12) return `${mo}mo ago`;
    const y = Math.floor(dys / 365);
    return `${y}y ago`;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {['all', 'posts', 'likes', 'comments'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded text-sm font-medium capitalize ${
              filter === f
                ? 'bg-sky-600 text-white'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-white/70">Loading activities...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-white/70">No activities yet</div>
      ) : (
        <div className="space-y-2">
          {activities.map(activity => (
            <div key={activity.id} className="card p-4 flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1 text-sky-400">
                  {activity.type === 'post_created' && <Icon name="check" className="w-5 h-5" />}
                  {activity.type === 'received_likes' && <Icon name="heart" className="w-5 h-5" />}
                  {activity.type === 'received_comments' && <Icon name="comment" className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{activity.label}</p>
                  {activity.data?.post?.caption && (
                    <p className="text-white/70 text-sm mt-1 line-clamp-2">{activity.data.post.caption}</p>
                  )}
                  <p className="text-white/50 text-xs mt-2">{timeAgo(activity.timestamp)}</p>
                </div>
              </div>
              {activity.data?.post?.media?.[0]?.url && (
                <img src={activity.data.post.media[0].url} alt="" className="w-12 h-12 rounded object-cover" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineReview() {
  const [taggedPosts, setTaggedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTaggedPosts();
  }, []);

  async function loadTaggedPosts() {
    setLoading(true);
    try {
      const { user } = await apiGet('/api/users/me');
      const { posts } = await apiGet(`/api/posts/tagged/${user.username}?limit=100`).catch(() => ({ posts: [] }));
      
      // Filter to only pending posts (posts where user hasn't approved/hidden)
      const pending = posts.filter(p => !p.userApproval || p.userApproval.status === 'pending');
      setTaggedPosts(pending);
    } catch (e) {
      console.error('Failed to load tagged posts:', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApproval(postId, action) {
    try {
      await apiPatch(`/api/posts/${postId}`, { userApprovalAction: action });
      setTaggedPosts(prev => prev.filter(p => p._id !== postId));
    } catch (e) {
      console.error('Failed to update approval:', e.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-white/70 text-sm mb-4">
        Review and manage posts you've been tagged in
      </div>

      {loading ? (
        <div className="text-center py-8 text-white/70">Loading tagged posts...</div>
      ) : taggedPosts.length === 0 ? (
        <div className="text-center py-8 text-white/70">No pending tagged posts</div>
      ) : (
        <div className="space-y-4">
          {taggedPosts.map(post => (
            <div key={post._id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-medium">{post.user?.username || 'Someone'} tagged you</p>
                  <p className="text-white/70 text-sm">{post.caption?.substring(0, 60)}...</p>
                </div>
              </div>
              
              {post.media?.[0]?.url && (
                <img src={post.media[0].url} alt="" className="w-full h-48 object-cover rounded mb-3" />
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleApproval(post._id, 'approve')}
                  className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  <Icon name="check" className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => handleApproval(post._id, 'hide')}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  <Icon name="eyeOff" className="w-4 h-4" /> Hide
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ManagePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState(new Set());
  const [sortBy, setSortBy] = useState('newest');
  const [filterAge, setFilterAge] = useState('all');

  useEffect(() => {
    loadPosts();
  }, [sortBy, filterAge]);

  async function loadPosts() {
    setLoading(true);
    try {
      const { user } = await apiGet('/api/users/me');
      const { posts: allPosts } = await apiGet(`/api/posts/user/${user.username}?limit=200`);
      
      let filtered = allPosts;
      
      // Filter by age
      const now = Date.now();
      if (filterAge === '3months') {
        filtered = allPosts.filter(p => (now - new Date(p.createdAt).getTime()) > 3 * 30 * 24 * 60 * 60 * 1000);
      } else if (filterAge === '6months') {
        filtered = allPosts.filter(p => (now - new Date(p.createdAt).getTime()) > 6 * 30 * 24 * 60 * 60 * 1000);
      } else if (filterAge === '1year') {
        filtered = allPosts.filter(p => (now - new Date(p.createdAt).getTime()) > 365 * 24 * 60 * 60 * 1000);
      }

      // Sort
      if (sortBy === 'oldest') {
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      setPosts(filtered);
      setSelectedPosts(new Set());
    } catch (e) {
      console.error('Failed to load posts:', e.message);
    } finally {
      setLoading(false);
    }
  }

  function togglePost(postId) {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  }

  function toggleSelectAll() {
    if (selectedPosts.size === posts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(posts.map(p => p._id)));
    }
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selectedPosts.size} post(s)? This action cannot be undone.`)) return;

    try {
      for (const postId of selectedPosts) {
        await apiDelete(`/api/posts/${postId}`);
      }
      setPosts(prev => prev.filter(p => !selectedPosts.has(p._id)));
      setSelectedPosts(new Set());
    } catch (e) {
      console.error('Failed to delete posts:', e.message);
    }
  }

  async function bulkHide() {
    try {
      for (const postId of selectedPosts) {
        await apiPatch(`/api/posts/${postId}`, { privacy: 'private' });
      }
      setPosts(prev => prev.map(p => 
        selectedPosts.has(p._id) ? { ...p, privacy: 'private' } : p
      ));
      setSelectedPosts(new Set());
    } catch (e) {
      console.error('Failed to hide posts:', e.message);
    }
  }

  function timeAgo(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'just now';
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const dys = Math.floor(h / 24);
    if (dys < 7) return `${dys}d ago`;
    const w = Math.floor(dys / 7);
    if (w < 5) return `${w}w ago`;
    const mo = Math.floor(dys / 30);
    if (mo < 12) return `${mo}mo ago`;
    const y = Math.floor(dys / 365);
    return `${y}y ago`;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 text-white border border-white/20"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>

        <select
          value={filterAge}
          onChange={(e) => setFilterAge(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 text-white border border-white/20"
        >
          <option value="all">All Posts</option>
          <option value="3months">Older than 3 months</option>
          <option value="6months">Older than 6 months</option>
          <option value="1year">Older than 1 year</option>
        </select>
      </div>

      {selectedPosts.size > 0 && (
        <div className="card p-4 flex items-center justify-between">
          <div className="text-white">{selectedPosts.size} post{selectedPosts.size !== 1 ? 's' : ''} selected</div>
          <div className="flex gap-2">
            <button
              onClick={bulkHide}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded text-sm font-medium"
            >
              Hide Selected
            </button>
            <button
              onClick={bulkDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium flex items-center gap-2"
            >
              <Icon name="trash" className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-white/70">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-white/70">No posts found</div>
      ) : (
        <>
          <button
            onClick={toggleSelectAll}
            className="text-sm text-sky-400 hover:text-sky-300 mb-2"
          >
            {selectedPosts.size === posts.length ? 'Deselect All' : 'Select All'}
          </button>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {posts.map(post => (
              <div
                key={post._id}
                onClick={() => togglePost(post._id)}
                className={`aspect-square rounded overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedPosts.has(post._id)
                    ? 'border-sky-500 ring-2 ring-sky-500'
                    : 'border-transparent hover:border-gray-600'
                }`}
              >
                {post.media?.[0]?.url && (
                  <img src={post.media[0].url} alt="" className="w-full h-full object-cover" />
                )}
                <div className="w-full h-full bg-gray-800 flex items-end justify-between p-2">
                  <span className="text-white/70 text-xs">{timeAgo(post.createdAt)}</span>
                  {selectedPosts.has(post._id) && (
                    <Icon name="check" className="w-4 h-4 text-sky-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState('activity');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/u/profile" className="p-2 hover:bg-gray-800 rounded">
            <Icon name="back" className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold">Activity & Interactions</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-800 overflow-x-auto">
          {[
            { id: 'activity', label: 'Activity Log' },
            { id: 'timeline', label: 'Timeline Review' },
            { id: 'manage', label: 'Manage Posts' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-sky-500 text-white'
                  : 'border-transparent text-white/70 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'activity' && <ActivityLog />}
          {activeTab === 'timeline' && <TimelineReview />}
          {activeTab === 'manage' && <ManagePosts />}
        </div>
      </div>
    </div>
  );
}

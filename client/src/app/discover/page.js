"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api';

export default function DiscoverPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState(new Set());

  useEffect(() => {
    loadSuggestions();
  }, []);

  async function loadSuggestions() {
    setLoading(true);
    try {
      const [suggestRes, meRes] = await Promise.all([
        apiGet('/api/users/suggestions'),
        apiGet('/api/users/me'),
      ]);
      
      setUsers(suggestRes.users || []);
      setFollowingUsers(new Set(meRes.user.following.map(u => u._id || u)));
    } catch (e) {
      console.error('Failed to load suggestions:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleFollow(userId, isFollowing) {
    try {
      if (isFollowing) {
        await apiPost(`/api/users/${userId}/unfollow`);
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        await apiPost(`/api/users/${userId}/follow`);
        setFollowingUsers(prev => new Set(prev).add(userId));
      }
    } catch (e) {
      console.error('Failed to follow/unfollow:', e);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-6">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Discover</h1>
          <p className="text-white/60">Find interesting people to follow</p>
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="text-center py-12 text-white/60">Loading suggestions...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-gray-800/30 rounded-lg border border-white/10">
                <p className="text-white/60">No suggestions available</p>
              </div>
            ) : (
              users.map(user => (
                <div
                  key={user._id}
                  className="bg-gray-800 rounded-lg border border-white/10 p-6 flex flex-col items-center text-center hover:border-white/20 transition"
                >
                  {/* Avatar */}
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-600 text-white font-bold text-xl mb-4">
                    {user.username?.[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <Link href={`/u/${user.username}`} className="hover:opacity-80">
                    <h3 className="font-bold text-white text-lg">{user.displayName || user.username}</h3>
                    <p className="text-white/60 text-sm">@{user.username}</p>
                  </Link>

                  {/* Bio */}
                  {user.bio && (
                    <p className="text-white/70 text-sm mt-2 line-clamp-2">{user.bio}</p>
                  )}

                  {/* Stats */}
                  <div className="flex gap-4 mt-4 text-sm text-white/60 w-full justify-center">
                    <div>
                      <div className="font-bold text-white">{user.followers?.length || 0}</div>
                      <div className="text-xs">Followers</div>
                    </div>
                    <div>
                      <div className="font-bold text-white">{user.following?.length || 0}</div>
                      <div className="text-xs">Following</div>
                    </div>
                  </div>

                  {/* Follow Button */}
                  <button
                    onClick={() => handleFollow(user._id, followingUsers.has(user._id))}
                    className={`mt-4 w-full py-2 rounded-lg font-medium transition-all ${
                      followingUsers.has(user._id)
                        ? 'bg-gray-700 text-white border border-white/20 hover:bg-gray-600'
                        : 'bg-sky-600 text-white hover:bg-sky-700'
                    }`}
                  >
                    {followingUsers.has(user._id) ? 'Following' : 'Follow'}
                  </button>

                  {/* View Profile Link */}
                  <Link
                    href={`/u/${user.username}`}
                    className="mt-2 text-sky-400 hover:text-sky-300 text-sm font-medium"
                  >
                    View Profile →
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

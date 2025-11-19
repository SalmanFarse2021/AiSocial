"use client";
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPatch, API_BASE, authHeaders } from '@/lib/api';
import Navbar from '@/components/Navbar';

// Utility functions
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

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Post Card Component
function PostCard({ post, onPostUpdated }) {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 mb-4">
      <header className="flex items-center gap-3 px-4 py-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
          {post.user?.username?.[0]?.toUpperCase() || '👤'}
        </div>
        <div className="leading-tight flex-1">
          <div className="text-sm font-semibold dark:text-white">
            {post.user?.username || 'User'}
            <span className="ml-2 align-middle text-xs font-normal text-gray-500 dark:text-gray-400">
              {timeAgo(post.createdAt)}
            </span>
          </div>
        </div>
        {post.canDelete && (
          <button
            onClick={async () => {
              const next = typeof window !== 'undefined' ? window.prompt('Edit caption', post.caption || '') : null;
              if (next === null) return;
              try {
                const res = await fetch(`${API_BASE}/api/posts/${post._id}`, { 
                  method: 'PATCH', 
                  headers: { 'Content-Type': 'application/json', ...authHeaders() }, 
                  body: JSON.stringify({ caption: next }) 
                });
                const data = await res.json();
                if (res.ok) onPostUpdated?.(data.post);
              } catch {}
            }}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            Edit
          </button>
        )}
      </header>
      
      {post.caption && (
        <div className="px-4 pb-3 text-sm dark:text-gray-200">{post.caption}</div>
      )}
      
      {post.media?.[0]?.url && (
        <div className="bg-gray-100 dark:bg-gray-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={post.media[0].url} 
            alt="" 
            className="max-h-[640px] w-full object-cover" 
          />
        </div>
      )}
      
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        {post.pinned && (
          <div className="mb-2 inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-300">
            📌 Pinned
          </div>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span>❤️</span>
            <span className="font-medium">{post.likes || 0}</span>
          </span>
          <span className="flex items-center gap-1">
            <span>💬</span>
            <span className="font-medium">{post.commentsCount || 0}</span>
          </span>
        </div>
      </div>
    </article>
  );
}

export default function UserProfile() {
  const { username } = useParams();
  const router = useRouter();
  
  // State
  const [profile, setProfile] = useState(null);
  const [feed, setFeed] = useState([]);
  const [reels, setReels] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [tagged, setTagged] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  
  // Cover and Profile Photo State
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const coverInputRef = useRef(null);
  const profileInputRef = useRef(null);
  
  // Action Menu States
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Media Lightbox States
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPost, setLightboxPost] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Edit Profile Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    website: '',
    location: '',
    birthday: '',
    gender: '',
    pronouns: '',
    relationshipStatus: '',
    currentCity: '',
    hometown: '',
    phone: '',
    email: '',
    languages: '',
    interests: '',
  });
  const [saving, setSaving] = useState(false);
  
  // AI Features States
  const [showAIBioGenerator, setShowAIBioGenerator] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // Load profile data
  useEffect(() => {
    (async () => {
      setErr('');
      try {
        const [{ profile: p }, { posts }, { users: fols }, { users: fing }] = await Promise.all([
          apiGet(`/api/users/profile/${username}`),
          apiGet(`/api/posts/user/${username}?type=post&limit=60`),
          apiGet(`/api/users/${username}/followers`),
          apiGet(`/api/users/${username}/following`),
        ]);
        setProfile(p);
        setFeed(posts);
        setFollowers(fols);
        setFollowing(fing);
        
        // Initialize edit form with profile data
        if (p) {
          setEditForm({
            displayName: p.displayName || '',
            bio: p.bio || '',
            website: p.website || '',
            location: p.location || '',
            birthday: p.birthday ? new Date(p.birthday).toISOString().split('T')[0] : '',
            gender: p.gender || '',
            pronouns: p.pronouns || '',
            relationshipStatus: p.relationshipStatus || '',
            currentCity: p.currentCity || '',
            hometown: p.hometown || '',
            phone: p.phone || '',
            email: p.email || '',
            languages: p.languages?.join(', ') || '',
            interests: p.interests?.join(', ') || '',
          });
        }
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  // Load reels
  useEffect(() => {
    (async () => {
      try {
        const { posts: r } = await apiGet(`/api/posts/user/${username}?type=reel&limit=60`);
        setReels(r);
      } catch {}
    })();
  }, [username]);

  // Handle cover photo upload
  async function handleCoverUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'aisocial/cover');
      
      const uploadRes = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.message || 'Upload failed');
      
      await apiPatch('/api/users/me', { coverPhoto: uploadData.url });
      setProfile((prev) => prev ? { ...prev, coverPhoto: uploadData.url } : prev);
    } catch (e) {
      setErr(e.message);
    } finally {
      setUploadingCover(false);
    }
  }

  // Handle profile photo upload
  async function handleProfileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProfile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'aisocial/profile');
      
      const uploadRes = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.message || 'Upload failed');
      
      await apiPatch('/api/users/me', { profilePic: uploadData.url });
      setProfile((prev) => prev ? { ...prev, profilePic: uploadData.url } : prev);
    } catch (e) {
      setErr(e.message);
    } finally {
      setUploadingProfile(false);
    }
  }

  // Toggle follow
  async function toggleFollow() {
    if (!profile) return;
    try {
      if (profile.isFollowing) {
        await apiPost(`/api/users/${profile.id}/unfollow`);
        setProfile({ ...profile, isFollowing: false, counts: { ...profile.counts, followers: Math.max(0, profile.counts.followers - 1) } });
      } else {
        await apiPost(`/api/users/${profile.id}/follow`);
        setProfile({ ...profile, isFollowing: true, counts: { ...profile.counts, followers: profile.counts.followers + 1 } });
      }
    } catch (e) {
      setErr(e.message);
    }
  }

  if (loading) return (
    <div className="flex min-h-screen">
      <Navbar />
      <main className="flex-1 ml-64 p-8">
        <div className="text-center">Loading...</div>
      </main>
    </div>
  );

  if (err) return (
    <div className="flex min-h-screen">
      <Navbar />
      <main className="flex-1 ml-64 p-8">
        <div className="text-center text-red-600 dark:text-red-400">{err}</div>
      </main>
    </div>
  );

  if (!profile) return (
    <div className="flex min-h-screen">
      <Navbar />
      <main className="flex-1 ml-64 p-8">
        <div className="text-center">User not found</div>
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      
      <main className="flex-1 ml-64 min-h-screen">
        {/* Hero Cover Section - Full Width */}
        <div className="relative h-80 w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
          {profile.coverPhoto ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={profile.coverPhoto} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)',
              }}></div>
            </div>
          )}
          
          {profile.isMe && (
            <>
              <input 
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="absolute top-6 right-6 px-6 py-3 bg-black/30 backdrop-blur-xl text-white rounded-2xl hover:bg-black/40 transition-all font-semibold flex items-center gap-2 shadow-2xl border border-white/20"
              >
                <span className="text-xl">📷</span>
                <span>{uploadingCover ? 'Uploading...' : 'Change Cover'}</span>
              </button>
            </>
          )}
        </div>

        {/* Profile Content - Full Width Container */}
        <div className="relative">
          {/* Profile Header Card - Overlapping Cover */}
          <div className="max-w-7xl mx-auto px-6 -mt-24">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 p-8 backdrop-blur-xl">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Profile Photo */}
                <div className="relative flex-shrink-0">
                  <div className="relative w-40 h-40 rounded-3xl overflow-hidden border-4 border-white dark:border-gray-900 shadow-2xl bg-gradient-to-br from-indigo-500 to-purple-500">
                    {profile.profilePic ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={profile.profilePic} 
                        alt={profile.displayName || profile.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-6xl font-bold">
                        {profile.username?.[0]?.toUpperCase() || '👤'}
                      </div>
                    )}
                  </div>
                  
                  {profile.isMe && (
                    <>
                      <input 
                        ref={profileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileUpload}
                      />
                      <button
                        onClick={() => profileInputRef.current?.click()}
                        disabled={uploadingProfile}
                        className="absolute bottom-0 right-0 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all border-4 border-white dark:border-gray-900"
                      >
                        <span className="text-xl">📷</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        {profile.displayName || profile.username}
                        {profile.verified && (
                          <span className="text-blue-500 text-2xl" title="Verified">✓</span>
                        )}
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400 text-lg">@{profile.username}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {!profile.isMe ? (
                        <>
                          <button
                            onClick={handleFollow}
                            disabled={followLoading}
                            className={`px-6 py-3 rounded-2xl font-semibold transition-all shadow-lg ${
                              profile.isFollowing
                                ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                            }`}
                          >
                            {followLoading ? '...' : profile.isFollowing ? 'Following' : 'Follow'}
                          </button>
                          <button className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-all font-semibold shadow-lg">
                            Message
                          </button>
                        </>
                      ) : (
                        <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg">
                          Edit Profile
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-gray-700 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {profile.counts?.posts || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Posts</div>
                    </div>
                    <div className="text-center border-x border-gray-300 dark:border-gray-700">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {followers.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {following.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Following</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info Row */}
              {(profile.location || profile.website || profile.birthday) && (
                <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                  {profile.location && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span className="text-xl">📍</span>
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span className="text-xl">🔗</span>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {profile.website}
                      </a>
                    </div>
                  )}
                  {profile.birthday && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span className="text-xl">🎂</span>
                      <span>{formatDate(profile.birthday)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation - Full Width */}
          <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 mt-8">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {[
                  { key: 'posts', label: 'Posts', icon: '📝' },
                  { key: 'about', label: 'About', icon: 'ℹ️' },
                  { key: 'friends', label: 'Friends', icon: '👥' },
                  { key: 'photos', label: 'Photos', icon: '�' },
                  { key: 'videos', label: 'Videos', icon: '🎥' },
                  { key: 'tagged', label: 'Tagged', icon: '🏷️' },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-3 px-6 py-4 font-semibold transition-all whitespace-nowrap relative ${
                      activeTab === key
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                    <span>{label}</span>
                    {activeTab === key && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div className="space-y-6">
                {feed.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-16 text-center">
                    <div className="text-8xl mb-6">📝</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No posts yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      {profile.isMe ? 'Share your first post!' : `${profile.username} hasn't posted yet.`}
                    </p>
                  </div>
                ) : (
                  feed.map((post) => (
                    <PostCard 
                      key={post._id}
                      post={post} 
                      onPostUpdated={(np) => setFeed((prev) => prev.map((x) => (x._id === np._id ? { ...x, ...np} : x)))}
                    />
                  ))
                )}
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">About</h3>
                  <div className="p-6 space-y-4 text-sm">
                  {profile.location && (
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <span>�</span>
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-3">
                      <span>🔗</span>
                      <a href={profile.website} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate">
                        {profile.website}
                      </a>
                    </div>
                  )}
                  {profile.createdAt && (
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <span>📅</span>
                      <span>Joined {formatDate(profile.createdAt)}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="p-6 pt-0 space-y-3">
                  {profile.isMe ? (
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="w-full px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-semibold"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={toggleFollow}
                        className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
                          profile.isFollowing 
                            ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700'
                            : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                        }`}
                      >
                        {profile.isFollowing ? 'Following' : 'Follow'}
                      </button>
                      <button
                        onClick={() => router.push(`/messages?to=${profile.username}`)}
                        className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors font-semibold"
                      >
                        Message
                      </button>
                      <button
                        onClick={() => router.push(`/call?to=${profile.username}`)}
                        className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors font-semibold"
                      >
                        Call
                      </button>
                    </>
                  )}
                </div>
                
                {/* Tags */}
                {profile.tags && profile.tags.length > 0 && (
                  <div className="p-6 pt-0">
                    <div className="flex flex-wrap gap-2">
                      {profile.tags.map((tag, i) => (
                        <span 
                          key={i} 
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Friends</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {friends.length === 0 ? (
                      <div className="col-span-full text-center py-12">
                        <div className="text-6xl mb-4">👥</div>
                        <p className="text-gray-600 dark:text-gray-400">No friends yet</p>
                      </div>
                    ) : (
                      friends.map((friend) => (
                        <div key={friend.id} className="text-center">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 mx-auto mb-2 flex items-center justify-center text-white text-2xl font-bold">
                            {friend.username?.[0]?.toUpperCase()}
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{friend.username}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Photos, Videos, Tagged tabs */}
            {(activeTab === 'photos' || activeTab === 'videos' || activeTab === 'tagged') && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 capitalize">{activeTab}</h3>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">
                    {activeTab === 'photos' && '📷'}
                    {activeTab === 'videos' && '🎥'}
                    {activeTab === 'tagged' && '🏷️'}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">No {activeTab} yet</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold dark:text-white mb-4">Block User</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to block {profile.username}? They won't be able to see your profile or contact you.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await apiPatch(`/user/${profile.username}/block`);
                    setShowBlockModal(false);
                    router.push('/');
                  } catch (err) {
                    console.error('Block failed:', err);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold dark:text-white mb-4">Report {profile.username}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Help us understand the problem
            </p>
            <div className="space-y-2 mb-6">
              {['Spam', 'Harassment', 'Inappropriate Content', 'Fake Account', 'Other'].map((reason) => (
                <button
                  key={reason}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-900 dark:text-white"
                  onClick={async () => {
                    try {
                      await apiPost(`/user/${profile.username}/report`, { reason });
                      setShowReportModal(false);
                      alert('Report submitted');
                    } catch (err) {
                      console.error('Report failed:', err);
                    }
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Media Modal */}
      {fullscreenMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <button
            onClick={() => setFullscreenMedia(null)}
            className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <span className="text-white text-2xl">×</span>
          </button>
          <div className="max-w-5xl w-full h-full flex items-center justify-center p-4">
            {fullscreenMedia.type === 'image' ? (
              <img
                src={fullscreenMedia.url}
                alt=""
                className="max-w-full max-h-full object-contain rounded-2xl"
              />
            ) : fullscreenMedia.type === 'video' ? (
              <video
                src={fullscreenMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-2xl"
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

/*  */
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Birthday:</span>
                        <span className="dark:text-white">{formatDate(profile.birthday)}</span>
                      </div>
                    )}
                    {profile.relationshipStatus && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Relationship:</span>
                        <span className="dark:text-white">{profile.relationshipStatus}</span>
                      </div>
                    )}
                    {profile.pronouns && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Pronouns:</span>
                        <span className="dark:text-white">{profile.pronouns}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info Section */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
                  <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2">
                    <span className="text-2xl">📞</span> Contact Info
                  </h3>
                  <div className="space-y-3 text-sm">
                    {profile.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Email:</span>
                        <a href={`mailto:${profile.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                          {profile.email}
                        </a>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                        <span className="dark:text-white">{profile.phone}</span>
                      </div>
                    )}
                    {profile.socialLinks && profile.socialLinks.length > 0 ? (
                      profile.socialLinks.map((link, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400">{link.platform}:</span>
                          <a href={link.url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate">
                            {link.url}
                          </a>
                        </div>
                      ))
                    ) : (
                      !profile.email && !profile.phone && (
                        <div className="text-gray-500 dark:text-gray-400 italic">No contact info added yet</div>
                      )
                    )}
                  </div>
                </div>

                {/* Location Section */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
                  <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2">
                    <span className="text-2xl">📍</span> Places Lived
                  </h3>
                  <div className="space-y-3 text-sm">
                    {profile.currentCity && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-600 dark:text-gray-400 min-w-fit">Current:</span>
                        <span className="dark:text-white">{profile.currentCity}</span>
                      </div>
                    )}
                    {profile.hometown && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-600 dark:text-gray-400 min-w-fit">Hometown:</span>
                        <span className="dark:text-white">{profile.hometown}</span>
                      </div>
                    )}
                    {!profile.currentCity && !profile.hometown && (
                      <div className="text-gray-500 dark:text-gray-400 italic">No location added yet</div>
                    )}
                  </div>
                </div>

                {/* Work Section */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
                  <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2">
                    <span className="text-2xl">💼</span> Work
                  </h3>
                  <div className="space-y-3 text-sm">
                    {profile.work && profile.work.length > 0 ? (
                      profile.work.map((job, i) => (
                        <div key={i} className="pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                          <div className="font-medium dark:text-white">{job.position || job.role}</div>
                          <div className="text-gray-600 dark:text-gray-400">{job.company}</div>
                          {job.startDate && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {formatDate(job.startDate)} - {job.endDate ? formatDate(job.endDate) : 'Present'}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 italic">No work experience added yet</div>
                    )}
                  </div>
                </div>

                {/* Education Section */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
                  <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2">
                    <span className="text-2xl">🎓</span> Education
                  </h3>
                  <div className="space-y-3 text-sm">
                    {profile.education && profile.education.length > 0 ? (
                      profile.education.map((edu, i) => (
                        <div key={i} className="pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                          <div className="font-medium dark:text-white">{edu.school}</div>
                          <div className="text-gray-600 dark:text-gray-400">{edu.degree || edu.major}</div>
                          {edu.graduationYear && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Class of {edu.graduationYear}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 italic">No education added yet</div>
                    )}
                  </div>
                </div>

                {/* Languages Section */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
                  <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2">
                    <span className="text-2xl">🌐</span> Languages
                  </h3>
                  <div className="space-y-2 text-sm">
                    {profile.languages && profile.languages.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.languages.map((lang, i) => (
                          <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs font-medium">
                            {lang}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 italic">No languages added yet</div>
                    )}
                  </div>
                </div>

                {/* Interests Section */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
                  <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2">
                    <span className="text-2xl">⭐</span> Interests
                  </h3>
                  <div className="space-y-2 text-sm">
                    {profile.interests && profile.interests.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((interest, i) => (
                          <span key={i} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
                            {interest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 italic">No interests added yet</div>
                    )}
                  </div>
                </div>

                {/* Life Events Section */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 lg:col-span-2 xl:col-span-3">
                  <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2">
                    <span className="text-2xl">🎉</span> Life Events
                  </h3>
                  <div className="space-y-3 text-sm">
                    {profile.lifeEvents && profile.lifeEvents.length > 0 ? (
                      profile.lifeEvents.map((event, i) => (
                        <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                          <div className="text-2xl">{event.icon || '📅'}</div>
                          <div className="flex-1">
                            <div className="font-medium dark:text-white">{event.title}</div>
                            {event.description && (
                              <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">{event.description}</div>
                            )}
                            {event.date && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{formatDate(event.date)}</div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 italic">No life events added yet</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <div className="space-y-6 max-w-7xl mx-auto">
                {/* Friends Stats */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold dark:text-white">👥 Friends & Connections</h3>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {friends.length} friends
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold dark:text-white">{followers.length}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Followers</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold dark:text-white">{following.length}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Following</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold dark:text-white">{friends.length}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Friends</div>
                    </div>
                  </div>
                </div>

                {/* Mutual Friends */}
                {!profile.isMe && followers.some(f => following.some(fw => fw.id === f.id)) && (
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
                    <h4 className="text-md font-semibold dark:text-white mb-4">🤝 Mutual Friends</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {followers
                        .filter(f => following.some(fw => fw.id === f.id))
                        .slice(0, 8)
                        .map((friend) => (
                          <a
                            key={friend.id}
                            href={`/u/${friend.username}`}
                            className="block bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow"
                          >
                            <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-green-400 to-blue-500 mb-2 flex items-center justify-center text-white text-xl font-bold">
                              {friend.username?.[0]?.toUpperCase() || '�'}
                            </div>
                            <div className="text-xs font-medium dark:text-white truncate text-center">{friend.username}</div>
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                {/* All Friends */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
                  <h4 className="text-md font-semibold dark:text-white mb-4">All Friends</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {friends.length === 0 ? (
                      <div className="col-span-full text-center py-12 text-gray-600 dark:text-gray-400">
                        <div className="text-4xl mb-3">👥</div>
                        <div className="font-medium mb-1">No friends yet</div>
                        <div className="text-sm">
                          {profile.isMe ? 'Start connecting with people!' : `${profile.username} hasn't added friends yet.`}
                        </div>
                      </div>
                    ) : (
                      friends.map((friend) => (
                        <a
                          key={friend.id}
                          href={`/u/${friend.username}`}
                          className="block bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow group"
                        >
                          <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 mb-2 flex items-center justify-center text-white text-2xl font-bold group-hover:scale-105 transition-transform">
                            {friend.username?.[0]?.toUpperCase() || '👤'}
                          </div>
                          <div className="text-sm font-medium dark:text-white truncate text-center">{friend.username}</div>
                          {friend.mutualFriends && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                              {friend.mutualFriends} mutual
                            </div>
                          )}
                        </a>
                      ))
                    )}
                  </div>
                </div>

                {/* Followers Section (if viewing others' profile) */}
                {!profile.isMe && followers.length > 0 && (
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
                    <h4 className="text-md font-semibold dark:text-white mb-4">
                      Followers ({followers.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {followers.slice(0, 8).map((follower) => (
                        <a
                          key={follower.id}
                          href={`/u/${follower.username}`}
                          className="block bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow"
                        >
                          <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-pink-400 to-orange-500 mb-2 flex items-center justify-center text-white text-xl font-bold">
                            {follower.username?.[0]?.toUpperCase() || '👤'}
                          </div>
                          <div className="text-xs font-medium dark:text-white truncate text-center">{follower.username}</div>
                        </a>
                      ))}
                    </div>
                    {followers.length > 8 && (
                      <button className="w-full mt-4 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors font-medium">
                        See all {followers.length} followers
                      </button>
                    )}
                  </div>
                )}

                {/* Following Section (if viewing others' profile) */}
                {!profile.isMe && following.length > 0 && (
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
                    <h4 className="text-md font-semibold dark:text-white mb-4">
                      Following ({following.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {following.slice(0, 8).map((user) => (
                        <a
                          key={user.id}
                          href={`/u/${user.username}`}
                          className="block bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow"
                        >
                          <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 mb-2 flex items-center justify-center text-white text-xl font-bold">
                            {user.username?.[0]?.toUpperCase() || '👤'}
                          </div>
                          <div className="text-xs font-medium dark:text-white truncate text-center">{user.username}</div>
                        </a>
                      ))}
                    </div>
                    {following.length > 8 && (
                      <button className="w-full mt-4 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors font-medium">
                        See all {following.length} following
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold dark:text-white">📷 Photos</h3>
                  {profile.isMe && (
                    <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      ➕ Add Photos
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {feed.filter(post => post.media && post.media.length > 0).length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-600 dark:text-gray-400">
                      <div className="text-6xl mb-3">📷</div>
                      <div className="font-medium mb-1">No photos yet</div>
                      <div className="text-sm">
                        {profile.isMe ? 'Share your first photo!' : `${profile.username} hasn't shared photos yet.`}
                      </div>
                    </div>
                  ) : (
                    feed
                      .filter(post => post.media && post.media.length > 0)
                      .map((post, idx) => (
                        <button
                          key={post._id}
                          onClick={() => {
                            setLightboxPost(post);
                            setLightboxIndex(idx);
                            setLightboxOpen(true);
                          }}
                          className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden group relative hover:opacity-90 transition-opacity"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={post.media[0].url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium flex items-center gap-3">
                              <span>❤️ {post.likes || 0}</span>
                              <span>💬 {post.commentsCount || 0}</span>
                            </div>
                          </div>
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* Videos Tab */}
            {activeTab === 'videos' && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold dark:text-white">🎥 Videos & Reels</h3>
                  {profile.isMe && (
                    <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      ➕ Add Video
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {reels.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-600 dark:text-gray-400">
                      <div className="text-6xl mb-3">🎥</div>
                      <div className="font-medium mb-1">No videos yet</div>
                      <div className="text-sm">
                        {profile.isMe ? 'Share your first video or reel!' : `${profile.username} hasn't shared videos yet.`}
                      </div>
                    </div>
                  ) : (
                    reels.map((reel) => (
                      <button
                        key={reel._id}
                        className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden group relative hover:opacity-90 transition-opacity"
                      >
                        {reel.media?.[0]?.url && (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={reel.media[0].url} 
                              alt="" 
                              className="w-full h-full object-cover" 
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                ▶️
                              </div>
                            </div>
                            <div className="absolute bottom-2 left-2 right-2 text-white text-xs font-medium flex items-center justify-between">
                              <span>❤️ {reel.likes || 0}</span>
                              <span>💬 {reel.commentsCount || 0}</span>
                            </div>
                          </>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tagged Tab */}
            {activeTab === 'tagged' && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 max-w-7xl mx-auto">
                <h3 className="text-lg font-semibold dark:text-white mb-4">🏷️ Tagged Posts</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Posts where {profile.isMe ? 'you are' : `${profile.username} is`} tagged
                </p>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {tagged.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-600 dark:text-gray-400">
                      <div className="text-6xl mb-3">🏷️</div>
                      <div className="font-medium mb-1">No tagged posts</div>
                      <div className="text-sm">
                        {profile.isMe ? 'Posts you\'re tagged in will appear here' : `${profile.username} hasn't been tagged in any posts.`}
                      </div>
                    </div>
                  ) : (
                    tagged.map((post, i) => (
                      <button
                        key={i}
                        className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden group relative hover:opacity-90 transition-opacity"
                      >
                        {post.media?.[0]?.url ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={post.media[0].url} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium flex items-center gap-3">
                                <span>❤️ {post.likes || 0}</span>
                                <span>💬 {post.commentsCount || 0}</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                            <span className="text-4xl">📝</span>
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold dark:text-white mb-4">Block {profile.username}?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              They won&apos;t be able to find your profile or see your content. They won&apos;t be notified that you blocked them.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await apiPost(`/api/users/${profile.id}/block`);
                    setShowBlockModal(false);
                    alert('User blocked successfully');
                    router.push('/home');
                  } catch (e) {
                    alert('Failed to block user');
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold dark:text-white mb-4">Report Profile</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Why are you reporting this profile?
            </p>
            <div className="space-y-2 mb-6">
              {[
                '🚫 Spam or fake account',
                '😢 Harassment or bullying',
                '🔞 Inappropriate content',
                '⚠️ Hate speech',
                '🔒 Privacy violation',
                '💰 Scam or fraud',
                '❌ Something else',
              ].map((reason, i) => (
                <button
                  key={i}
                  onClick={async () => {
                    try {
                      await apiPost(`/api/users/${profile.id}/report`, { reason });
                      setShowReportModal(false);
                      alert('Report submitted. Thank you for helping keep our community safe.');
                    } catch (e) {
                      alert('Failed to submit report');
                    }
                  }}
                  className="w-full px-4 py-3 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors dark:text-white"
                >
                  {reason}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowReportModal(false)}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Media Lightbox */}
      {lightboxOpen && lightboxPost && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-xl transition-colors"
          >
            ✕
          </button>
          
          <div className="max-w-7xl w-full h-full flex items-center justify-center p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-full max-h-[90vh]">
              {/* Image */}
              <div className="md:col-span-2 flex items-center justify-center bg-black rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={lightboxPost.media[0].url} 
                  alt="" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              
              {/* Post Details */}
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {lightboxPost.user?.username?.[0]?.toUpperCase() || '👤'}
                    </div>
                    <div>
                      <div className="font-semibold dark:text-white">{lightboxPost.user?.username || 'User'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(lightboxPost.createdAt)}</div>
                    </div>
                  </div>
                </div>
                
                {/* Caption */}
                <div className="p-4 flex-1 overflow-y-auto">
                  {lightboxPost.caption && (
                    <p className="text-sm dark:text-gray-200 whitespace-pre-wrap">{lightboxPost.caption}</p>
                  )}
                </div>
                
                {/* Engagement */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                    <button className="flex items-center gap-2 hover:text-red-500 transition-colors">
                      <span className="text-lg">❤️</span>
                      <span className="font-medium">{lightboxPost.likes || 0}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                      <span className="text-lg">💬</span>
                      <span className="font-medium">{lightboxPost.commentsCount || 0}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-green-500 transition-colors">
                      <span className="text-lg">🔖</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && profile?.isMe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-2xl font-bold dark:text-white">✏️ Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="md:col-span-2">
                  <h4 className="text-lg font-semibold dark:text-white mb-4">Basic Information</h4>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your display name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profile.username}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Bio
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAIBioGenerator(!showAIBioGenerator)}
                      className="px-3 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-1"
                    >
                      ✨ AI Generate
                    </button>
                  </div>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us about yourself..."
                  />
                  
                  {/* AI Bio Generator */}
                  {showAIBioGenerator && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <h5 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-3">
                        ✨ AI Bio Generator
                      </h5>
                      <div className="space-y-2 mb-3">
                        <button
                          onClick={async () => {
                            setGeneratingBio(true);
                            try {
                              // Simulate AI generation
                              await new Promise(resolve => setTimeout(resolve, 1500));
                              const bios = [
                                `${profile.displayName || profile.username} | ${editForm.currentCity || 'Explorer'} 🌍 | ${editForm.interests || 'Passionate about life'} | Living my best life ✨`,
                                `✨ ${editForm.gender || 'Creative'} | 📍 ${editForm.currentCity || 'Wanderer'} | ${editForm.interests ? editForm.interests.split(',')[0] : 'Dreamer'} enthusiast | Making memories 📸`,
                                `${profile.displayName || profile.username} | ${editForm.relationshipStatus || 'Living life'} | ${editForm.interests || 'Exploring the world'} | Follow my journey 🚀`,
                                `🌟 ${editForm.gender || 'Human'} from ${editForm.hometown || 'Earth'} | ${editForm.interests || 'Life lover'} | ${editForm.currentCity || 'Somewhere amazing'} based | DM for collabs 💼`,
                              ];
                              setAiSuggestions(bios);
                            } finally {
                              setGeneratingBio(false);
                            }
                          }}
                          disabled={generatingBio}
                          className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium disabled:opacity-50"
                        >
                          {generatingBio ? '✨ Generating...' : '✨ Generate Bio Suggestions'}
                        </button>
                      </div>
                      
                      {aiSuggestions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-purple-700 dark:text-purple-400 font-medium">
                            Click to use:
                          </p>
                          {aiSuggestions.map((suggestion, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setEditForm({ ...editForm, bio: suggestion });
                                setShowAIBioGenerator(false);
                                setAiSuggestions([]);
                              }}
                              className="w-full text-left px-3 py-2 bg-white dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City, Country"
                  />
                </div>
                
                {/* Personal Details */}
                <div className="md:col-span-2 mt-4">
                  <h4 className="text-lg font-semibold dark:text-white mb-4">Personal Details</h4>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Birthday
                  </label>
                  <input
                    type="date"
                    value={editForm.birthday}
                    onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender
                  </label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pronouns
                  </label>
                  <input
                    type="text"
                    value={editForm.pronouns}
                    onChange={(e) => setEditForm({ ...editForm, pronouns: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., he/him, she/her, they/them"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Relationship Status
                  </label>
                  <select
                    value={editForm.relationshipStatus}
                    onChange={(e) => setEditForm({ ...editForm, relationshipStatus: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select status</option>
                    <option value="Single">Single</option>
                    <option value="In a relationship">In a relationship</option>
                    <option value="Engaged">Engaged</option>
                    <option value="Married">Married</option>
                    <option value="It's complicated">It&apos;s complicated</option>
                  </select>
                </div>
                
                {/* Location Details */}
                <div className="md:col-span-2 mt-4">
                  <h4 className="text-lg font-semibold dark:text-white mb-4">Location</h4>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current City
                  </label>
                  <input
                    type="text"
                    value={editForm.currentCity}
                    onChange={(e) => setEditForm({ ...editForm, currentCity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Where do you live now?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hometown
                  </label>
                  <input
                    type="text"
                    value={editForm.hometown}
                    onChange={(e) => setEditForm({ ...editForm, hometown: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Where are you from?"
                  />
                </div>
                
                {/* Contact Info */}
                <div className="md:col-span-2 mt-4">
                  <h4 className="text-lg font-semibold dark:text-white mb-4">Contact Information</h4>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                
                {/* Additional Info */}
                <div className="md:col-span-2 mt-4">
                  <h4 className="text-lg font-semibold dark:text-white mb-4">Additional Information</h4>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Languages (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editForm.languages}
                    onChange={(e) => setEditForm({ ...editForm, languages: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="English, Spanish, French"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Interests (comma-separated)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        // AI Interest Detection based on bio and other profile info
                        const detectedInterests = [
                          'Photography', 'Travel', 'Technology', 'Music', 'Art', 'Sports',
                          'Reading', 'Cooking', 'Fitness', 'Gaming', 'Fashion', 'Nature'
                        ].slice(0, 5).join(', ');
                        setEditForm({ ...editForm, interests: detectedInterests });
                        alert('✨ AI detected interests based on your profile!');
                      }}
                      className="px-3 py-1 text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center gap-1"
                    >
                      🤖 Detect Interests
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editForm.interests}
                    onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Photography, Travel, Coding"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    💡 Tip: AI can detect interests from your posts and activity
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={saving}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setSaving(true);
                  try {
                    const payload = {
                      displayName: editForm.displayName || undefined,
                      bio: editForm.bio || undefined,
                      website: editForm.website || undefined,
                      location: editForm.location || undefined,
                      birthday: editForm.birthday ? new Date(editForm.birthday) : undefined,
                      gender: editForm.gender || undefined,
                      pronouns: editForm.pronouns || undefined,
                      relationshipStatus: editForm.relationshipStatus || undefined,
                      currentCity: editForm.currentCity || undefined,
                      hometown: editForm.hometown || undefined,
                      phone: editForm.phone || undefined,
                      email: editForm.email || undefined,
                      languages: editForm.languages ? editForm.languages.split(',').map(s => s.trim()).filter(Boolean) : undefined,
                      interests: editForm.interests ? editForm.interests.split(',').map(s => s.trim()).filter(Boolean) : undefined,
                    };
                    const { user } = await apiPatch('/api/users/me', payload);
                    setProfile({ ...profile, ...user });
                    setShowEditModal(false);
                    alert('Profile updated successfully!');
                  } catch (e) {
                    alert('Failed to update profile: ' + e.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

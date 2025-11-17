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
  const [currentUser, setCurrentUser] = useState(null);
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
  
  // Post Detail Modal States
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [editPostCaption, setEditPostCaption] = useState('');
  
  // Archive States
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archivedPosts, setArchivedPosts] = useState([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  
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

  // Profile Picture Upload Handler
  const handleProfileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('❌ No file selected');
      return;
    }
    
    console.log('📤 Uploading profile picture:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('❌ Please select an image file');
      return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('❌ File size must be less than 10MB');
      return;
    }
    
    setUploadingProfile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'profile');
      
      console.log('📤 Sending upload request to:', `${API_BASE}/api/upload`);
      
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      
      const data = await res.json();
      console.log('📥 Upload response:', data);
      
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Upload failed');
      }
      
      if (!data.url) {
        throw new Error('No URL returned from upload');
      }
      
      console.log('✅ Upload successful, URL:', data.url);
      console.log('💾 Updating profile with new picture...');
      
      // Update profile with new profile picture
      const updateRes = await fetch(`${API_BASE}/api/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ profilePic: data.url }),
      });
      
      const updateData = await updateRes.json();
      console.log('📥 Profile update response:', updateData);
      
      if (!updateRes.ok) {
        throw new Error(updateData.message || 'Failed to update profile');
      }
      
      if (updateData.user) {
        setProfile(prev => ({ ...prev, profilePic: updateData.user.profilePic }));
        console.log('✅ Profile state updated with new picture');
        alert('✅ Profile picture updated successfully!');
        
        // Reload to show changes
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('❌ Profile upload error:', error);
      alert(`❌ Failed to upload profile picture: ${error.message}`);
    } finally {
      setUploadingProfile(false);
    }
  };
  
  // Cover Photo Upload Handler
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('❌ No file selected');
      return;
    }
    
    console.log('📤 Uploading cover photo:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('❌ Please select an image file');
      return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('❌ File size must be less than 10MB');
      return;
    }
    
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'cover');
      
      console.log('📤 Sending upload request to:', `${API_BASE}/api/upload`);
      
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      
      const data = await res.json();
      console.log('📥 Upload response:', data);
      
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Upload failed');
      }
      
      if (!data.url) {
        throw new Error('No URL returned from upload');
      }
      
      console.log('✅ Upload successful, URL:', data.url);
      console.log('💾 Updating profile with new cover...');
      
      // Update profile with new cover photo
      const updateRes = await fetch(`${API_BASE}/api/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ coverPhoto: data.url }),
      });
      
      const updateData = await updateRes.json();
      console.log('📥 Profile update response:', updateData);
      
      if (!updateRes.ok) {
        throw new Error(updateData.message || 'Failed to update profile');
      }
      
      if (updateData.user) {
        setProfile(prev => ({ ...prev, coverPhoto: updateData.user.coverPhoto }));
        console.log('✅ Profile state updated with new cover');
        alert('✅ Cover photo updated successfully!');
        
        // Reload to show changes
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('❌ Cover upload error:', error);
      alert(`❌ Failed to upload cover photo: ${error.message}`);
    } finally {
      setUploadingCover(false);
    }
  };
  
  // Edit Profile Handler
  const handleEditProfile = async () => {
    setSaving(true);
    try {
      // Prepare the data payload
      const payload = {
        displayName: editForm.displayName || '',
        bio: editForm.bio || '',
        website: editForm.website || '',
        location: editForm.location || '',
        birthday: editForm.birthday || null,
        gender: editForm.gender || '',
        pronouns: editForm.pronouns || '',
        relationshipStatus: editForm.relationshipStatus || '',
        currentCity: editForm.currentCity || '',
        hometown: editForm.hometown || '',
        phone: editForm.phone || '',
        email: editForm.email || '',
        languages: editForm.languages ? editForm.languages.split(',').map(l => l.trim()).filter(Boolean) : [],
        interests: editForm.interests ? editForm.interests.split(',').map(i => i.trim()).filter(Boolean) : [],
      };

      // Remove empty strings to avoid validation issues
      Object.keys(payload).forEach(key => {
        if (payload[key] === '' && key !== 'displayName' && key !== 'bio') {
          delete payload[key];
        }
      });

      console.log('📤 Sending profile update:', JSON.stringify(payload, null, 2));

      // Use apiPatch helper
      const result = await apiPatch('/api/users/me', payload);
      
      console.log('✅ Profile update response:', JSON.stringify(result, null, 2));
      
      // Update the profile state with new data
      if (result.user) {
        setProfile(prev => ({ 
          ...prev, 
          ...result.user,
          isMe: prev.isMe // Preserve isMe flag
        }));
        
        // Update edit form with the saved data
        setEditForm({
          displayName: result.user.displayName || '',
          bio: result.user.bio || '',
          website: result.user.website || '',
          location: result.user.city || result.user.location || '',
          birthday: result.user.birthday ? new Date(result.user.birthday).toISOString().split('T')[0] : '',
          gender: result.user.gender || '',
          pronouns: result.user.pronouns || '',
          relationshipStatus: result.user.relationshipStatus || '',
          currentCity: result.user.currentCity || '',
          hometown: result.user.hometown || '',
          phone: result.user.phone || '',
          email: result.user.email || '',
          languages: result.user.languages?.join(', ') || '',
          interests: result.user.interests?.join(', ') || '',
        });
      }
      
      setShowEditModal(false);
      alert('✅ Profile updated successfully!');
      
      console.log('✅ Profile state updated, reloading page...');
      // Reload the page to reflect all changes
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('❌ Profile update error:', error);
      console.error('❌ Error details:', error.message);
      alert(`❌ Failed to update profile: ${error.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };
  
  // AI Bio Generator Handler
  const handleGenerateAIBio = async () => {
    setGeneratingBio(true);
    try {
      // Gather data about user's posts and interests
      const postsContent = feed.slice(0, 10).map(p => p.caption).filter(Boolean).join(' ');
      const userInterests = editForm.interests || profile?.interests?.join(', ') || '';
      const currentBio = editForm.bio || profile?.bio || '';
      
      const payload = {
        posts: postsContent,
        interests: userInterests,
        currentBio: currentBio,
        displayName: editForm.displayName || profile?.displayName || profile?.username,
      };

      console.log('🤖 Generating AI bio with data:', payload);

      const res = await fetch(`${API_BASE}/api/ai/generate-bio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (res.ok && data.suggestions) {
        setAiSuggestions(data.suggestions);
        console.log('✅ AI generated bios:', data.suggestions);
      } else {
        throw new Error(data.error || 'Failed to generate bio suggestions');
      }
    } catch (error) {
      console.error('❌ AI bio generation error:', error);
      alert(error.message || 'Failed to generate bio. Please try again.');
    } finally {
      setGeneratingBio(false);
    }
  };

  // Block User Handler
  const handleBlockUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${profile._id}/block`, {
        method: 'POST',
        headers: authHeaders(),
      });
      
      if (res.ok) {
        setShowBlockModal(false);
        alert('User blocked successfully');
        router.push('/home');
      }
    } catch (error) {
      console.error('Block error:', error);
      alert('Failed to block user');
    }
  };
  
  // Report User Handler
  const handleReportUser = async (reason) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${profile._id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ reason }),
      });
      
      if (res.ok) {
        setShowReportModal(false);
        alert('Report submitted successfully');
      }
    } catch (error) {
      console.error('Report error:', error);
      alert('Failed to submit report');
    }
  };

  // Load profile data
  useEffect(() => {
    (async () => {
      setErr('');
      setLoading(true);
      try {
        console.log('🔍 Loading profile for:', username);
        
        // Check if user is authenticated
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          console.error('❌ No authentication token found');
          setErr('Please log in to view profiles');
          setLoading(false);
          router.push('/login');
          return;
        }
        
        console.log('✅ Token found, fetching profile data...');
        
        const [{ profile: p }, { posts }, { users: fols }, { users: fing }] = await Promise.all([
          apiGet(`/api/users/profile/${username}`),
          apiGet(`/api/posts/user/${username}?type=post&limit=60`),
          apiGet(`/api/users/${username}/followers`),
          apiGet(`/api/users/${username}/following`),
        ]);
        
        console.log('✅ Profile loaded successfully:', p);
        console.log('📝 Posts loaded:', posts?.length || 0, 'posts');
        console.log('Posts data:', posts);
        setProfile(p);
        setFeed(posts || []);
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
        console.error('❌ Error loading profile:', e);
        setErr(e.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [username, router]);

  // Load current user
  useEffect(() => {
    (async () => {
      try {
        const { user } = await apiGet('/api/users/me');
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load current user:', error);
      }
    })();
  }, []);

  // Load reels
  useEffect(() => {
    (async () => {
      try {
        const { posts: r } = await apiGet(`/api/posts/user/${username}?type=reel&limit=60`);
        setReels(r);
      } catch {}
    })();
  }, [username]);

  // Load tagged posts
  useEffect(() => {
    (async () => {
      try {
        const { posts: t } = await apiGet(`/api/posts/tagged/${username}?limit=60`);
        setTagged(t || []);
      } catch (error) {
        console.log('Tagged posts not available or error:', error);
        setTagged([]);
      }
    })();
  }, [username]);

  // Like/Unlike Post
  const handleLikePost = async (postId) => {
    try {
      await apiPost(`/api/posts/${postId}/like`);
      // Update the post in feed and selectedPost
      setFeed(feed.map(p => 
        p._id === postId 
          ? { ...p, likesCount: (p.likesCount || 0) + 1, liked: true }
          : p
      ));
      if (selectedPost?._id === postId) {
        setSelectedPost({ 
          ...selectedPost, 
          likesCount: (selectedPost.likesCount || 0) + 1,
          liked: true
        });
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  // Add Comment
  const handleAddComment = async (postId, commentText) => {
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ text: commentText }),
      });
      const data = await res.json();
      if (res.ok) {
        // Update the post with new comment
        const updatedPost = { ...selectedPost, comments: [...(selectedPost.comments || []), data.comment] };
        setSelectedPost(updatedPost);
        setFeed(feed.map(p => p._id === postId ? updatedPost : p));
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId) => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      
      if (res.ok) {
        // Remove post from feed
        setFeed(feed.filter(p => p._id !== postId));
        // Close modal
        setShowPostModal(false);
        setShowDeleteConfirm(false);
        setSelectedPost(null);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  // Edit Post
  const handleEditPost = async (postId) => {
    if (!editPostCaption.trim()) {
      alert('Caption cannot be empty');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ caption: editPostCaption }),
      });
      
      if (res.ok) {
        const data = await res.json();
        // Update the post in feed and selectedPost
        const updatedPost = { ...selectedPost, caption: editPostCaption };
        setFeed(feed.map(p => p._id === postId ? updatedPost : p));
        setSelectedPost(updatedPost);
        setShowEditPostModal(false);
        setEditPostCaption('');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to edit post');
      }
    } catch (error) {
      console.error('Failed to edit post:', error);
      alert('Failed to edit post');
    }
  };

  // Load Archived Posts
  const loadArchivedPosts = async () => {
    setLoadingArchive(true);
    try {
      const { user } = await apiGet('/api/users/me');
      const { posts } = await apiGet(`/api/posts/user/${user.username}?limit=200`);
      // Filter archived posts (assuming archived field exists or privacy='archived')
      const archived = posts.filter(p => p.archived === true || p.privacy === 'archived');
      setArchivedPosts(archived);
    } catch (error) {
      console.error('Failed to load archived posts:', error);
      alert('Failed to load archived posts');
    } finally {
      setLoadingArchive(false);
    }
  };

  // Archive/Unarchive Post
  const handleArchivePost = async (postId, isArchived) => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ archived: !isArchived }),
      });
      
      if (res.ok) {
        // Remove from feed if archiving
        if (!isArchived) {
          setFeed(feed.filter(p => p._id !== postId));
          loadArchivedPosts(); // Reload archived posts
        } else {
          // Remove from archive and add back to feed
          setArchivedPosts(archivedPosts.filter(p => p._id !== postId));
          // Reload feed to show the post again
          const { posts } = await apiGet(`/api/posts/user/${username}?type=post&limit=60`);
          setFeed(posts || []);
        }
        setShowPostModal(false);
        setSelectedPost(null);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to archive post');
      }
    } catch (error) {
      console.error('Failed to archive post:', error);
      alert('Failed to archive post');
    }
  };

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
    <div className="flex min-h-screen pt-[60px] md:pt-0">
      <Navbar />
      <main className="flex-1 md:ml-64 p-8">
        <div className="text-center">Loading...</div>
      </main>
    </div>
  );

  if (err) return (
    <div className="flex min-h-screen pt-[60px] md:pt-0">
      <Navbar />
      <main className="flex-1 md:ml-64 p-8">
        <div className="max-w-md mx-auto mt-16 text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">Error Loading Profile</h2>
            <p className="text-red-600 dark:text-red-400 mb-4">{err}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    </div>
  );

  if (!profile) return (
    <div className="flex min-h-screen pt-[60px] md:pt-0">
      <Navbar />
      <main className="flex-1 md:ml-64 p-8">
        <div className="text-center">User not found</div>
      </main>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950 pt-[60px] md:pt-0">
      <Navbar />
      
      <main className="flex-1 md:ml-64 overflow-x-hidden">
        {/* Instagram-style Profile Header */}
        <div className="max-w-4xl mx-auto pt-4 md:pt-8 px-4">
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 lg:gap-20 items-start mb-8 md:mb-11">
            {/* Profile Picture */}
            <div className="relative flex-shrink-0 mx-auto md:mx-0">
              {profile.profilePic ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={profile.profilePic} 
                  alt={profile.username}
                  className="w-24 h-24 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full object-cover border border-gray-200 dark:border-gray-800"
                />
              ) : (
                <div className="w-24 h-24 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-4xl md:text-5xl font-bold text-white">
                  {profile.username?.[0]?.toUpperCase()}
                </div>
              )}
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
                    className="absolute bottom-0 right-0 w-9 h-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <span className="text-sm">📷</span>
                  </button>
                </>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0 w-full">
              {/* Username and Actions */}
              <div className="flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-4 mb-5">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-light dark:text-white">{profile.username}</h1>
                  {profile.verified && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                      ✓
                    </div>
                  )}
                </div>
                
                {/* Action Buttons - Instagram Style */}
                <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                {profile.isMe ? (
                  <>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex-1 md:flex-initial px-4 md:px-6 py-1.5 bg-gray-100 dark:bg-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors dark:text-white"
                    >
                      Edit profile
                    </button>
                    <button 
                      onClick={() => {
                        setShowArchiveModal(true);
                        loadArchivedPosts();
                      }}
                      className="flex-1 md:flex-initial px-4 md:px-6 py-1.5 bg-gray-100 dark:bg-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors dark:text-white"
                    >
                      View archive
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={toggleFollow}
                      className={`flex-1 md:flex-initial px-4 md:px-6 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                        profile.isFollowing 
                          ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {profile.isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                      onClick={() => router.push(`/messages?to=${profile.username}`)}
                      className="flex-1 md:flex-initial px-4 md:px-6 py-1.5 bg-gray-100 dark:bg-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors dark:text-white"
                    >
                      Message
                    </button>
                  </>
                )}
                </div>
                    
                    {/* More Options */}
                    {!profile.isMe && <div className="relative">
                      <button
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <span className="text-xl dark:text-white">⋯</span>
                      </button>
                      {showMoreMenu && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowMoreMenu(false)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                            <button
                              onClick={() => {
                                router.push(`/call?to=${profile.username}`);
                                setShowMoreMenu(false);
                              }}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                            >
                              Start Call
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                setShowMoreMenu(false);
                                alert('Link copied!');
                              }}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                            >
                              Copy Profile URL
                            </button>
                            <button
                              onClick={() => {
                                setShowMoreMenu(false);
                                setShowBlockModal(true);
                              }}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                            >
                              Block
                            </button>
                            <button
                              onClick={() => {
                                setShowMoreMenu(false);
                                setShowReportModal(true);
                              }}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                            >
                              Report
                            </button>
                          </div>
                        </>
                      )}
                    </div>}
              </div>

              {/* Stats - Instagram Style */}
              <div className="flex gap-6 md:gap-10 mb-5 justify-center md:justify-start">
                <div className="text-center md:text-left">
                  <span className="font-semibold dark:text-white">{profile.counts?.posts || 0}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">posts</span>
                </div>
                <button className="hover:opacity-70 transition-opacity text-center md:text-left">
                  <span className="font-semibold dark:text-white">{profile.counts?.followers || 0}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">followers</span>
                </button>
                <button className="hover:opacity-70 transition-opacity text-center md:text-left">
                  <span className="font-semibold dark:text-white">{profile.counts?.following || 0}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">following</span>
                </button>
              </div>

              {/* Name and Bio */}
              <div className="mb-5 text-center md:text-left">
                {profile.displayName && (
                  <div className="font-semibold dark:text-white">{profile.displayName}</div>
                )}
                {profile.bio && (
                  <div className="text-sm dark:text-gray-300 whitespace-pre-wrap">{profile.bio}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instagram-style Tabs */}
        <div className="border-t border-gray-300 dark:border-gray-800">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center gap-8 md:gap-16">
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-3 text-xs font-semibold tracking-wider uppercase border-t transition-all ${
                  activeTab === 'posts'
                    ? 'border-black dark:border-white text-black dark:text-white -mt-px'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>▦</span> POSTS
                </span>
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`py-3 text-xs font-semibold tracking-wider uppercase border-t transition-all ${
                  activeTab === 'about'
                    ? 'border-black dark:border-white text-black dark:text-white -mt-px'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>ℹ</span> ABOUT
                </span>
              </button>
              <button
                onClick={() => setActiveTab('tagged')}
                className={`py-3 text-xs font-semibold tracking-wider uppercase border-t transition-all ${
                  activeTab === 'tagged'
                    ? 'border-black dark:border-white text-black dark:text-white -mt-px'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>👤</span> TAGGED
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Posts Tab - Instagram Grid */}
          {activeTab === 'posts' && (
            <div>
              {!feed || feed.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 border-2 border-black dark:border-white rounded-full flex items-center justify-center">
                    <span className="text-2xl">📷</span>
                  </div>
                  <h3 className="text-3xl font-light dark:text-white mb-2">No Posts Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {profile.isMe ? 'Share your first post!' : `${profile.username} hasn't posted yet.`}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    {feed.length} {feed.length === 1 ? 'post' : 'posts'}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                  {feed.map((post) => (
                    <div 
                      key={post._id}
                      className="aspect-square bg-gray-100 dark:bg-gray-800 relative group cursor-pointer overflow-hidden"
                      onClick={() => {
                        setSelectedPost(post);
                        setCurrentImageIndex(0);
                        setShowPostModal(true);
                      }}
                    >
                      {post.media && post.media.length > 0 && post.media[0].url ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={post.media[0].url} 
                            alt="Post"
                            className="w-full h-full object-cover"
                          />
                          {/* Multiple images indicator */}
                          {post.media.length > 1 && (
                            <div className="absolute top-3 right-3 bg-black/60 rounded-full p-1.5">
                              <span className="text-white text-sm">📷</span>
                            </div>
                          )}
                          {/* Video indicator */}
                          {post.media[0].type === 'video' && (
                            <div className="absolute top-3 right-3 bg-black/60 rounded-full p-1.5">
                              <span className="text-white text-sm">▶️</span>
                            </div>
                          )}
                        </>
                      ) : post.caption ? (
                        <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-6 text-center">{post.caption}</p>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                          <span className="text-4xl">📝</span>
                        </div>
                      )}
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
                        <div className="flex items-center gap-1">
                          <span className="text-xl">❤️</span>
                          <span className="font-semibold">{post.likes?.length || post.likesCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xl">💬</span>
                          <span className="font-semibold">{post.comments?.length || post.commentsCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </>
              )}
            </div>
          )}

          {/* About Tab - Comprehensive Profile Details */}
          {activeTab === 'about' && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                
                {/* Overview Section */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-2xl font-bold dark:text-white mb-4">About {profile.displayName || profile.username}</h2>
                  {profile.bio && (
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  )}
                </div>

                {/* Personal Information */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
                    <span>👤</span> Personal Information
                  </h3>
                  <div className="space-y-3">
                    {profile.displayName && (
                      <div className="flex items-start">
                        <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</span>
                        <span className="flex-1 text-sm dark:text-white">{profile.displayName}</span>
                      </div>
                    )}
                    {profile.username && (
                      <div className="flex items-start">
                        <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">Username</span>
                        <span className="flex-1 text-sm dark:text-white">@{profile.username}</span>
                      </div>
                    )}
                    {profile.gender && (
                      <div className="flex items-start">
                        <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">Gender</span>
                        <span className="flex-1 text-sm dark:text-white">{profile.gender}</span>
                      </div>
                    )}
                    {profile.pronouns && (
                      <div className="flex items-start">
                        <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">Pronouns</span>
                        <span className="flex-1 text-sm dark:text-white">{profile.pronouns}</span>
                      </div>
                    )}
                    {profile.birthday && (
                      <div className="flex items-start">
                        <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">Birthday</span>
                        <span className="flex-1 text-sm dark:text-white">
                          {new Date(profile.birthday).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    )}
                    {profile.relationshipStatus && (
                      <div className="flex items-start">
                        <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">Relationship</span>
                        <span className="flex-1 text-sm dark:text-white">{profile.relationshipStatus}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                {(profile.email || profile.phone || profile.website) && (
                  <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
                      <span>📞</span> Contact Information
                    </h3>
                    <div className="space-y-3">
                      {profile.email && (
                        <div className="flex items-start">
                          <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">Email</span>
                          <a 
                            href={`mailto:${profile.email}`} 
                            className="flex-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {profile.email}
                          </a>
                        </div>
                      )}
                      {profile.phone && (
                        <div className="flex items-start">
                          <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">Phone</span>
                          <a 
                            href={`tel:${profile.phone}`} 
                            className="flex-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {profile.phone}
                          </a>
                        </div>
                      )}
                      {profile.website && (
                        <div className="flex items-start">
                          <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">Website</span>
                          <a 
                            href={profile.website} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex-1 text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {profile.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Location Information */}
                {(profile.location || profile.currentCity || profile.hometown) && (
                  <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
                      <span>📍</span> Location
                    </h3>
                    <div className="space-y-3">
                      {profile.location && (
                        <div className="flex items-start">
                          <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">Location</span>
                          <span className="flex-1 text-sm dark:text-white">{profile.location}</span>
                        </div>
                      )}
                      {profile.currentCity && (
                        <div className="flex items-start">
                          <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">Current City</span>
                          <span className="flex-1 text-sm dark:text-white">{profile.currentCity}</span>
                        </div>
                      )}
                      {profile.hometown && (
                        <div className="flex items-start">
                          <span className="w-32 text-sm font-medium text-gray-500 dark:text-gray-400">Hometown</span>
                          <span className="flex-1 text-sm dark:text-white">{profile.hometown}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Interests & Languages */}
                {((profile.interests && profile.interests.length > 0) || (profile.languages && profile.languages.length > 0)) && (
                  <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
                      <span>✨</span> Interests & Languages
                    </h3>
                    <div className="space-y-4">
                      {profile.interests && profile.interests.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Interests</div>
                          <div className="flex flex-wrap gap-2">
                            {profile.interests.map((interest, i) => (
                              <span 
                                key={i}
                                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {profile.languages && profile.languages.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Languages</div>
                          <div className="flex flex-wrap gap-2">
                            {profile.languages.map((language, i) => (
                              <span 
                                key={i}
                                className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm font-medium"
                              >
                                {language}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Account Stats */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
                    <span>📊</span> Account Statistics
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="text-2xl font-bold dark:text-white">{profile.counts?.posts || 0}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Posts</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="text-2xl font-bold dark:text-white">{profile.counts?.followers || 0}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Followers</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="text-2xl font-bold dark:text-white">{profile.counts?.following || 0}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Following</div>
                    </div>
                  </div>
                  {profile.createdAt && (
                    <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Empty State if no information */}
              {!profile.bio && !profile.displayName && !profile.gender && !profile.pronouns && 
               !profile.birthday && !profile.relationshipStatus && !profile.email && 
               !profile.phone && !profile.website && !profile.location && 
               !profile.currentCity && !profile.hometown && 
               (!profile.interests || profile.interests.length === 0) && 
               (!profile.languages || profile.languages.length === 0) && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-2xl">ℹ️</span>
                  </div>
                  <h3 className="text-xl font-semibold dark:text-white mb-2">No Information Added</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {profile.isMe ? 'Add details to your profile to let others know more about you.' : `${profile.username} hasn't added any profile information yet.`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tagged Tab */}
          {activeTab === 'tagged' && (
            <div>
              {!tagged || tagged.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 border-2 border-black dark:border-white rounded-full flex items-center justify-center">
                    <span className="text-2xl">🏷️</span>
                  </div>
                  <h3 className="text-3xl font-light dark:text-white mb-2">No Tagged Posts</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Posts where {profile.username} is tagged will appear here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    {tagged.length} {tagged.length === 1 ? 'post' : 'posts'}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {tagged.map((post) => (
                      <div 
                        key={post._id}
                        className="aspect-square relative cursor-pointer group overflow-hidden bg-gray-100 dark:bg-gray-800"
                        onClick={() => {
                          setSelectedPost(post);
                          setCurrentImageIndex(0);
                          setShowPostModal(true);
                        }}
                      >
                        {/* Post Media */}
                        {post.media && post.media.length > 0 && post.media[0].type === 'image' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={post.media[0].url} 
                            alt="Tagged post"
                            className="w-full h-full object-cover"
                          />
                        ) : post.media && post.media.length > 0 && post.media[0].type === 'video' ? (
                          <div className="relative w-full h-full">
                            <video 
                              src={post.media[0].url}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 bg-black/60 rounded px-2 py-1">
                              <span className="text-white text-xs">▶️</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                            <span className="text-4xl">📝</span>
                          </div>
                        )}
                        
                        {/* Multiple images indicator */}
                        {post.media && post.media.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black/60 rounded px-2 py-1">
                            <span className="text-white text-xs">📷 {post.media.length}</span>
                          </div>
                        )}

                        {/* Tagged indicator */}
                        <div className="absolute top-2 left-2 bg-blue-600 rounded px-2 py-1">
                          <span className="text-white text-xs">🏷️ Tagged</span>
                        </div>

                        {/* Hover overlay with stats */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                          <div className="flex items-center gap-1 text-white font-semibold">
                            <span className="text-xl">❤️</span>
                            <span>{post.likes?.length || post.likesCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-white font-semibold">
                            <span className="text-xl">💬</span>
                            <span>{post.comments?.length || post.commentsCount || 0}</span>
                          </div>
                        </div>

                        {/* Post author info on hover */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-2">
                            {post.user?.profilePic ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={post.user.profilePic} 
                                alt={post.user.username}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                                {post.user?.username?.[0]?.toUpperCase() || '👤'}
                              </div>
                            )}
                            <span className="text-white text-xs font-medium">@{post.user?.username}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Friends Tab (kept for compatibility) */}
          {activeTab === 'friends' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold dark:text-white">Friends & Connections</h3>
                <span className="text-sm text-gray-400">{friends.length} friends</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="text-2xl font-bold dark:text-white">{followers.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Followers</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="text-2xl font-bold dark:text-white">{following.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Following</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="text-2xl font-bold dark:text-white">{friends.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Friends</div>
                </div>
              </div>

              {/* Friends Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {friends.length === 0 ? (
                  <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400">
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
                      className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group"
                    >
                      <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 mb-2 flex items-center justify-center text-white text-2xl font-bold group-hover:scale-105 transition-transform">
                        {friend.username?.[0]?.toUpperCase() || '👤'}
                      </div>
                      <div className="text-sm font-medium dark:text-white truncate text-center">{friend.username}</div>
                    </a>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-black dark:border-white rounded-full flex items-center justify-center">
                <span className="text-2xl">📷</span>
              </div>
              <h3 className="text-3xl font-light dark:text-white mb-2">No Photos</h3>
              <p className="text-gray-500 dark:text-gray-400">Photos will appear here.</p>
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-black dark:border-white rounded-full flex items-center justify-center">
                <span className="text-2xl">🎥</span>
              </div>
              <h3 className="text-3xl font-light dark:text-white mb-2">No Videos</h3>
              <p className="text-gray-500 dark:text-gray-400">Videos will appear here.</p>
            </div>
          )}
        </div>
      </main>

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
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
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
              Why are you reporting this profile?
            </p>
            
            <div className="space-y-2 mb-6">
              <button
                onClick={() => handleReportUser('spam')}
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg dark:text-white"
              >
                🚫 Spam or fake account
              </button>
              <button
                onClick={() => handleReportUser('harassment')}
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg dark:text-white"
              >
                😢 Harassment or bullying
              </button>
              <button
                onClick={() => handleReportUser('inappropriate')}
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg dark:text-white"
              >
                🔞 Inappropriate content
              </button>
              <button
                onClick={() => handleReportUser('hate-speech')}
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg dark:text-white"
              >
                ⚠️ Hate speech
              </button>
              <button
                onClick={() => handleReportUser('other')}
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg dark:text-white"
              >
                ❌ Something else
              </button>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && profile.isMe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold dark:text-white mb-6">Edit Profile</h3>
            
            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Display Name</label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Your display name"
                />
              </div>
              
              {/* Bio */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium dark:text-white">Bio</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAIBioGenerator(true);
                      handleGenerateAIBio();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <span className="text-sm">✨</span>
                    <span>AI Generate</span>
                  </button>
                </div>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Tell us about yourself"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {editForm.bio.length}/150 characters
                </p>
              </div>
              
              {/* Website */}
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Website</label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://yourwebsite.com"
                />
              </div>
              
              {/* Location */}
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="City, Country"
                />
              </div>
              
              {/* Birthday */}
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Birthday</label>
                <input
                  type="date"
                  value={editForm.birthday}
                  onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              {/* Gender */}
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Gender</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={saving}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditProfile}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Bio Generator Modal */}
      {showAIBioGenerator && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-xl">✨</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold dark:text-white">AI Bio Generator</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Powered by your posts and interests</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAIBioGenerator(false);
                  setAiSuggestions([]);
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <span className="text-xl dark:text-white">✕</span>
              </button>
            </div>

            {generatingBio ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin text-5xl mb-4">🤖</div>
                <h4 className="text-lg font-semibold dark:text-white mb-2">Analyzing your profile...</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Creating personalized bio suggestions based on your posts and interests
                </p>
                <div className="mt-6 flex justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            ) : aiSuggestions.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select a bio suggestion or use it as inspiration:
                </p>
                {aiSuggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className="group p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 transition-all cursor-pointer bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
                    onClick={() => {
                      setEditForm({ ...editForm, bio: suggestion });
                      setShowAIBioGenerator(false);
                      setAiSuggestions([]);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm dark:text-white leading-relaxed">{suggestion}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {suggestion.length} characters
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(suggestion);
                              alert('Copied to clipboard!');
                            }}
                            className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-purple-500 text-xl">→</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleGenerateAIBio()}
                    disabled={generatingBio}
                    className="flex-1 px-4 py-2.5 border border-purple-500 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors font-medium disabled:opacity-50"
                  >
                    🔄 Generate More
                  </button>
                  <button
                    onClick={() => {
                      setShowAIBioGenerator(false);
                      setAiSuggestions([]);
                    }}
                    className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🤔</div>
                <h4 className="text-lg font-semibold dark:text-white mb-2">No suggestions yet</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Click generate to create AI-powered bio suggestions
                </p>
                <button
                  onClick={() => handleGenerateAIBio()}
                  disabled={generatingBio}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  Generate Bio Suggestions
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {showPostModal && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => {
          setShowPostModal(false);
          setCurrentImageIndex(0);
        }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>
            {/* Left: Image/Media Section */}
            <div className="md:w-3/5 bg-black flex items-center justify-center relative">
              {selectedPost.media && selectedPost.media.length > 0 && selectedPost.media[currentImageIndex]?.url ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={selectedPost.media[currentImageIndex].url} 
                    alt="Post"
                    className="max-w-full max-h-[90vh] object-contain"
                  />
                  {/* Image counter */}
                  {selectedPost.media.length > 1 && (
                    <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {selectedPost.media.length}
                    </div>
                  )}
                  {/* Image navigation for multiple images */}
                  {selectedPost.media.length > 1 && (
                    <>
                      {currentImageIndex > 0 && (
                        <button 
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(currentImageIndex - 1);
                          }}
                        >
                          ←
                        </button>
                      )}
                      {currentImageIndex < selectedPost.media.length - 1 && (
                        <button 
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(currentImageIndex + 1);
                          }}
                        >
                          →
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <span className="text-6xl">📝</span>
                </div>
              )}
              {/* Close button */}
              <button
                onClick={() => setShowPostModal(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors z-10"
              >
                ✕
              </button>
            </div>

            {/* Right: Post Details Section */}
            <div className="md:w-2/5 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
                {selectedPost.user?.profilePic ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={selectedPost.user.profilePic} 
                    alt={selectedPost.user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {selectedPost.user?.username?.[0]?.toUpperCase() || '👤'}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold dark:text-white">{selectedPost.user?.username || 'User'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(selectedPost.createdAt)}</div>
                </div>
                {/* Options Menu - Only show for post owner */}
                {currentUser && selectedPost.user?._id === currentUser._id && (
                  <div className="relative">
                    <button 
                      onClick={() => setShowPostOptions(!showPostOptions)}
                      className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      ⋯
                    </button>
                    {showPostOptions && (
                      <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[150px] z-50">
                        <button
                          onClick={() => {
                            setShowPostOptions(false);
                            setEditPostCaption(selectedPost.caption || '');
                            setShowEditPostModal(true);
                          }}
                          className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold border-b border-gray-200 dark:border-gray-700"
                        >
                          Edit Post
                        </button>
                        <button
                          onClick={() => {
                            setShowPostOptions(false);
                            handleArchivePost(selectedPost._id, selectedPost.archived);
                          }}
                          className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold border-b border-gray-200 dark:border-gray-700"
                        >
                          {selectedPost.archived ? 'Unarchive Post' : 'Archive Post'}
                        </button>
                        <button
                          onClick={() => {
                            setShowPostOptions(false);
                            setShowDeleteConfirm(true);
                          }}
                          className="w-full px-4 py-3 text-left text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold"
                        >
                          Delete Post
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Caption */}
              {selectedPost.caption && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <p className="dark:text-white whitespace-pre-wrap">{selectedPost.caption}</p>
                </div>
              )}

              {/* Comments Section - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedPost.comments && selectedPost.comments.length > 0 ? (
                  selectedPost.comments.map((comment, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {comment.user?.username?.[0]?.toUpperCase() || '👤'}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-semibold dark:text-white">{comment.user?.username || 'User'}</span>
                          <span className="ml-2 dark:text-gray-300">{comment.text}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeAgo(comment.createdAt)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <div className="text-4xl mb-2">💬</div>
                    <div className="text-sm">No comments yet</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center gap-4 mb-3">
                  <button 
                    onClick={() => handleLikePost(selectedPost._id)}
                    className="hover:opacity-70 transition-opacity"
                  >
                    <span className="text-2xl">{selectedPost.liked ? '❤️' : '🤍'}</span>
                  </button>
                  <button className="hover:opacity-70 transition-opacity">
                    <span className="text-2xl">💬</span>
                  </button>
                  <button className="hover:opacity-70 transition-opacity">
                    <span className="text-2xl">📤</span>
                  </button>
                  <button className="ml-auto hover:opacity-70 transition-opacity">
                    <span className="text-2xl">🔖</span>
                  </button>
                </div>
                <div className="text-sm font-semibold dark:text-white mb-2">
                  {selectedPost.likes?.length || selectedPost.likesCount || 0} likes
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(selectedPost.createdAt)}
                </div>
              </div>

              {/* Comment Input */}
              <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent border-none outline-none dark:text-white placeholder-gray-400"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        handleAddComment(selectedPost._id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button 
                    onClick={(e) => {
                      const input = e.target.previousElementSibling;
                      if (input && input.value.trim()) {
                        handleAddComment(selectedPost._id, input.value);
                        input.value = '';
                      }
                    }}
                    className="text-blue-500 font-semibold text-sm hover:text-blue-600 transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditPostModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="mb-6">
              <h3 className="text-xl font-bold dark:text-white mb-2">Edit Post</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Update your post caption
              </p>
            </div>
            <div className="mb-6">
              <textarea
                value={editPostCaption}
                onChange={(e) => setEditPostCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {editPostCaption.length} characters
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditPostModal(false);
                  setEditPostCaption('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEditPost(selectedPost._id)}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold dark:text-white">Archive</h3>
              <button
                onClick={() => setShowArchiveModal(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <span className="text-2xl dark:text-white">✕</span>
              </button>
            </div>

            {loadingArchive ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-600 dark:text-gray-400">Loading archived posts...</p>
              </div>
            ) : archivedPosts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-4xl">📦</span>
                </div>
                <h3 className="text-xl font-semibold dark:text-white mb-2">No Archived Posts</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Posts you archive will appear here
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {archivedPosts.length} {archivedPosts.length === 1 ? 'post' : 'posts'} archived
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {archivedPosts.map((post) => (
                    <div 
                      key={post._id}
                      className="aspect-square relative cursor-pointer group overflow-hidden bg-gray-100 dark:bg-gray-800"
                      onClick={() => {
                        setSelectedPost(post);
                        setCurrentImageIndex(0);
                        setShowPostModal(true);
                        setShowArchiveModal(false);
                      }}
                    >
                      {/* Post Media */}
                      {post.media && post.media.length > 0 && post.media[0].type === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={post.media[0].url} 
                          alt="Archived post"
                          className="w-full h-full object-cover"
                        />
                      ) : post.media && post.media.length > 0 && post.media[0].type === 'video' ? (
                        <div className="relative w-full h-full">
                          <video 
                            src={post.media[0].url}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-black/60 rounded px-2 py-1">
                            <span className="text-white text-xs">▶️</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                          <span className="text-4xl">📝</span>
                        </div>
                      )}
                      
                      {/* Multiple images indicator */}
                      {post.media && post.media.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black/60 rounded px-2 py-1">
                          <span className="text-white text-xs">📷 {post.media.length}</span>
                        </div>
                      )}

                      {/* Hover overlay with stats */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                        <div className="flex items-center gap-1 text-white font-semibold">
                          <span className="text-xl">❤️</span>
                          <span>{post.likes?.length || post.likesCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-white font-semibold">
                          <span className="text-xl">💬</span>
                          <span>{post.comments?.length || post.commentsCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold dark:text-white mb-2">Delete Post?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePost(selectedPost._id)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

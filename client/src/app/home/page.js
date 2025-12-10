"use client";
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { apiGet, apiPost } from '@/lib/api';
import { apiDelete } from '@/lib/api';
import { uploadImageToCloudinary } from '@/lib/upload';
import { API_BASE, authHeaders } from '@/lib/api';
import Navbar, { Icon } from '@/components/Navbar';
import ShareModal from '@/components/ShareModal';

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

function Avatar({ name, src }) {
  const initials = useMemo(() => (name ? name[0]?.toUpperCase() : 'A'), [name]);
  const [imageError, setImageError] = useState(false);
  
  if (src && !imageError) {
    return (
      <div className="relative h-9 w-9 rounded-full ring-2 ring-gray-100 dark:ring-gray-800 overflow-hidden">
        <Image 
          src={src} 
          alt={name || 'User'} 
          fill
          className="object-cover"
          sizes="36px"
          onError={() => setImageError(true)}
          unoptimized={src?.includes('googleusercontent.com')}
        />
      </div>
    );
  }
  
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-fuchsia-500 text-white text-sm font-semibold ring-2 ring-gray-100 dark:ring-gray-800">
      {initials}
    </div>
  );
}

function UserCard() {
  const [me, setMe] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const { user } = await apiGet('/api/users/me');
        setMe(user);
      } catch {}
    })();
  }, []);
  if (!me) return (
    <div className="flex items-center gap-3">
      <Avatar name="you" />
      <div className="leading-tight">
        <div className="text-sm font-semibold text-black dark:text-white">you</div>
        <div className="text-xs text-black dark:text-white">Signed in</div>
      </div>
    </div>
  );
  return (
    <Link href={`/u/${me.username}`} className="flex items-center gap-3">
      <Avatar name={me.username} src={me.profilePic} />
      <div className="leading-tight">
        <div className="text-sm font-semibold text-black dark:text-white">{me.username}</div>
        <div className="text-xs text-black dark:text-white">View profile</div>
      </div>
      <div className="ml-auto text-xs font-semibold text-sky-600">Open</div>
    </Link>
  );
}

function Post({ item, onLike, onDelete, onShare, onUpdate }) {
  const media = item.media?.[0];
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(item.caption || '');

  async function loadComments() {
    // Toggle comments visibility
    if (showComments) {
      setShowComments(false);
      return;
    }
    
    // Load comments if not already loaded or if we need to refresh
    try {
      const { comments: list } = await apiGet(`/api/posts/${item._id}/comments?limit=5`);
      setComments(list);
      setShowComments(true);
    } catch {}
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    const { comment: c } = await apiPost(`/api/posts/${item._id}/comments`, { content: comment.trim() });
    setComments((prev) => [c, ...prev]);
    setComment('');
  }

  async function handleLikeComment(commentId) {
    try {
      const comment = comments.find(c => c._id === commentId);
      if (!comment) return;

      if (comment.didLike) {
        await apiDelete(`/api/posts/${item._id}/comments/${commentId}/like`);
        setComments(prev => prev.map(c => 
          c._id === commentId 
            ? { ...c, didLike: false, likesCount: (c.likesCount || 1) - 1 }
            : c
        ));
      } else {
        await apiPost(`/api/posts/${item._id}/comments/${commentId}/like`, {});
        setComments(prev => prev.map(c => 
          c._id === commentId 
            ? { ...c, didLike: true, likesCount: (c.likesCount || 0) + 1 }
            : c
        ));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  }

  async function handleReply(e, commentId) {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const { comment: reply } = await apiPost(`/api/posts/${item._id}/comments/${commentId}/reply`, { 
        content: replyText.trim() 
      });
      
      // Update replies count
      setComments(prev => prev.map(c => 
        c._id === commentId 
          ? { ...c, repliesCount: (c.repliesCount || 0) + 1 }
          : c
      ));
      
      setReplyText('');
      setReplyingTo(null);
      
      // Auto-load replies for this comment
      loadReplies(commentId);
    } catch (error) {
      console.error('Error replying to comment:', error);
    }
  }

  async function loadReplies(commentId) {
    try {
      const { replies } = await apiGet(`/api/posts/${item._id}/comments/${commentId}/replies?limit=10`);
      setShowReplies(prev => ({ ...prev, [commentId]: replies }));
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  }

  function toggleReplies(commentId) {
    if (showReplies[commentId]) {
      setShowReplies(prev => {
        const newState = { ...prev };
        delete newState[commentId];
        return newState;
      });
    } else {
      loadReplies(commentId);
    }
  }

  async function handleSharePost(caption) {
    try {
      await apiPost(`/api/posts/${item._id}/share`, { caption });
      // Optionally call onShare callback to refresh feed
      if (onShare) {
        onShare(item._id);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  }

  async function handleSaveEdit() {
    try {
      const response = await fetch(`${API_BASE}/api/posts/${item._id}`, {
        method: 'PATCH',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ caption: editedCaption.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      const { post } = await response.json();
      
      // Update the post in the parent component
      if (onUpdate) {
        onUpdate(post);
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    }
  }

  function handleEditClick() {
    setEditedCaption(item.caption || '');
    setIsEditing(true);
    setMenuOpen(false);
  }

  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef(null);
  useEffect(() => {
    function onDocClick(e) {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <article className="mb-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Avatar name={item.user?.username || 'U'} src={item.user?.profilePic} />
          <div>
            <div className="text-sm font-bold text-black dark:text-white">
              {item.user?.username ? (
                <Link href={`/u/${item.user.username}`} className="hover:text-blue-500 transition">
                  {item.user.username}
                </Link>
              ) : 'user'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(item.createdAt)}</div>
          </div>
        </div>
        <div className="relative" ref={menuWrapRef}>
          <button aria-label="More" onClick={() => setMenuOpen((v) => !v)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition">
            <Icon name="more" className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 shadow-lg">
              {item.canDelete && (
                <>
                  <button
                    onClick={handleEditClick}
                    className="block w-full px-4 py-3 text-left text-sm font-medium text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    ✏️ {item.caption ? 'Edit caption' : 'Add caption'}
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(item); }}
                    className="block w-full px-4 py-3 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    🗑️ Delete post
                  </button>
                </>
              )}
              {!item.canDelete && (
                <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">More options soon</div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Caption */}
      {isEditing ? (
        <div className="px-6 pt-4 pb-3 space-y-3">
          <textarea
            value={editedCaption}
            onChange={(e) => setEditedCaption(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
            placeholder={item.caption ? "Edit your caption..." : "Add a caption to your post..."}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition"
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedCaption(item.caption || '');
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-white text-sm font-semibold rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        item.caption && (
          <div className="px-6 pt-4 pb-3 text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
            {item.caption}
          </div>
        )
      )}

      {/* Shared Post Preview */}
      {item.sharedFrom && (
        <div className="mx-6 mb-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50">
          {/* Original Post Header */}
          <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
            <Avatar 
              name={item.sharedFrom.user?.username || 'U'} 
              src={item.sharedFrom.user?.profilePic} 
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-black dark:text-white">
                {item.sharedFrom.user?.username || 'User'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Original post
              </div>
            </div>
            <Icon name="share" className="h-4 w-4 text-gray-400" />
          </div>
          
          {/* Original Post Caption */}
          {item.sharedFrom.caption && (
            <div className="px-3 pt-2 pb-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
              {item.sharedFrom.caption}
            </div>
          )}
          
          {/* Original Post Media */}
          {item.sharedFrom.media?.[0] && (
            <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={item.sharedFrom.media[0].url} 
                alt="" 
                className="w-full object-cover max-h-[300px]" 
              />
            </div>
          )}
        </div>
      )}

      {/* Media (for non-shared posts) */}
      {!item.sharedFrom && media && (
        <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={media.url} alt="" className="w-full object-cover max-h-[500px]" />
        </div>
      )}

      {/* Actions Bar */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button 
              aria-label="Like" 
              onClick={() => onLike(item)}
              className={`p-2 rounded-full transition-all transform hover:scale-110 ${
                item.didLike 
                  ? 'text-red-500 dark:text-red-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon name="heart" className="h-5 w-5" filled={item.didLike} />
            </button>
            <button 
              aria-label="Comment" 
              onClick={loadComments}
              className={`p-2 rounded-full transition-all transform hover:scale-110 ${
                showComments 
                  ? 'text-blue-500 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon name="comment" className="h-5 w-5" filled={showComments} />
            </button>
            <button 
              aria-label="Share" 
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <Icon name="send" className="h-5 w-5" />
            </button>
          </div>
          <button aria-label="Save" className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <Icon name="bookmark" className="h-5 w-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="text-sm font-semibold text-black dark:text-white mb-2">
          {(item.likes || 0).toLocaleString()} <span className="font-normal text-gray-600 dark:text-gray-400">likes</span>
        </div>
        {item.commentsCount > 0 && (
          <button 
            className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition" 
            onClick={loadComments}
          >
            {showComments ? 'Hide comments' : `View all ${item.commentsCount} comments →`}
          </button>
        )}

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
            <form onSubmit={handleComment} className="flex items-center gap-2">
              <input 
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                placeholder="Add a comment..." 
                className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 text-sm text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-full text-sm transition">
                Post
              </button>
            </form>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {comments.map((c) => (
                <div key={c._id} className="space-y-2">
                  <div className="flex items-start gap-2 text-sm p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <div className="flex-shrink-0 mt-0.5">
                      {c.user?.profilePic ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.user.profilePic}
                          alt={c.user.username || 'User'}
                          className="h-6 w-6 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-sky-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-semibold ring-1 ring-gray-200 dark:ring-gray-700">
                          {c.user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div>
                        <span className="font-semibold text-black dark:text-white">
                          {c.user?.username ? (
                            <Link href={`/u/${c.user.username}`} className="hover:text-blue-500 transition">{c.user.username}</Link>
                          ) : 'user'}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300"> {c.content}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <button
                          onClick={() => handleLikeComment(c._id)}
                          className={`text-xs font-semibold transition ${
                            c.didLike 
                              ? 'text-red-500 dark:text-red-400' 
                              : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                          }`}
                        >
                          {c.didLike ? 'Liked' : 'Like'} {c.likesCount > 0 && `(${c.likesCount})`}
                        </button>
                        <button
                          onClick={() => setReplyingTo(replyingTo === c._id ? null : c._id)}
                          className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-500 transition"
                        >
                          Reply
                        </button>
                        {c.repliesCount > 0 && (
                          <button
                            onClick={() => toggleReplies(c._id)}
                            className="text-xs font-semibold text-blue-500 dark:text-blue-400 hover:text-blue-600 transition"
                          >
                            {showReplies[c._id] ? 'Hide' : 'View'} {c.repliesCount} {c.repliesCount === 1 ? 'reply' : 'replies'}
                          </button>
                        )}
                      </div>
                      
                      {/* Reply Form */}
                      {replyingTo === c._id && (
                        <form onSubmit={(e) => handleReply(e, c._id)} className="flex items-center gap-2 mt-2">
                          <input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Reply to ${c.user?.username}...`}
                            className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5 text-xs text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button 
                            type="submit"
                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-full text-xs transition"
                          >
                            Reply
                          </button>
                        </form>
                      )}

                      {/* Replies */}
                      {showReplies[c._id] && (
                        <div className="ml-4 mt-2 space-y-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          {showReplies[c._id].map((reply) => (
                            <div key={reply._id} className="flex items-start gap-2 text-sm">
                              <div className="flex-shrink-0 mt-0.5">
                                {reply.user?.profilePic ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={reply.user.profilePic}
                                    alt={reply.user.username || 'User'}
                                    className="h-5 w-5 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                                  />
                                ) : (
                                  <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-sky-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-semibold ring-1 ring-gray-200 dark:ring-gray-700">
                                    {reply.user?.username?.[0]?.toUpperCase() || 'U'}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div>
                                  <span className="font-semibold text-black dark:text-white text-xs">
                                    {reply.user?.username ? (
                                      <Link href={`/u/${reply.user.username}`} className="hover:text-blue-500 transition">
                                        {reply.user.username}
                                      </Link>
                                    ) : 'user'}
                                  </span>
                                  <span className="text-gray-700 dark:text-gray-300 text-xs"> {reply.content}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={item}
        onShare={handleSharePost}
      />
    </article>
  );
}

export default function HomeFeed() {
  const router = useRouter();
  const [feed, setFeed] = useState([]);
  const captionRef = useRef(null);
  const imageUrlRef = useRef(null);
  const [posting, setPosting] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [storyGroups, setStoryGroups] = useState([]);
  const storyFileRef = useRef(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerGroupIndex, setViewerGroupIndex] = useState(0);
  const [viewerStoryIndex, setViewerStoryIndex] = useState(0);
  const uploadBtnRef = useRef(null);
  const aiBtnRef = useRef(null);
  const [uploadPos, setUploadPos] = useState({ top: 0, left: 0 });
  const [aiPos, setAiPos] = useState({ top: 0, left: 0 });
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [aiCaptionOpen, setAiCaptionOpen] = useState(false);
  const [aiCaptionLoading, setAiCaptionLoading] = useState(false);
  const [aiCaptions, setAiCaptions] = useState([]);
  const [selectedCaption, setSelectedCaption] = useState(null);
  const [modifyPromptOpen, setModifyPromptOpen] = useState(false);
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [modifyPromptLoading, setModifyPromptLoading] = useState(false);
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [hashtagsOpen, setHashtagsOpen] = useState(false);
  const [hashtagsLoading, setHashtagsLoading] = useState(false);
  const [generatedHashtags, setGeneratedHashtags] = useState(null);
  const [captionMood, setCaptionMood] = useState('default');
  const [captionPopoverPos, setCaptionPopoverPos] = useState({ top: 0, left: 0 });
  const [hashtagPopoverPos, setHashtagPopoverPos] = useState({ top: 0, left: 0 });

  async function loadFeed() {
    try {
      const { posts } = await apiGet('/api/posts/feed?limit=20');
      setFeed(posts);
    } catch {}
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setError('No file selected');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image size must be less than 10MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Step 1: Create local preview immediately
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Step 2: Upload to Cloudinary
      console.log('Starting upload for:', file.name, 'Size:', file.size);
      const uploaded = await uploadImageToCloudinary(file, 'aisocial');
      
      console.log('Upload successful:', uploaded.url);
      
      // Step 3: Set the permanent URL in the hidden input
      if (imageUrlRef.current) {
        imageUrlRef.current.value = uploaded.url;
      }
      
      // Step 4: Update preview to permanent URL
      setPreviewUrl(uploaded.url);
      
      // Show success feedback
      console.log('Image ready for posting or AI tools');
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Upload failed: ${err.message}`);
      setPreviewUrl(''); // Clear preview on error
      if (imageUrlRef.current) {
        imageUrlRef.current.value = '';
      }
    } finally {
      setUploading(false);
    }
  }

  async function generateAiCaption(mood = 'default') {
    setAiCaptionLoading(true);
    setError('');
    setCaptionMood(mood);
    try {
      const imageUrl = imageUrlRef.current?.value;
      const localPreview = previewUrl;

      if (!imageUrl && !localPreview) {
        setError('Please upload an image first to generate a caption');
        setAiCaptionLoading(false);
        return;
      }

      let imageData = imageUrl;

      // If it's a local blob URL, convert to base64
      if (localPreview && localPreview.startsWith('blob:')) {
        try {
          const response = await fetch(localPreview);
          const blob = await response.blob();
          const reader = new FileReader();
          
          await new Promise((resolve, reject) => {
            reader.onload = () => {
              imageData = reader.result; // This is base64 data URL
              resolve();
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.error('Error converting image to base64:', err);
          setError('Failed to process local image');
          setAiCaptionLoading(false);
          return;
        }
      }

      // Call backend API to generate caption using Gemini
      const response = await apiPost('/api/ai/generate-caption', {
        imageUrl: imageData, // Can be URL or base64 data URL
        mood: mood // Include mood preference
      });

      if (response.captions && Array.isArray(response.captions)) {
        setAiCaptions(response.captions);
        setAiCaptionOpen(true);
        
        // Position popover ABOVE AI Tools button
        if (aiBtnRef.current) {
          const rect = aiBtnRef.current.getBoundingClientRect();
          setCaptionPopoverPos({
            top: rect.top + window.scrollY - 380, // Positioned above with space for popover
            left: Math.max(10, rect.left + window.scrollX - 150) // Center it roughly
          });
        }
      } else {
        setError('Failed to generate captions');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate AI caption');
      console.error('AI Caption Error:', err);
    } finally {
      setAiCaptionLoading(false);
    }
  }

  async function analyzeImageQuality() {
    setAnalyzeLoading(true);
    setError('');
    try {
      const imageUrl = imageUrlRef.current?.value;
      const localPreview = previewUrl;

      if (!imageUrl && !localPreview) {
        setError('Please upload an image first to analyze');
        setAnalyzeLoading(false);
        return;
      }

      let imageData = imageUrl;

      if (localPreview && localPreview.startsWith('blob:')) {
        try {
          const response = await fetch(localPreview);
          const blob = await response.blob();
          const reader = new FileReader();
          
          await new Promise((resolve, reject) => {
            reader.onload = () => {
              imageData = reader.result;
              resolve();
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.error('Error converting image to base64:', err);
          setError('Failed to process local image');
          setAnalyzeLoading(false);
          return;
        }
      }

      const response = await apiPost('/api/ai/analyze-image', {
        imageUrl: imageData
      });

      setImageAnalysis(response.analysis);
      setAnalyzeOpen(true);
    } catch (err) {
      setError(err.message || 'Failed to analyze image');
      console.error('Image Analysis Error:', err);
    } finally {
      setAnalyzeLoading(false);
    }
  }

  async function generateHashtagsForImage() {
    setHashtagsLoading(true);
    setError('');
    try {
      const imageUrl = imageUrlRef.current?.value;
      const localPreview = previewUrl;
      const caption = captionRef.current?.value || '';

      if (!imageUrl && !localPreview) {
        setError('Please upload an image first to generate hashtags');
        setHashtagsLoading(false);
        return;
      }

      let imageData = imageUrl;

      if (localPreview && localPreview.startsWith('blob:')) {
        try {
          const response = await fetch(localPreview);
          const blob = await response.blob();
          const reader = new FileReader();
          
          await new Promise((resolve, reject) => {
            reader.onload = () => {
              imageData = reader.result;
              resolve();
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.error('Error converting image to base64:', err);
          setError('Failed to process local image');
          setHashtagsLoading(false);
          return;
        }
      }

      const response = await apiPost('/api/ai/generate-hashtags', {
        imageUrl: imageData,
        caption: caption
      });

      setGeneratedHashtags(response);
      setHashtagsOpen(true);
      
      // Position popover above AI Tools button
      if (aiBtnRef.current) {
        const rect = aiBtnRef.current.getBoundingClientRect();
        setHashtagPopoverPos({
          top: rect.top + window.scrollY - 380, // Positioned above with space for popover
          left: Math.max(10, rect.left + window.scrollX - 150) // Center it roughly
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to generate hashtags');
      console.error('Hashtag Generation Error:', err);
    } finally {
      setHashtagsLoading(false);
    }
  }

  useEffect(() => {
    // Check authentication
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      console.log('❌ No token found, redirecting to login');
      router.push('/login');
      return;
    }
    
    console.log('✅ Token found, loading home page');
    setAuthed(true);
    loadFeed();
    (async () => {
      try {
        const { groups } = await apiGet('/api/stories/feed');
        setStoryGroups(groups);
      } catch {}
    })();
  }, [router]);
  const nextStory = useCallback(() => {
    const g = storyGroups[viewerGroupIndex];
    if (!g) return;
    if (viewerStoryIndex + 1 < (g.stories?.length || 0)) {
      setViewerStoryIndex((i) => i + 1);
      return;
    }
    // move to next group
    if (viewerGroupIndex + 1 < storyGroups.length) {
      setViewerGroupIndex((gi) => gi + 1);
      setViewerStoryIndex(0);
    } else {
      setViewerOpen(false);
    }
  }, [viewerGroupIndex, viewerStoryIndex, storyGroups]);

  const prevStory = useCallback(() => {
    const g = storyGroups[viewerGroupIndex];
    if (!g) return;
    if (viewerStoryIndex > 0) {
      setViewerStoryIndex((i) => i - 1);
      return;
    }
    if (viewerGroupIndex > 0) {
      const prevGroupIndex = viewerGroupIndex - 1;
      const prevStories = storyGroups[prevGroupIndex]?.stories || [];
      setViewerGroupIndex(prevGroupIndex);
      setViewerStoryIndex(Math.max(0, prevStories.length - 1));
    } else {
      setViewerOpen(false);
    }
  }, [viewerGroupIndex, viewerStoryIndex, storyGroups]);

  // Keyboard controls for the story viewer
  useEffect(() => {
    function onKey(e) {
      if (!viewerOpen) return;
      if (e.key === 'Escape') setViewerOpen(false);
      if (e.key === 'ArrowRight') nextStory();
      if (e.key === 'ArrowLeft') prevStory();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [viewerOpen, nextStory, prevStory]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest('.composer-dropdown')) {
        setUploadMenuOpen(false);
        setAiMenuOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  function openViewer(index) {
    setViewerGroupIndex(index);
    setViewerStoryIndex(0);
    setViewerOpen(true);
  }

  async function submitPost(e) {
    e.preventDefault();
    const caption = (captionRef.current?.value || '').trim();
    const imageUrl = (imageUrlRef.current?.value || '').trim();
    
    // Validate input
    if (!caption && !imageUrl) {
      setError('Please add a caption or upload an image');
      return;
    }
    
    setPosting(true);
    setError('');
    
    try {
      const payload = { caption: caption || undefined };
      if (imageUrl) payload.media = [{ url: imageUrl }];
      
      const { post } = await apiPost('/api/posts', payload);
      setFeed((prev) => [post, ...prev]);
      
      // Clear form
      if (captionRef.current) captionRef.current.value = '';
      if (imageUrlRef.current) imageUrlRef.current.value = '';
      setPreviewUrl('');
      setSelectedCaption(null);
    } catch (e) {
      setError(e.message || 'Failed to post');
      console.error('Post error:', e);
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(item) {
    try {
      if (item.didLike) {
        const { likes } = await apiPost(`/api/posts/${item._id}/unlike`);
        setFeed((prev) => prev.map((p) => (p._id === item._id ? { ...p, didLike: false, likes } : p)));
      } else {
        const { likes } = await apiPost(`/api/posts/${item._id}/like`);
        setFeed((prev) => prev.map((p) => (p._id === item._id ? { ...p, didLike: true, likes } : p)));
      }
    } catch {}
  }
  async function handleDelete(item) {
    try {
      if (!confirm('Delete this post?')) return;
      await apiDelete(`/api/posts/${item._id}`);
      setFeed((prev) => prev.filter((p) => p._id !== item._id));
    } catch (e) {
      setError(e.message || 'Failed to delete');
    }
  }

  async function handleShare() {
    // Refresh feed to show newly shared post
    try {
      const { posts } = await apiGet('/api/posts/feed?limit=20');
      setFeed(posts);
    } catch (e) {
      console.error('Failed to refresh feed:', e);
    }
  }

  function handleUpdate(updatedPost) {
    // Update the post in the feed with the edited version
    setFeed((prev) => prev.map((p) => (p._id === updatedPost._id ? { ...p, caption: updatedPost.caption } : p)));
  }

  const [suggestions, setSuggestions] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  
  useEffect(() => {
    (async () => {
      try {
        const { users } = await apiGet('/api/users/suggestions?type=mutual');
        setSuggestions(users.map(u => ({ id: u._id || u.id, name: u.username, profilePic: u.profilePic, mutualCount: u.mutualCount })));
      } catch {}
    })();
  }, []);

  async function follow(id) {
    try {
      // Add to loading set
      setFollowingIds(prev => new Set([...prev, id]));
      
      await apiPost(`/api/users/${id}/follow`);
      
      // Remove from suggestions with a slight delay for better UX
      setTimeout(() => {
        setSuggestions(prev => prev.filter(s => s.id !== id));
        setFollowingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 300);
    } catch (error) {
      // Remove from loading set on error
      setFollowingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      console.error('Failed to follow user:', error);
    }
  }

  // Show loading while checking authentication
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Loading...</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Checking authentication</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="flex">
        {/* Left Navbar */}
        <Navbar />
        
        {/* Main Content */}
        <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 md:px-6 flex-1 pt-[72px] md:pt-6">
          {/* Feed */}
          <main className="mx-auto w-full max-w-[640px]">
          {/* Stories */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex gap-3 overflow-x-auto p-4 scrollbar-hide">
              {/* Add story */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <label className="relative h-20 w-20 cursor-pointer group">
                  <div className="h-20 w-20 rounded-full border-3 border-blue-500 p-1 group-hover:ring-4 group-hover:ring-blue-200 dark:group-hover:ring-blue-900 transition">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white text-2xl font-bold hover:shadow-lg transition">
                      +
                    </div>
                  </div>
                  <input ref={storyFileRef} type="file" accept="image/*" className="absolute inset-0 z-10 opacity-0" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setError('');
                    setUploading(true);
                    try {
                      const uploaded = await uploadImageToCloudinary(file, 'aisocial/stories');
                      await apiPost('/api/stories', { url: uploaded.url, width: uploaded.width, height: uploaded.height, format: uploaded.format, type: 'image' });
                      const { groups } = await apiGet('/api/stories/feed');
                      setStoryGroups(groups);
                    } catch (err) {
                      setError(err.message || 'Failed to add story');
                    } finally {
                      setUploading(false);
                      if (storyFileRef.current) storyFileRef.current.value = '';
                    }
                  }} />
                </label>
                <div className="w-20 truncate text-xs font-medium leading-tight text-center text-gray-600 dark:text-gray-400">Your story</div>
              </div>

              {/* Active stories */}
              {storyGroups.map((g, idx) => (
                <button key={g.user._id} onClick={() => openViewer(idx)} className="flex flex-col items-center gap-2 flex-shrink-0 group">
                  <div className="h-20 w-20 rounded-full border-3 border-pink-500 p-1 group-hover:ring-4 group-hover:ring-pink-200 dark:group-hover:ring-pink-900 overflow-hidden transition">
                    {g.stories?.[0]?.media?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.stories[0].media.url} alt="story" className="h-full w-full rounded-full object-cover group-hover:scale-110 transition" />
                    ) : (
                      <div className="h-full w-full rounded-full bg-gradient-to-tr from-cyan-500 to-pink-500" />
                    )}
                  </div>
                  <div className="w-20 truncate text-xs font-medium leading-tight text-center text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition">{g.user.username}</div>
                </button>
              ))}
            </div>
          </div>
          {/* Story viewer modal */}
          {viewerOpen && (() => {
            const group = storyGroups[viewerGroupIndex];
            const story = group?.stories?.[viewerStoryIndex];
            const mediaUrl = story?.media?.url;
            return (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4">
                <div className="relative w-full max-w-2xl">
                  <div className="mb-2 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 overflow-hidden rounded-full bg-white/20">
                        {group?.user?.profilePic && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={group.user.profilePic} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="text-sm font-semibold">{group?.user?.username}</div>
                    </div>
                    <button onClick={() => setViewerOpen(false)} className="rounded px-2 py-1 text-sm text-white/80 hover:text-white">Close</button>
                  </div>
                  <div className="relative overflow-hidden rounded-md bg-black">
                    {mediaUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl} alt="story" className="mx-auto max-h-[70vh] w-auto" />
                    )}
                    <button onClick={prevStory} className="absolute left-2 top-1/2 -translate-y-1/2 rounded bg-white/10 px-3 py-2 text-white hover:bg-white/20">‹</button>
                    <button onClick={nextStory} className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-white/10 px-3 py-2 text-white hover:bg-white/20">›</button>
                  </div>
                  {/* Reactions bar */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-2">
                      {['❤️','😂','🔥','👍','👏','😮','😢','😡'].map((emo) => (
                        <button
                          key={emo}
                          onClick={async () => {
                            try {
                              await apiPost(`/api/stories/${story._id}/react`, { type: emo });
                              // update current story myReaction locally
                              setStoryGroups((prev) => {
                                const clone = [...prev];
                                const g = clone[viewerGroupIndex];
                                if (g && g.stories[viewerStoryIndex]) {
                                  g.stories[viewerStoryIndex].myReaction = emo;
                                }
                                return clone;
                              });
                            } catch (e) {}
                          }}
                          className={`rounded px-2 py-1 text-xl ${story?.myReaction === emo ? 'ring-2 ring-white/60' : ''}`}
                        >
                          {emo}
                        </button>
                      ))}
                    </div>
                    {story?.myReaction ? (
                      <button
                        onClick={async () => {
                          try {
                            await fetch(`${API_BASE}/api/stories/${story._id}/react`, { method: 'DELETE', headers: { ...authHeaders() } });
                            setStoryGroups((prev) => {
                              const clone = [...prev];
                              const g = clone[viewerGroupIndex];
                              if (g && g.stories[viewerStoryIndex]) {
                                g.stories[viewerStoryIndex].myReaction = null;
                              }
                              return clone;
                            });
                          } catch (e) {}
                        }}
                        className="rounded px-3 py-1 text-sm text-white/80 hover:text-white"
                      >
                        Remove reaction
                      </button>
                    ) : <div />}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {(group?.stories || []).map((s, i) => (
                      <div key={s._id} className={`h-1 flex-1 rounded ${i <= viewerStoryIndex ? 'bg-white' : 'bg-white/30'}`} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
          {/* Composer */}
          <form onSubmit={submitPost} className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-6 py-5">
              <textarea 
                ref={captionRef} 
                placeholder="What's on your mind?" 
                rows={3} 
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
              />
              
              {previewUrl && (
                <div className="mt-4 relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  <Image 
                    src={previewUrl} 
                    alt="preview" 
                    width={400}
                    height={256}
                    className="w-full object-cover max-h-64" 
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewUrl('')}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition"
                  >
                    ✕
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm font-medium text-red-600 dark:text-red-400">
                  ⚠️ {error}
                </div>
              )}
              
              {/* Three Button Layout */}
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-gray-100 dark:border-gray-800 pt-5 relative">
                {/* Left: Upload Dropdown */}
                <div className="relative composer-dropdown">
                  <button
                    type="button"
                    ref={uploadBtnRef}
                    onClick={() => {
                      setUploadMenuOpen(!uploadMenuOpen);
                      if (uploadBtnRef.current) {
                        const rect = uploadBtnRef.current.getBoundingClientRect();
                        setUploadPos({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX });
                      }
                    }}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 transition-all hover:border-blue-400 dark:hover:border-blue-400 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    📎 {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>

                {/* Middle: AI Features Dropdown */}
                <div className="relative composer-dropdown">
                  <button
                    type="button"
                    ref={aiBtnRef}
                    onClick={() => {
                      setAiMenuOpen(!aiMenuOpen);
                      if (aiBtnRef.current) {
                        const rect = aiBtnRef.current.getBoundingClientRect();
                        setAiPos({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX });
                      }
                    }}
                    disabled={aiCaptionLoading || analyzeLoading || hashtagsLoading || modifyPromptLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 px-4 py-3 font-semibold text-purple-700 dark:text-purple-300 transition-all hover:border-purple-400 dark:hover:border-purple-400 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {aiCaptionLoading || analyzeLoading || hashtagsLoading || modifyPromptLoading ? '⏳ Generating...' : '✨ AI Tools'}
                  </button>
                </div>

                {/* Right: Post Button */}
                <button 
                  disabled={posting || !authed || uploading} 
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 px-6 py-3 font-bold text-white transition-all transform hover:scale-105 disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {posting ? '⏳ Posting…' : authed ? '✨ Post' : '🔐 Login'}
                </button>
              </div>

              {/* Hidden file input for image upload */}
              <input ref={imageUrlRef} type="hidden" />
            </div>
          </form>

          {/* Upload Menu Portal */}
          {uploadMenuOpen && (
            <div 
              className="absolute bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl z-50 w-48 max-h-60 overflow-y-auto"
              style={{ top: `${uploadPos.top}px`, left: `${uploadPos.left}px` }}
            >
              <button
                type="button"
                disabled={uploading}
                onClick={async () => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async (e) => {
                    await handleFileSelect({ target: { files: [input.files[0]] } });
                    setUploadMenuOpen(false);
                  };
                  input.click();
                }}
                className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? '⏳ Uploading...' : '🖼️ Upload Image'}
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Video upload coming soon!');
                  setUploadMenuOpen(false);
                }}
                className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 transition border-t border-gray-100 dark:border-gray-700"
              >
                🎥 Upload Video
              </button>
              <button
                type="button"
                onClick={() => {
                  const link = prompt('Enter link URL:');
                  if (link && imageUrlRef.current) {
                    imageUrlRef.current.value = link;
                  }
                  setUploadMenuOpen(false);
                }}
                className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 transition border-t border-gray-100 dark:border-gray-700"
              >
                🔗 Add Link
              </button>
            </div>
          )}

          {/* AI Tools Menu Portal */}
          {aiMenuOpen && (
            <div 
              className="absolute bg-white dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-700 shadow-2xl z-50 w-56 max-h-80 overflow-y-auto"
              style={{ top: `${aiPos.top}px`, left: `${aiPos.left}px` }}
            >
              <button
                type="button"
                onClick={() => {
                  generateAiCaption();
                  setAiMenuOpen(false);
                }}
                disabled={aiCaptionLoading}
                className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-purple-50 dark:hover:bg-purple-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiCaptionLoading ? '⏳ Generating...' : '📝 AI Caption Generator'}
              </button>
              <button
                type="button"
                onClick={() => {
                  analyzeImageQuality();
                  setAiMenuOpen(false);
                }}
                disabled={analyzeLoading}
                className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-purple-50 dark:hover:bg-purple-900/20 transition border-t border-gray-100 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzeLoading ? '⏳ Analyzing...' : '🎨 Enhance Image Quality'}
              </button>
              <button
                type="button"
                onClick={() => {
                  generateHashtagsForImage();
                  setAiMenuOpen(false);
                }}
                disabled={hashtagsLoading}
                className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-purple-50 dark:hover:bg-purple-900/20 transition border-t border-gray-100 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hashtagsLoading ? '⏳ Generating...' : '#️⃣ Generate Hashtags'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setModifyPromptOpen(true);
                  setAiMenuOpen(false);
                }}
                className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-purple-50 dark:hover:bg-purple-900/20 transition border-t border-gray-100 dark:border-gray-700"
              >
                🖌️ Modify with Prompt
              </button>
            </div>
          )}

          {/* AI Caption Generator Popover */}
          {aiCaptionOpen && (
            <div 
              className="absolute bg-white dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-700 shadow-2xl z-50 w-96 max-h-96 overflow-hidden"
              style={{ 
                top: `${captionPopoverPos.top}px`, 
                left: `${captionPopoverPos.left}px`,
                maxWidth: 'calc(100vw - 20px)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-700 px-5 py-3 bg-purple-50 dark:bg-purple-900/20">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">📝 AI Captions</h3>
                <button
                  onClick={() => setAiCaptionOpen(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              {/* Mood Selector */}
              <div className="border-b border-gray-200 dark:border-gray-700 px-5 py-3">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Change mood:</div>
                <div className="flex gap-2 flex-wrap">
                  {['default', 'funny', 'professional', 'casual', 'poetic'].map((mood) => (
                    <button
                      key={mood}
                      onClick={() => generateAiCaption(mood)}
                      disabled={aiCaptionLoading}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        captionMood === mood
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {mood === 'default' ? '✨ Default' : mood}
                    </button>
                  ))}
                </div>
              </div>

              {/* Captions List */}
              <div className="px-5 py-3 max-h-64 overflow-y-auto space-y-2">
                {aiCaptions.length > 0 ? (
                  aiCaptions.map((caption, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 transition-all group"
                    >
                      <p className="text-sm text-gray-900 dark:text-white mb-2 line-clamp-3">{caption}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (captionRef.current) {
                              captionRef.current.value = caption;
                              setAiCaptionOpen(false);
                            }
                          }}
                          className="flex-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-all"
                        >
                          ➕ Use
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(caption);
                          }}
                          className="flex-1 px-3 py-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white text-xs font-medium rounded-lg transition-all"
                        >
                          📋 Copy
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">No captions generated</div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-2 bg-gray-50 dark:bg-gray-900/20 flex gap-2">
                <button
                  onClick={() => setAiCaptionOpen(false)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => generateAiCaption(captionMood)}
                  disabled={aiCaptionLoading}
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:from-purple-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiCaptionLoading ? '⏳ Generating...' : '🔄 Regenerate'}
                </button>
              </div>
            </div>
          )}

          {/* Backdrop to close popover when clicking outside */}
          {aiCaptionOpen && (
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setAiCaptionOpen(false)}
            />
          )}

          {/* Modify with Prompt Modal */}
          {modifyPromptOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">🖌️ Modify Image with Prompt</h2>
                  <button
                    onClick={() => setModifyPromptOpen(false)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                  <div className="space-y-4">
                    {/* Quick Prompt Options */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Options:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setModifyPrompt('Make the colors more vibrant and saturated')}
                          className="px-3 py-2 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                        >
                          🎨 Vibrant Colors
                        </button>
                        <button
                          onClick={() => setModifyPrompt('Increase contrast and sharpness')}
                          className="px-3 py-2 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                        >
                          ✨ Sharp & Clear
                        </button>
                        <button
                          onClick={() => setModifyPrompt('Add vintage film effect')}
                          className="px-3 py-2 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                        >
                          📽️ Vintage Look
                        </button>
                        <button
                          onClick={() => setModifyPrompt('Blur background and focus on subject')}
                          className="px-3 py-2 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                        >
                          🎯 Blur Background
                        </button>
                      </div>
                    </div>

                    {/* Custom Prompt Input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        📝 Custom Prompt
                      </label>
                      <textarea
                        value={modifyPrompt}
                        onChange={(e) => setModifyPrompt(e.target.value)}
                        placeholder="Describe how you want to modify your image... (e.g., 'Make it look like an oil painting' or 'Add sunset colors')"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        rows={4}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Be specific about the style, colors, or effects you want
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-slate-800 flex gap-3">
                  <button
                    onClick={() => {
                      setModifyPromptOpen(false);
                      setModifyPrompt('');
                    }}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (modifyPrompt.trim()) {
                        console.log('🖌️ Image modification with prompt:', modifyPrompt);
                        alert(`✨ Modifying image with prompt:\n\n"${modifyPrompt}"\n\nFeature coming soon!`);
                        setModifyPromptOpen(false);
                        setModifyPrompt('');
                      } else {
                        alert('Please enter a prompt first');
                      }
                    }}
                    disabled={modifyPromptLoading || !modifyPrompt.trim()}
                    className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:from-purple-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {modifyPromptLoading ? '⏳ Processing...' : '✨ Apply Modification'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Image Analysis Modal */}
          {analyzeOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">🎨 Image Analysis & Suggestions</h2>
                  <button
                    onClick={() => setAnalyzeOpen(false)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-96 overflow-y-auto space-y-4">
                  {imageAnalysis ? (
                    <>
                      {imageAnalysis.qualityScore && (
                        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Quality Score</div>
                          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{imageAnalysis.qualityScore}/10</div>
                        </div>
                      )}
                      
                      {imageAnalysis.quality && (
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Quality Assessment</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{imageAnalysis.quality}</p>
                        </div>
                      )}

                      {imageAnalysis.lightingComposition && (
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">💡 Lighting & Composition</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{imageAnalysis.lightingComposition}</p>
                        </div>
                      )}

                      {imageAnalysis.colorBalance && (
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">🎨 Color Balance</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{imageAnalysis.colorBalance}</p>
                        </div>
                      )}

                      {imageAnalysis.recommendations && (
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">📋 Recommendations</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{imageAnalysis.recommendations}</p>
                        </div>
                      )}

                      {imageAnalysis.suggestedEffects && (
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">✨ Suggested Effects</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{imageAnalysis.suggestedEffects}</p>
                        </div>
                      )}

                      {imageAnalysis.analysis && (
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">📊 Full Analysis</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{imageAnalysis.analysis}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500 dark:text-gray-400">No analysis available</div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-slate-800 flex gap-3">
                  <button
                    onClick={() => setAnalyzeOpen(false)}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      analyzeImageQuality();
                    }}
                    disabled={analyzeLoading}
                    className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:from-purple-600 hover:to-purple-700 transition disabled:opacity-50"
                  >
                    {analyzeLoading ? '⏳ Re-analyzing...' : '🔄 Re-analyze'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hashtags Generator Popover */}
          {hashtagsOpen && (
            <div 
              className="absolute bg-white dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-700 shadow-2xl z-50 w-96 max-h-96 overflow-hidden"
              style={{ 
                top: `${hashtagPopoverPos.top}px`, 
                left: `${hashtagPopoverPos.left}px`,
                maxWidth: 'calc(100vw - 20px)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-700 px-5 py-3 bg-purple-50 dark:bg-purple-900/20">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">#️⃣ Generated Hashtags</h3>
                <button
                  onClick={() => setHashtagsOpen(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="px-5 py-3 max-h-64 overflow-y-auto space-y-3">
                {generatedHashtags ? (
                  <>
                    {generatedHashtags.contentType && (
                      <div className="text-xs">
                        <span className="font-semibold text-gray-900 dark:text-white">Content Type: </span>
                        <span className="text-gray-700 dark:text-gray-300">{generatedHashtags.contentType}</span>
                      </div>
                    )}

                    {generatedHashtags.trendingTags && generatedHashtags.trendingTags.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white mb-2">🔥 Trending Tags</div>
                        <div className="flex flex-wrap gap-1">
                          {generatedHashtags.trendingTags.map((tag, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                const current = captionRef.current?.value || '';
                                captionRef.current.value = current + (current ? ' ' : '') + tag;
                                setHashtagsOpen(false);
                              }}
                              className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {generatedHashtags.nicherTags && generatedHashtags.nicherTags.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white mb-2">🎯 Niche Tags</div>
                        <div className="flex flex-wrap gap-1">
                          {generatedHashtags.nicherTags.map((tag, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                const current = captionRef.current?.value || '';
                                captionRef.current.value = current + (current ? ' ' : '') + tag;
                                setHashtagsOpen(false);
                              }}
                              className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {generatedHashtags.brandTags && generatedHashtags.brandTags.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white mb-2">⭐ Brand Tags</div>
                        <div className="flex flex-wrap gap-1">
                          {generatedHashtags.brandTags.map((tag, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                const current = captionRef.current?.value || '';
                                captionRef.current.value = current + (current ? ' ' : '') + tag;
                                setHashtagsOpen(false);
                              }}
                              className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {generatedHashtags.tags && generatedHashtags.tags.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white mb-2">📌 All Tags</div>
                        <div className="flex flex-wrap gap-1">
                          {generatedHashtags.tags.map((tag, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                const current = captionRef.current?.value || '';
                                captionRef.current.value = current + (current ? ' ' : '') + tag;
                              }}
                              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">No hashtags generated</div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-2 bg-gray-50 dark:bg-gray-900/20 flex gap-2">
                <button
                  onClick={() => setHashtagsOpen(false)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    generateHashtagsForImage();
                  }}
                  disabled={hashtagsLoading}
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:from-purple-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hashtagsLoading ? '⏳ Regenerating...' : '🔄 Regenerate'}
                </button>
              </div>
            </div>
          )}

          {/* Backdrop to close popover when clicking outside */}
          {hashtagsOpen && (
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setHashtagsOpen(false)}
            />
          )}

          {feed.map((item) => (
            <Post key={item._id} item={item} onLike={toggleLike} onDelete={handleDelete} onShare={handleShare} onUpdate={handleUpdate} />
          ))}
        </main>

        {/* Right sidebar */}
        <aside className="sticky top-0 hidden h-[100dvh] w-80 flex-col gap-6 py-6 md:flex">
          <UserCard />
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-bold text-gray-900 dark:text-white">👥 Suggestions for you</div>
              <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition">See all</button>
            </div>
            <div className="space-y-4">
              {suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You&apos;re all caught up!
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    No new suggestions right now
                  </p>
                </div>
              ) : (
                suggestions.map((s) => {
                  const isFollowing = followingIds.has(s.id);
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                      <Avatar name={s.name} src={s.profilePic} />
                      <div className="flex-1 leading-tight min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          <Link href={`/u/${s.name}`} className="hover:text-blue-500 dark:hover:text-blue-400 transition">{s.name}</Link>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{s.mutualCount ? `${s.mutualCount} mutual` : 'Suggested'}</div>
                      </div>
                      <button 
                        onClick={() => follow(s.id)} 
                        disabled={isFollowing}
                        className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition-all transform ${
                          isFollowing 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-500 hover:bg-blue-600 hover:scale-105 active:scale-95'
                        }`}
                      >
                        {isFollowing ? '...' : 'Follow'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="px-1 text-[11px] leading-5 text-gray-500 dark:text-gray-400">
            About • Help • Press • API • Jobs • Privacy • Terms • Locations
          </div>
        </aside>
      </div>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-gray-200 bg-white py-2 md:hidden">
        {['home','search','reels','create','user'].map((i) => (
          <button key={i} className="p-2 text-black dark:text-white"><Icon name={i} /></button>
        ))}
      </nav>
    </div>
  );
}

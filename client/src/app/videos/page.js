"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar, { Icon } from '@/components/Navbar';
import ShareModal from '@/components/ShareModal';
import { apiDelete, apiGet, apiPost } from '@/lib/api';
import { getEmbedConfig, isVideoMedia } from '@/lib/media';

function timeAgo(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d2 = Math.floor(h / 24);
  if (d2 < 7) return `${d2}d ago`;
  const w = Math.floor(d2 / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d2 / 30);
  if (mo < 12) return `${mo}mo ago`;
  const y = Math.floor(d2 / 365);
  return `${y}y ago`;
}

function Avatar({ name = 'U', src }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} className="h-10 w-10 rounded-full object-cover" />
    );
  }
  return (
    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold">
      {name?.[0]?.toUpperCase() || 'U'}
    </div>
  );
}

function VideoCard({ post, onLike, onShare, onDelete }) {
  const media = post.media?.[0];
  const [embedHover, setEmbedHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isVideo = isVideoMedia(media);
  const isEmbed = media?.type === 'embed';
  const embedConfig = isEmbed ? getEmbedConfig(media?.url, embedHover) : null;
  const scheduledDate = post.scheduledAt ? new Date(post.scheduledAt) : null;
  const isScheduled = scheduledDate && scheduledDate > new Date();

  const handleVideoHover = (event, shouldPlay) => {
    const el = event?.currentTarget;
    if (!el) return;
    try {
      if (shouldPlay) {
        el.muted = false;
        el.play();
      } else {
        el.muted = true;
        el.pause();
        el.currentTime = 0;
      }
    } catch (err) {
      console.warn('Video hover failed', err);
    }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <article className="mb-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm">
      <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Avatar name={post.user?.username} src={post.user?.profilePic} />
          <div>
            <div className="text-sm font-bold text-black dark:text-white">
              {post.user?.username ? (
                <Link href={`/u/${post.user.username}`} className="hover:text-blue-500 transition">
                  {post.user.username}
                </Link>
              ) : (
                'user'
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(post.createdAt)}</div>
            {isScheduled && (
              <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-300">
                Scheduled for {scheduledDate.toLocaleString()}
              </div>
            )}
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="More options"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="flex items-center gap-1 text-lg leading-none">
              <span className="h-1 w-1 rounded-full bg-current block" />
              <span className="h-1 w-1 rounded-full bg-current block" />
              <span className="h-1 w-1 rounded-full bg-current block" />
            </span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 shadow-lg z-10 overflow-hidden">
              <Link
                href={`/p/${post._id}`}
                className="block px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                onClick={() => setMenuOpen(false)}
              >
                🔗 View Post
              </Link>
              {post.canDelete && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(post);
                  }}
                  className="block w-full text-left px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition border-t border-gray-100 dark:border-gray-700"
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {post.caption && (
        <p className="px-5 pt-4 text-sm text-gray-900 dark:text-gray-100">{post.caption}</p>
      )}

      {isVideo && (
        <div className="relative mt-3 bg-black">
          <video
            src={media?.url}
            className="w-full max-h-[520px] object-cover"
            controls
            playsInline
            preload="metadata"
            muted
            loop
            onMouseEnter={(e) => handleVideoHover(e, true)}
            onMouseLeave={(e) => handleVideoHover(e, false)}
          />
        </div>
      )}

      {isEmbed && (
        <div
          className="relative mt-3 bg-black"
          onMouseEnter={() => setEmbedHover(true)}
          onMouseLeave={() => setEmbedHover(false)}
        >
          {embedConfig ? (
            <iframe
              src={embedConfig.src}
              className="w-full h-[360px]"
              title="Embedded video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className="p-6 text-center text-sm text-gray-600 dark:text-gray-300">
              Preview unavailable for this link.
            </div>
          )}
          {!embedHover && embedConfig && (
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-semibold tracking-wide">
              Hover to play
            </div>
          )}
        </div>
      )}

      <footer className="px-5 py-4 border-t border-gray-100 dark:border-gray-800">
        <div className="text-sm font-semibold text-black dark:text-white mb-2">
          {(post.likes || 0).toLocaleString()} <span className="font-normal text-gray-600 dark:text-gray-400">likes</span>
        </div>
        {post.commentsCount > 0 && (
          <Link
            href={`/p/${post._id}`}
            className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 hover:text-gray-900 dark:hover:text-gray-200"
          >
            View all {post.commentsCount} comments
          </Link>
        )}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              aria-label="Like"
              onClick={() => onLike(post)}
              className={`p-2 rounded-full transition ${post.didLike ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <Icon name="heart" className="h-5 w-5" filled={post.didLike} />
            </button>
            <Link
              aria-label="Comments"
              href={`/p/${post._id}`}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <Icon name="comment" className="h-5 w-5" />
            </Link>
            <button
              aria-label="Share"
              onClick={() => onShare(post)}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-green-500 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <Icon name="send" className="h-5 w-5" />
            </button>
          </div>
          <button
            aria-label="Save"
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <Icon name="bookmark" className="h-5 w-5" />
          </button>
        </div>
      </footer>
    </article>
  );
}

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareTarget, setShareTarget] = useState(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const collected = [];
        let cursor = null;
        do {
          const params = new URLSearchParams();
          params.set('limit', '50');
          if (cursor) params.set('cursor', cursor);
          const data = await apiGet(`/api/posts/videos?${params.toString()}`);
          const posts = data?.posts || [];
          collected.push(...posts);
          cursor = data?.nextCursor ? new Date(data.nextCursor).toISOString() : null;
        } while (cursor);
        if (isMounted) {
          setVideos(collected);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load videos');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleLike = async (post) => {
    try {
      let response;
      if (post.didLike) {
        response = await apiPost(`/api/posts/${post._id}/unlike`);
      } else {
        response = await apiPost(`/api/posts/${post._id}/like`);
      }
      const likes = response?.likes ?? post.likes;
      setVideos((prev) =>
        prev.map((item) =>
          item._id === post._id ? { ...item, didLike: !post.didLike, likes } : item
        )
      );
    } catch (err) {
      console.error('Toggle like failed:', err);
    }
  };

  const handleDelete = async (post) => {
    if (!confirm('Delete this video post?')) return;
    try {
      await apiDelete(`/api/posts/${post._id}`);
      setVideos((prev) => prev.filter((item) => item._id !== post._id));
    } catch (err) {
      console.error('Delete post failed:', err);
    }
  };

  const handleShare = (post) => {
    setShareTarget(post);
  };

  const handleShareSubmit = async (caption) => {
    if (!shareTarget) return;
    await apiPost(`/api/posts/${shareTarget._id}/share`, { caption });
  };

  let content;
  if (loading) {
    content = <p className="text-gray-500 dark:text-gray-400">Loading videos...</p>;
  } else if (error) {
    content = <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>;
  } else if (!videos.length) {
    content = <p className="text-gray-500 dark:text-gray-400">No videos found yet.</p>;
  } else {
    content = videos.map((video) => (
      <VideoCard
        key={video._id}
        post={video}
        onLike={handleToggleLike}
        onShare={handleShare}
        onDelete={handleDelete}
      />
    ));
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      <Navbar />
      <main className="flex-1 pt-[72px] md:pt-6">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-500 dark:text-blue-300">Library</p>
            <h1 className="text-3xl font-bold text-black dark:text-white">Videos</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              All uploaded videos and linked reels appear here for quick access.
            </p>
          </div>
          {content}
          <ShareModal
            isOpen={!!shareTarget}
            onClose={() => setShareTarget(null)}
            post={shareTarget}
            onShare={handleShareSubmit}
          />
        </div>
      </main>
    </div>
  );
}

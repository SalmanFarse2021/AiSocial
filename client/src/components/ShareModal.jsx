"use client";
import { useState } from 'react';
import { Icon } from './Navbar';
import UserSelectorModal from './UserSelectorModal';

export default function ShareModal({ isOpen, onClose, post, onShare }) {
  const [shareCaption, setShareCaption] = useState('');
  const [copying, setCopying] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);

  if (!isOpen) return null;

  const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${post._id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShareToFeed = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await onShare(shareCaption);
      setShareCaption('');
      onClose();
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-black dark:text-white">Share Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <Icon name="close" className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Post Preview */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
              {post.user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="text-sm font-semibold text-black dark:text-white">
                {post.user?.username || 'User'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {post.type === 'reel' ? 'Reel' : 'Post'}
              </div>
            </div>
          </div>
          {post.caption && (
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {post.caption}
            </p>
          )}
        </div>

        {/* Share Options */}
        <div className="p-4 space-y-3">
          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition group"
          >
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition">
              <Icon 
                name={copying ? "check" : "link"} 
                className={`h-6 w-6 ${copying ? 'text-green-500' : 'text-blue-600 dark:text-blue-400'}`} 
              />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-black dark:text-white">
                {copying ? 'Link Copied!' : 'Copy Link'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Share via any app
              </div>
            </div>
          </button>

          {/* Share to Feed */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Icon name="send" className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm font-semibold text-black dark:text-white">
                Share to Your Feed
              </div>
            </div>
            <textarea
              placeholder="Add a caption (optional)"
              value={shareCaption}
              onChange={(e) => setShareCaption(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
            />
            <button
              onClick={handleShareToFeed}
              disabled={sharing}
              className="mt-2 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sharing ? 'Sharing...' : 'Share Now'}
            </button>
          </div>

          {/* Share via Message */}
          <button
            onClick={() => setShowUserSelector(true)}
            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition group"
          >
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition">
              <Icon name="chat" className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-black dark:text-white">
                Send in Message
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Share with your friends
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* User Selector Modal */}
      <UserSelectorModal
        isOpen={showUserSelector}
        onClose={() => setShowUserSelector(false)}
        post={post}
        onSend={() => {
          setShowUserSelector(false);
          onClose();
        }}
      />
    </div>
  );
}

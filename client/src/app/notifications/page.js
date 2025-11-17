"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 5 seconds
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login first');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/notifications?limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setError('');
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/notifications/read-all`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  async function deleteNotification(notificationId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Icon name="heart" className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <Icon name="comment" className="w-5 h-5 text-sky-500" />;
      case 'follow':
        return <Icon name="user" className="w-5 h-5 text-green-500" />;
      default:
        return null;
    }
  };

  const getNotificationMessage = (notification) => {
    const actorName = notification.sender?.displayName || notification.sender?.username || 'Someone';
    const username = notification.sender?.username;
    
    let message = '';
    switch (notification.type) {
      case 'like':
        message = 'liked your post';
        break;
      case 'comment':
        message = 'commented on your post';
        break;
      case 'follow':
        message = 'started following you';
        break;
      case 'mention':
        message = 'mentioned you';
        break;
      case 'reply':
        message = 'replied to your comment';
        break;
      default:
        return notification.message || 'New notification';
    }
    
    return { actorName, username, message };
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    
    if (diff < 60) return 'just now';
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const day = Math.floor(h / 24);
    if (day < 7) return `${day}d ago`;
    
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-900 py-4 z-10">
          <div className="flex items-center gap-3">
            <Link 
              href="/home"
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded font-medium transition"
            >
              Mark all as read ({unreadCount})
            </button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-600 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin h-8 w-8 border-4 border-white/20 border-t-sky-600 rounded-full" />
            </div>
            <p className="text-white/60 mt-3">Loading notifications...</p>
          </div>
        )}

        {/* Notifications List */}
        {!loading && notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map(notification => (
              <div
                key={notification._id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition ${
                  notification.read
                    ? 'bg-gray-800 border-white/10 hover:bg-gray-700'
                    : 'bg-gray-800 border-sky-600 hover:bg-gray-700'
                }`}
              >
                {/* Sender Avatar */}
                <div className="flex-shrink-0">
                  {notification.sender?.profilePic ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={notification.sender.profilePic}
                      alt={notification.sender.username}
                      className="h-12 w-12 rounded-full object-cover hover:opacity-80 cursor-pointer"
                      onClick={() => {
                        if (notification.sender?.username) {
                          window.location.href = `/u/${notification.sender.username}`;
                        }
                      }}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-80">
                      {notification.sender?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Notification Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    {getNotificationIcon(notification.type)}
                    <div className="text-white font-medium text-left">
                      {(() => {
                        const { actorName, username, message } = getNotificationMessage(notification);
                        return (
                          <>
                            <button
                              onClick={() => {
                                if (username) {
                                  window.location.href = `/u/${username}`;
                                }
                              }}
                              className="hover:text-sky-400 transition font-semibold"
                            >
                              {actorName}
                            </button>
                            {' '}
                            <button
                              onClick={() => {
                                if (notification.post?._id) {
                                  window.location.href = `/feed?postId=${notification.post._id}`;
                                }
                              }}
                              className="hover:text-sky-400 transition font-normal"
                            >
                              {message}
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {notification.post && (
                    <p className="text-xs text-white/50 mb-2 line-clamp-1">
                      &ldquo;{notification.post.caption?.substring(0, 50) || 'Photo'}&rdquo;
                    </p>
                  )}
                  
                  <p className="text-xs text-white/50">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>

                {/* Unread indicator and Delete Button */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {!notification.read && (
                    <div className="h-3 w-3 rounded-full bg-sky-600 flex-shrink-0" />
                  )}
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="text-white/40 hover:text-red-500 transition p-2"
                    title="Delete notification"
                  >
                    <Icon name="trash" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔔</div>
            <p className="text-white/60 text-lg">No notifications yet</p>
            <p className="text-white/40 text-sm mt-2">When someone likes or comments on your posts, you&apos;ll see it here</p>
          </div>
        )}
      </div>
    </div>
  );
}

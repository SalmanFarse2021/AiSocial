'use client';

import React, { useState, useEffect } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, X, RefreshCw } from 'lucide-react';

const CallHistory = ({ isOpen, onClose }) => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, missed, incoming, outgoing
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCallHistory();
    }
  }, [isOpen]);

  const fetchCallHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/calls/history?limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCalls(data.calls || []);
      } else {
        setError('Failed to load call history');
      }
    } catch (error) {
      console.error('Failed to fetch call history:', error);
      setError('Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getCallStatus = (call, currentUserId) => {
    const isCaller = call.caller._id === currentUserId;
    
    if (call.status === 'missed') {
      return { icon: PhoneMissed, color: 'text-red-400', label: 'Missed' };
    } else if (call.status === 'rejected') {
      return { icon: PhoneMissed, color: 'text-red-400', label: 'Declined' };
    } else if (isCaller) {
      return { icon: PhoneOutgoing, color: 'text-green-400', label: 'Outgoing' };
    } else {
      return { icon: PhoneIncoming, color: 'text-blue-400', label: 'Incoming' };
    }
  };

  const filteredCalls = calls.filter((call) => {
    const currentUserId = localStorage.getItem('userId');
    const isCaller = call.caller._id === currentUserId;
    
    if (filter === 'all') return true;
    if (filter === 'missed') return call.status === 'missed' || call.status === 'rejected';
    if (filter === 'incoming') return !isCaller;
    if (filter === 'outgoing') return isCaller;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Call History</h2>
              <p className="text-sm text-white/60">{filteredCalls.length} calls</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchCallHistory}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 p-4 border-b border-white/10 bg-gray-800/50">
          {['all', 'missed', 'incoming', 'outgoing'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Call List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-red-400">{error}</p>
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/50">
              <Clock className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg">No calls yet</p>
              <p className="text-sm">Your call history will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredCalls.map((call) => {
                const currentUserId = localStorage.getItem('userId');
                const otherUser = call.caller._id === currentUserId ? call.receiver : call.caller;
                const status = getCallStatus(call, currentUserId);
                const StatusIcon = status.icon;

                return (
                  <div
                    key={call._id}
                    className="p-4 hover:bg-white/5 transition-colors flex items-center gap-4"
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                        {otherUser.profilePic ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={otherUser.profilePic}
                            alt={otherUser.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold">
                            {otherUser.displayName?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      {/* Call type badge */}
                      <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-gray-900 border border-white/10">
                        {call.callType === 'video' ? (
                          <Video className="w-3 h-3 text-blue-400" />
                        ) : (
                          <Phone className="w-3 h-3 text-green-400" />
                        )}
                      </div>
                    </div>

                    {/* Call Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium truncate">
                          {otherUser.displayName || otherUser.username}
                        </p>
                        <StatusIcon className={`w-4 h-4 flex-shrink-0 ${status.color}`} />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <span className="capitalize">{call.callType}</span>
                        {call.duration > 0 && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(call.duration)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="text-right text-sm text-white/50">
                      {formatDate(call.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallHistory;

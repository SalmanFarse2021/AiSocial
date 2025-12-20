"use client";
import { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { isVideoMedia } from '@/lib/media';
import {
  initSocket,
  disconnectSocket,
  emitSendMessage,
  emitJoinConversation,
  emitLeaveConversation,
  onMessageReceived,
  getSocket
} from '@/lib/socket';
import { useWebRTC } from '@/hooks/useWebRTC';
import AudioCall from '@/components/AudioCall';
import IncomingCallModal from '@/components/IncomingCallModal';

export default function Messenger({ conversationId, compact = false }) {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(conversationId);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Audio calling
  const socket = getSocket();
  const {
    isCallActive,
    isMuted,
    callDuration,
    incomingCall,
    remoteStream,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
  } = useWebRTC(currentUser?._id, socket);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/users/me`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user || data);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  // Initialize Socket.io
  useEffect(() => {
    if (!currentUser?._id) return;

    const socket = initSocket(currentUser._id);

    // Listen for incoming messages
    onMessageReceived((message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      // Keep socket connection alive
    };
  }, [currentUser?._id]);

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/messages/conversations`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || []);
          setFilteredConversations(data.conversations || []);
          // Only set default if no conversation is selected yet
          if (!conversationId && data.conversations.length > 0) {
            setSelectedConversation(data.conversations[0]._id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      }
    };
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    // Join Socket.io conversation room
    emitJoinConversation(selectedConversation);

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/messages/conversations/${selectedConversation}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => {
      clearInterval(interval);
      emitLeaveConversation(selectedConversation);
    };
  }, [selectedConversation]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Recording timer
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        await sendMessage(reader.result, 'voice');
      };
      reader.readAsDataURL(audioBlob);
    };

    setIsRecording(false);
    setRecordingTime(0);
  };

  const sendMessage = async (content, type = 'text') => {
    if (!selectedConversation) return;
    if (type === 'text' && !content.trim()) return;

    try {
      const payload = { content, type };
      if (type === 'voice') {
        payload.attachment = { type: 'voice', url: content, name: 'voice-message.webm' };
      }

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/messages/conversations/${selectedConversation}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        setNewMessage('');
        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);

        // Emit via Socket.io for real-time delivery
        emitSendMessage(selectedConversation, data.message);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Search for friends to message
  const searchFriends = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/users/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Failed to search friends:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Start conversation with a user
  const startConversation = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/messages/conversations/direct`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipientId: userId }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSelectedConversation(data.conversation._id);
        setShowSearchResults(false);
        setSearchQuery('');
        setSearchResults([]);
        // Refresh conversations list
        const convResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/messages/conversations`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (convResponse.ok) {
          const convData = await convResponse.json();
          setConversations(convData.conversations || []);
          setFilteredConversations(convData.conversations || []);
        }
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  // Filter conversations based on search
  const filterConversations = (query) => {
    if (!query.trim()) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv =>
        conv.participantNames?.some(name =>
          name.toLowerCase().includes(query.toLowerCase())
        ) ||
        conv.lastMessage?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  };

  const handleMessageInput = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set a new timeout to clear typing indicator after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setTypingUsers(new Set());
    }, 3000);
  };

  const handleSendKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(newMessage);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (compact) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden transition-colors">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-white/50 text-sm">
              No messages yet. Start chatting!
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className={`flex gap-2 ${msg.sender?._id === currentUser?._id ? 'justify-end' : 'justify-start'}`}>
                {msg.sender?._id !== currentUser?._id && (
                  <div className="flex-shrink-0">
                    {msg.sender?.profilePic ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={msg.sender.profilePic}
                        alt={msg.sender?.username}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                        {msg.sender?.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                <div className={`max-w-xs rounded-2xl transition-all hover:scale-105 ${msg.sender?._id === currentUser?._id
                    ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 rounded-tr-none'
                    : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white shadow-md shadow-black/20 rounded-tl-none'
                  } px-3 py-2`}>
                  {msg.attachment?.type === 'voice' ? (
                    <div className="space-y-1.5">
                      <audio controls className="max-w-xs h-7 rounded-lg">
                        <source src={msg.attachment.url} type="audio/webm" />
                      </audio>
                      <p className="text-xs opacity-70">{formatTime(msg.createdAt)}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                      {msg.sharedPost && (() => {
                        const sharedMedia = msg.sharedPost.media?.[0];
                        const showVideo = isVideoMedia(sharedMedia);
                        return (
                          <div className="mt-2 rounded-lg border border-white/20 overflow-hidden bg-black/20 max-w-xs">
                            <div className="p-2 border-b border-white/10 flex items-center gap-2">
                              {msg.sharedPost.user?.profilePic ? (
                                <img
                                  src={msg.sharedPost.user.profilePic}
                                  alt={msg.sharedPost.user.username}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-semibold text-white">
                                  {msg.sharedPost.user?.username?.[0]?.toUpperCase()}
                                </div>
                              )}
                              <span className="text-xs font-semibold">{msg.sharedPost.user?.username}</span>
                            </div>
                            {msg.sharedPost.caption && (
                              <p className="p-2 text-xs line-clamp-2 opacity-90">{msg.sharedPost.caption}</p>
                            )}
                            {sharedMedia?.url && (
                              showVideo ? (
                                <video
                                  src={sharedMedia.url}
                                  className="w-full max-h-40 object-cover cursor-pointer"
                                  controls
                                  playsInline
                                  preload="metadata"
                                  onClick={() => window.open(`/p/${msg.sharedPost._id}`, '_blank')}
                                />
                              ) : (
                                <img
                                  src={sharedMedia.url}
                                  alt="Shared post"
                                  className="w-full max-h-40 object-cover cursor-pointer hover:opacity-90 transition"
                                  onClick={() => window.open(`/p/${msg.sharedPost._id}`, '_blank')}
                                />
                              )
                            )}
                            {msg.sharedPost.poll && (
                              <div className="p-2 border-t border-white/10 text-xs text-white/80">
                                <p className="font-semibold">{msg.sharedPost.poll.question}</p>
                                <div className="mt-1 space-y-1">
                                  {(msg.sharedPost.poll.options || []).map((opt, idx) => (
                                    <div key={opt.text + idx} className="rounded-lg bg-white/10 px-2 py-1 flex items-center justify-between">
                                      <span>{opt.text}</span>
                                      <span>{typeof opt.percentage === 'number' ? `${opt.percentage}%` : ''}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="p-2 text-xs opacity-60 hover:opacity-100 transition cursor-pointer" onClick={() => window.open(`/p/${msg.sharedPost._id}`, '_blank')}>
                              View post →
                            </div>
                          </div>
                        );
                      })()}
                      <p className="text-xs opacity-60 text-right">{formatTime(msg.createdAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-gradient-to-b from-gray-800 to-gray-900">
          {isRecording && (
            <div className="mb-3 flex items-center gap-2 bg-red-500/20 p-3 rounded-lg text-red-400 text-sm border border-red-500/30 backdrop-blur-sm">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Recording {recordingTime}s
            </div>
          )}
          <div className="flex items-end gap-3">
            <textarea
              value={newMessage}
              onChange={handleMessageInput}
              onKeyDown={handleSendKey}
              placeholder="Type a message... (Shift+Enter for new line)"
              rows="1"
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white rounded-full text-sm placeholder:text-gray-500 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 resize-none max-h-24 transition-all"
              style={{ maxHeight: '100px' }}
            />
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              disabled={false}
              className={`p-3 rounded-full transition-all hover:scale-110 active:scale-95 ${isRecording
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/50 animate-pulse'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-white shadow-md shadow-black/20'
                }`}
              title="Hold to record voice"
            >
              🎤
            </button>
            <button
              onClick={() => sendMessage(newMessage)}
              disabled={!newMessage.trim() && !isRecording}
              className="p-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95 shadow-lg shadow-blue-500/50"
            >
              ✈️
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-gray-900 transition-colors">
      {/* Conversations Sidebar */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-gray-200 dark:border-white/10 flex-col bg-white dark:bg-gray-900 transition-colors`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-white/10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Messages</h2>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                searchFriends(e.target.value);
                filterConversations(e.target.value);
              }}
              placeholder="Search friends or messages..."
              className="w-full px-4 py-2 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white rounded-full text-sm placeholder:text-gray-500 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="mt-3 bg-white dark:bg-gradient-to-b from-gray-800 to-gray-750 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg shadow-blue-500/10 max-h-48 overflow-y-auto backdrop-blur-sm">
              <div className="p-3 text-xs text-gray-500 dark:text-white/70 border-b border-gray-100 dark:border-white/10 font-semibold uppercase tracking-wide">Search Results</div>
              {searchResults.map((user) => (
                <button
                  key={user._id}
                  onClick={() => startConversation(user._id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-gray-900 dark:text-white text-sm flex items-center gap-3 active:scale-[0.99]"
                >
                  {user.profilePic ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.profilePic}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-500/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-xs font-bold ring-2 ring-blue-500/30">
                      {user.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.username}</p>
                    <p className="text-gray-500 dark:text-white/60 text-xs truncate">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-white/50 text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => {
                  setSelectedConversation(conv._id);
                  setShowSearchResults(false);
                }}
                className={`w-full p-4 mx-2 my-1 text-left rounded-2xl transition-all active:scale-95 border ${selectedConversation === conv._id
                    ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/40'
                    : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10'
                  }`}
              >
                <div className="flex items-start gap-3">
                  {conv.participants && conv.participants[0] ? (
                    conv.participants[0].profilePic ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={conv.participants[0].profilePic}
                        alt={conv.participantNames?.[0]}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0 mt-1 ring-2 ring-blue-500/30"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 mt-1 flex items-center justify-center text-sm font-bold text-white ring-2 ring-blue-500/30">
                        {conv.participantNames?.[0]?.[0]?.toUpperCase()}
                      </div>
                    )
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 mt-1 ring-2 ring-blue-500/30" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{conv.participantNames?.join(', ')}</p>
                    <p className="text-sm text-gray-500 dark:text-white/60 truncate">{conv.lastMessage || 'No messages yet'}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-50 dark:bg-gray-900 transition-colors`}>
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-white/10 p-4 flex items-center gap-3 bg-white/80 dark:bg-transparent backdrop-blur">
              {/* Back button for mobile */}
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-2 rounded-lg text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {conversations.find(c => c._id === selectedConversation)?.participantNames?.join(', ')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-white/50">Active now</p>
              </div>
              {/* Audio Call Button */}
              <button
                onClick={() => {
                  const conv = conversations.find(c => c._id === selectedConversation);
                  const recipientId = conv?.participants?.[0]?._id;
                  if (recipientId && currentUser?._id) {
                    initiateCall(recipientId, selectedConversation);
                  }
                }}
                className="p-3 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all hover:scale-110 active:scale-95 shadow-lg shadow-green-500/50"
                title="Start audio call"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 transition-colors">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-white/40">
                  <div className="text-center">
                    <p className="text-lg font-light text-gray-600 dark:text-white/70">No messages yet</p>
                    <p className="text-sm mt-1 text-gray-500 dark:text-white/60">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg._id} className={`flex gap-3 animate-fade-in ${msg.sender?._id === currentUser?._id ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender?._id !== currentUser?._id && (
                      <div className="flex-shrink-0">
                        {msg.sender?.profilePic ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={msg.sender.profilePic}
                            alt={msg.sender?.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                            {msg.sender?.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`flex flex-col ${msg.sender?._id === currentUser?._id ? 'items-end' : 'items-start'}`}>
                      {msg.sender?._id !== currentUser?._id && (
                        <p className="text-xs text-gray-500 dark:text-white/60 mb-1.5 font-medium">{msg.sender?.username}</p>
                      )}
                      <div className={`max-w-md rounded-2xl transition-all hover:scale-105 ${msg.sender?._id === currentUser?._id
                          ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 rounded-tr-none'
                          : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white shadow-md shadow-black/20 rounded-tl-none'
                        } px-4 py-2.5`}>
                        {msg.attachment?.type === 'voice' ? (
                          <div className="space-y-2">
                            <audio controls className="max-w-md h-8 rounded-lg">
                              <source src={msg.attachment.url} type="audio/webm" />
                            </audio>
                            <p className="text-xs opacity-70">{formatTime(msg.createdAt)}</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="break-words text-sm leading-relaxed">{msg.content}</p>
                            {msg.sharedPost && (() => {
                              const sharedMedia = msg.sharedPost.media?.[0];
                              const showVideo = isVideoMedia(sharedMedia);
                              return (
                                <div className="mt-2 rounded-lg border border-white/20 overflow-hidden bg-black/20">
                                  <div className="p-2 border-b border-white/10 flex items-center gap-2">
                                    {msg.sharedPost.user?.profilePic ? (
                                      <img
                                        src={msg.sharedPost.user.profilePic}
                                        alt={msg.sharedPost.user.username}
                                        className="w-6 h-6 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-semibold text-white">
                                        {msg.sharedPost.user?.username?.[0]?.toUpperCase()}
                                      </div>
                                    )}
                                    <span className="text-xs font-semibold">{msg.sharedPost.user?.username}</span>
                                  </div>
                                  {msg.sharedPost.caption && (
                                    <p className="p-2 text-xs line-clamp-2 opacity-90">{msg.sharedPost.caption}</p>
                                  )}
                                  {sharedMedia?.url && (
                                    showVideo ? (
                                      <video
                                        src={sharedMedia.url}
                                        className="w-full max-h-48 object-cover cursor-pointer"
                                        controls
                                        playsInline
                                        preload="metadata"
                                        onClick={() => window.open(`/p/${msg.sharedPost._id}`, '_blank')}
                                      />
                                    ) : (
                                      <img
                                        src={sharedMedia.url}
                                        alt="Shared post"
                                        className="w-full max-h-48 object-cover cursor-pointer hover:opacity-90 transition"
                                        onClick={() => window.open(`/p/${msg.sharedPost._id}`, '_blank')}
                                      />
                                    )
                                  )}
                                  {msg.sharedPost.poll && (
                                    <div className="p-2 border-t border-white/10 text-xs text-white/80">
                                      <p className="font-semibold">{msg.sharedPost.poll.question}</p>
                                      <div className="mt-1 space-y-1">
                                        {(msg.sharedPost.poll.options || []).map((opt, idx) => (
                                          <div key={opt.text + idx} className="rounded-lg bg-white/10 px-2 py-1 flex items-center justify-between">
                                            <span>{opt.text}</span>
                                            <span>{typeof opt.percentage === 'number' ? `${opt.percentage}%` : ''}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div className="p-2 text-xs opacity-60 hover:opacity-100 transition cursor-pointer" onClick={() => window.open(`/p/${msg.sharedPost._id}`, '_blank')}>
                                    View post →
                                  </div>
                                </div>
                              );
                            })()}
                            <p className="text-xs text-gray-500 dark:text-white/70 text-right">{formatTime(msg.createdAt)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {typingUsers.size > 0 && (
                <div className="flex items-center gap-2 text-gray-500 dark:text-white/70 text-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-white/50 animate-bounce" style={{ animationDelay: '0s' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-white/50 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-white/50 animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                  Someone is typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 dark:border-white/10 p-4 bg-white dark:bg-gray-900 shadow-lg shadow-black/5 dark:shadow-none">
              {isRecording && (
                <div className="mb-3 flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-3 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Recording {recordingTime}s
                </div>
              )}
              <div className="flex gap-2 items-end">
                <textarea
                  value={newMessage}
                  onChange={handleMessageInput}
                  onKeyDown={handleSendKey}
                  placeholder="Type a message... (Shift+Enter for new line)"
                  rows="1"
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white rounded-full placeholder:text-gray-500 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 resize-none transition-all"
                  style={{ maxHeight: '120px' }}
                />
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  className="p-3 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-white/10 dark:text-white/70 dark:hover:text-white transition-all hover:scale-110 active:scale-95"
                  title="Hold to record voice"
                >
                  🎤
                </button>
                <button
                  onClick={() => sendMessage(newMessage)}
                  className="p-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white transition-all hover:scale-110 active:scale-95 shadow-lg shadow-blue-500/50"
                >
                  ➤
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-white/50">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2 text-gray-700 dark:text-white">Select a conversation</p>
              <p className="text-sm text-gray-500 dark:text-white/70">Choose a friend from the left or search to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Audio Call Modals */}
      {incomingCall && (
        <IncomingCallModal
          callerName={conversations.find(c => c.participants?.some(p => p._id === incomingCall.from))?.participantNames?.[0] || 'Unknown'}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {isCallActive && (
        <AudioCall
          remoteStream={remoteStream}
          isMuted={isMuted}
          callDuration={callDuration}
          onToggleMute={toggleMute}
          onEndCall={endCall}
          callerName={conversations.find(c => c._id === selectedConversation)?.participantNames?.[0] || 'Unknown'}
        />
      )}
    </div>
  );
}

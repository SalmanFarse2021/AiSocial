"use client";
import { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { apiGet, apiPost, apiDelete, apiPatch } from '@/lib/api';
import { isVideoMedia } from '@/lib/media';
import {
  initSocket,
  disconnectSocket,
  emitSendMessage,
  emitJoinConversation,
  emitLeaveConversation,
  onMessageReceived,
  emitTyping,
  onUserTyping,
  getSocket
} from '@/lib/socket';
import { useCall } from '@/contexts/CallContext';
import ConversationInfo from './ConversationInfo';

const formatTime = (time) => {
  if (time === undefined || time === null || isNaN(time) || time === Infinity) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const VoiceMessage = ({ src, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onEnded = () => setIsPlaying(false);
    const onLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, []);



  return (
    <div className={`flex items-center gap-3 min-w-[180px] py-1 ${isMe ? 'text-white' : 'text-black dark:text-white'}`}>
      <button onClick={togglePlay} className="focus:outline-none flex-shrink-0">
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      <div className="flex flex-col flex-1 min-w-0 gap-1">
        {/* Waveform Visual (Simulated) */}
        <div className="flex items-center gap-[2px] h-6">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full bg-current transition-all duration-300 ${i / 15 * 100 < progress ? 'opacity-100' : 'opacity-40'}`}
              style={{ height: `${30 + Math.abs(Math.sin(i)) * 70}%` }}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono opacity-80">{formatTime(duration || 0)}</span>
      </div>
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
};

export default function Messenger({ conversationId, compact = false }) {
  const { dispatch: callDispatch } = useCall();
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(conversationId);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [activeMessageMenu, setActiveMessageMenu] = useState(null); // ID of message with open menu
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // New state for pause
  const [recordingTime, setRecordingTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

    // Listen for typing indicators
    onUserTyping(({ userId, isTyping }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    // Listen for presence
    socket.on('user-online', (userId) => {
      setOnlineUsers(prev => new Set(prev).add(userId));
    });

    socket.on('user-offline', (userId) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
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
    }

    if (selectedConversation) {
      // Mark as read immediately when opening
      const markRead = async () => {
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/messages/conversations/${selectedConversation}/mark-read`,
            {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }
          );
          // Update local conversation state to reflect read
          setConversations(prev => prev.map(c =>
            c._id === selectedConversation ? { ...c, isUnread: false } : c
          ));
        } catch (e) {
          console.error('Failed to mark read', e);
        }
      };
      markRead();
    }

    fetchMessages();
    return () => {
      emitLeaveConversation(selectedConversation);
    };
  }, [selectedConversation]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Recording timer
  useEffect(() => {
    if (!isRecording || isPaused) return; // Stop timer if paused
    const interval = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

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
      setIsPaused(false);
      setRecordingTime(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const sendVoiceMessage = async () => {
    if (!mediaRecorderRef.current) return;

    if (mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      // Upload voice message
      try {
        const formData = new FormData();
        formData.append('file', audioBlob, 'voice-message.webm');
        formData.append('type', 'voice');

        const token = localStorage.getItem('token');
        const uploadResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/upload`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );

        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          await sendMessage(data.url, 'voice');
        } else {
          console.error('Voice upload failed');
        }
      } catch (e) {
        console.error('Failed to upload voice message', e);
      }

      // Reset state after sending
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
      audioChunksRef.current = [];
    };
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      // Upload media first
      formData.append('type', 'message-image');
      const uploadResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/upload`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (uploadResponse.ok) {
        const data = await uploadResponse.json();
        // Send message with attachment
        const payload = {
          content: 'Sent an image',
          type: 'image',
          attachment: { type: 'image', url: data.url }
        };

        const msgResponse = await fetch(
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

        if (msgResponse.ok) {
          const msgData = await msgResponse.json();
          setMessages((prev) => [...prev, msgData.message]);
          emitSendMessage(selectedConversation, msgData.message);
        }
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
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

  const handleDeleteMessage = async (messageId) => {
    try {
      await apiDelete(`/api/messages/messages/${messageId}`);
      setMessages((prev) =>
        prev.map(msg =>
          msg._id === messageId
            ? { ...msg, isDeleted: true, content: '[Message deleted]', attachment: null }
            : msg
        )
      );
      setActiveMessageMenu(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };



  const handleMuteConversation = async () => {
    if (!selectedConversation) return;
    try {
      await apiPatch(`/api/messages/conversations/${selectedConversation}/mute`);
      // Optimistically update or re-fetch (re-fetch is safer for consistency)
      // For now, toggle state in local conversation list to reflect checkmark if possible
      // But we will likely reload the list or just show a toast.
      console.log('Conversation muted/unmuted');
    } catch (error) {
      console.error('Failed to mute conversation:', error);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) return;

    try {
      await apiDelete(`/api/messages/conversations/${selectedConversation}`);
      window.location.reload(); // Simple reload to reset state
    } catch (error) {
      console.error('Failed to delete conversation:', error);
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
        setIsNewMessageModalOpen(false);
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

  const onEmojiClick = (emojiObject) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
    // setShowEmojiPicker(false);
  };



  const initiateCall = (toUserId, type, userDetails) => {
    if (!selectedConversation) return;

    console.log('[Call] Initiating call to:', toUserId, 'Type:', type);
    const socket = getSocket();
    if (socket) {
      console.log('[Call] Socket is connected, emitting call:invite');
      callDispatch({
        type: 'START_OUTGOING_CALL',
        payload: {
          callId: null,
          callType: type,
          callee: userDetails
        }
      });

      socket.emit('call:invite', {
        toUserId: toUserId,
        callType: type,
        conversationId: selectedConversation
      });
    } else {
      console.error('[Call] Socket is not connected!');
      alert('Connection error. Please refresh the page.');
    }
  };


  const handleMessageInput = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (selectedConversation) {
      emitTyping(selectedConversation, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set a new timeout to clear typing indicator after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedConversation) {
        emitTyping(selectedConversation, false);
      }
      // Local clean up just in case
    }, 3000);
  };

  const handleSendKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(newMessage);
    }
  };



  const currentConversationData = conversations.find(c => c._id === selectedConversation);

  // --- Instagram Style Render ---

  if (compact) {
    // Compact View (e.g. for Popups/Widgets) - Adjusted to match aesthetic
    return (
      <div className="h-full flex flex-col bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        {/* Using simplified placeholder for compact to keep focus on main page redesign */}
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          Compact view not fully redesigned yet.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-black text-black dark:text-white font-sans overflow-hidden relative">

      {/* --- New Message Modal --- */}
      {isNewMessageModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            {/* Modal Header */}
            <div className="border-b border-gray-200 dark:border-zinc-800 p-3 flex items-center justify-between">
              <button onClick={() => setIsNewMessageModalOpen(false)} className="text-2xl leading-none">&times;</button>
              <h2 className="font-bold text-base">New message</h2>
              <button className="text-blue-500 font-semibold text-sm disabled:opacity-50" disabled>Chat</button>
            </div>

            {/* To: Input */}
            <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-zinc-800">
              <span className="font-semibold text-base">To:</span>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => searchFriends(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent focus:outline-none text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-2">
              {searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div
                    key={user._id}
                    onClick={() => startConversation(user._id)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                  >
                    {user.profilePic ? (
                      <img src={user.profilePic} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-zinc-700 flex items-center justify-center font-bold text-white">
                        {user.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{user.username}</h4>
                      <p className="text-xs text-gray-500">{user.displayName}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-sm text-gray-500">No account found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Sidebar --- */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-[24rem] flex-col border-r border-gray-200 dark:border-zinc-800 flex-shrink-0`}>

        {/* Sidebar Header */}
        <div className="px-6 pt-6 pb-4 flex justify-between items-center bg-white dark:bg-black sticky top-0 z-10">
          <h1 className="text-xl font-bold flex items-center gap-1 cursor-pointer">
            {currentUser?.username} <span className="text-xs">▼</span>
          </h1>
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors active:scale-95 duration-200"
            onClick={() => setIsNewMessageModalOpen(true)}
            title="New Message"
          >
            <svg aria-label="New Message" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
              <path d="M16.788 3.553a2.97 2.97 0 0 1 4.2 4.2l-9.873 9.873a2.76 2.76 0 0 1-1.076.636l-4.223 1.326a1.05 1.05 0 0 1-1.31-1.31l1.326-4.223a2.76 2.76 0 0 1 .636-1.076L16.788 3.553Z"></path>
              <path d="M11 17L7 21"></path>
            </svg>
          </button>
        </div>

        {/* Note / Active List (Optional Placeholder) */}
        <div className="px-6 pb-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1 cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-zinc-800 relative flex items-center justify-center">
                {currentUser?.profilePic ? (
                  <img src={currentUser.profilePic} alt="Me" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="text-2xl font-bold">{currentUser?.username?.[0]?.toUpperCase()}</div>
                )}
                <div className="absolute -top-1 -right-1 bg-gray-100 dark:bg-zinc-800 rounded-full p-[2px]">
                  <div className="bg-gray-300 dark:bg-zinc-700 w-5 h-5 rounded-full flex items-center justify-center">
                    <span className="text-xs">+</span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-500">Your Note</span>
            </div>
            {/* Could map active users here */}
          </div>
        </div>


        {/* Search */}
        {/* <div className="px-5 mb-4 mt-2">
            <div className="bg-gray-100 dark:bg-zinc-800 rounded-xl px-4 py-2 flex items-center">
                <svg color="currentColor" fill="currentColor" height="16" role="img" viewBox="0 0 24 24" width="16" className="text-gray-400 mr-2"><path d="M19 10.5A8.5 8.5 0 1 1 10.5 2a8.5 8.5 0 0 1 8.5 8.5Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="16.511" x2="22" y1="16.511" y2="22"></line></svg>
                 <input 
                  value={searchQuery}
                  onChange={(e) => {
                    searchFriends(e.target.value);
                    filterConversations(e.target.value);
                  }}
                  placeholder="Search" 
                  className="bg-transparent border-none focus:outline-none text-sm w-full placeholder-gray-500"
                />
            </div>
        </div> */}

        {/* Messages / Requests Tabs */}
        <div className="flex px-6 border-b border-gray-200 dark:border-zinc-800 mb-2">
          <button className="flex-1 pb-3 border-b-2 border-black dark:border-white font-semibold text-sm">Messages</button>
          <button className="flex-1 pb-3 text-gray-400 font-semibold text-sm">Requests</button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2">
          {filteredConversations.map(conv => {
            const isActive = selectedConversation === conv._id;
            const otherParticipant = conv.participants?.find(p => p._id !== currentUser?._id) || {};
            const isUnread = false; // logic for unread

            return (
              <div
                key={conv._id}
                onClick={() => {
                  setSelectedConversation(conv._id);
                  setShowSearchResults(false);
                }}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-gray-100 dark:bg-zinc-900' : 'hover:bg-gray-50 dark:hover:bg-zinc-900/50'}`}
              >
                <div className="relative">
                  {otherParticipant.profilePic ? (
                    <img src={otherParticipant.profilePic} alt={otherParticipant.username} className="w-14 h-14 rounded-full object-cover border border-gray-200 dark:border-zinc-800" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px]">
                      <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center">
                        {otherParticipant.username?.[0]?.toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{conv.participantNames?.filter(n => n !== currentUser?.username).join(', ')}</h4>
                  <p className={`text-sm truncate ${isUnread ? 'font-bold text-black dark:text-white' : 'text-gray-500 dark:text-zinc-400'}`}>
                    {conv.lastMessage || 'Sent a message'} • {formatTime(conv.updatedAt)}
                  </p>
                </div>
                {isUnread && <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- Chat Area --- */}
      {selectedConversation ? (
        <div className="flex flex-1 flex-col bg-white dark:bg-black relative">

          {/* Top Bar */}
          <div className="h-[75px] border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Mobile Back */}
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden mr-2"
              >
                <svg color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M21 17.502a.997.997 0 0 1-.707-.293L12 8.913l-8.293 8.296a1 1 0 1 1-1.414-1.414l9-9.004a1 1 0 0 1 1.414 0l9 9.004A1 1 0 0 1 21 17.502Z" transform="rotate(-90 12 12)"></path></svg>
              </button>

              <div className="flex items-center gap-3">
                {conversations.find(c => c._id === selectedConversation)?.participants?.find(p => p._id !== currentUser?._id)?.profilePic ? (
                  <img
                    src={conversations.find(c => c._id === selectedConversation)?.participants?.find(p => p._id !== currentUser?._id)?.profilePic}
                    className="w-10 h-10 rounded-full object-cover"
                    alt="User"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800" />
                )}

                <div>
                  <h3 className="font-semibold text-base">
                    {conversations.find(c => c._id === selectedConversation)?.participantNames?.filter(n => n !== currentUser?.username).join(', ') || 'User'}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {onlineUsers.has(conversations.find(c => c._id === selectedConversation)?.participants?.find(p => p._id !== currentUser?._id)?._id) ? 'Active now' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const otherUser = conversations.find(c => c._id === selectedConversation)?.participants?.find(p => p._id !== currentUser?._id);
                  if (otherUser) initiateCall(otherUser._id, 'audio', otherUser);
                }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-indigo-500 dark:text-indigo-400 transition-colors active:scale-95 duration-200"
                title="Voice Call"
              >
                <svg aria-label="Audio Call" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M2.003 5.884c0-1.253 1.137-2.128 2.277-1.854l3.636.873a2.057 2.057 0 0 1 1.488 1.401l.835 2.923a1.947 1.947 0 0 1-.78 2.22l-2.094 1.34b.268.268 0 0 0-.087.355c.96 1.766 2.33 3.136 4.097 4.097.113.061.25.03.355-.087l1.339-2.093a1.945 1.945 0 0 1 2.22-.78l2.923.834a2.057 2.057 0 0 1 1.402 1.488l.872 3.636c.274 1.14-.601 2.277-1.854 2.277a2.025 2.025 0 0 1-2.025-2.025c0-10.236-8.289-18.525-18.525-18.525A2.025 2.025 0 0 1 2.003 5.884Z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const otherUser = conversations.find(c => c._id === selectedConversation)?.participants?.find(p => p._id !== currentUser?._id);
                  if (otherUser) initiateCall(otherUser._id, 'video', otherUser);
                }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-indigo-500 dark:text-indigo-400 transition-colors active:scale-95 duration-200"
                title="Video Call"
              >
                <svg aria-label="Video Call" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                  <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
                </svg>
              </button>
              <button
                onClick={() => setShowChatInfo(!showChatInfo)}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors active:scale-95 duration-200 ${showChatInfo ? 'text-blue-500 bg-gray-100 dark:bg-zinc-800' : 'text-indigo-500 dark:text-indigo-400'}`}
                title="Conversation Info"
              >
                <svg aria-label="View Info" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.465-2.127-1.708l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.02ZM12 6.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {messages.map((msg, idx) => {
              const isMe = msg.sender?._id === currentUser?._id;
              const isLast = idx === messages.length - 1;
              const isNextSame = messages[idx + 1]?.sender?._id === msg.sender?._id;

              return (
                <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-${isNextSame ? '1' : '4'}`}>
                  {/* Avatar for Them */}
                  {!isMe && (
                    <div className="w-8 h-8 mr-2 flex-shrink-0 self-end mb-1">
                      {!isNextSame && (
                        msg.sender?.profilePic ? (
                          <img src={msg.sender.profilePic} className="w-8 h-8 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-zinc-700" />
                        )
                      )}
                    </div>
                  )}

                  {/* Bubble */}
                  {/* Message Wrapper for Menu */}
                  <div className={`group flex items-center gap-2 max-w-[75%] ${isMe ? 'flex-row' : ''}`}>

                    {/* Three-Dot Menu (Only for Me & Not Deleted) */}
                    {isMe && !msg.isDeleted && (
                      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMessageMenu(activeMessageMenu === msg._id ? null : msg._id);
                          }}
                          className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 ${activeMessageMenu === msg._id ? 'opacity-100 bg-gray-100 dark:bg-zinc-800' : ''}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M4.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clipRule="evenodd" />
                          </svg>
                        </button>

                        {/* Dropdown */}
                        {activeMessageMenu === msg._id && (
                          <div className="absolute bottom-full right-0 mb-1 bg-white dark:bg-zinc-900 shadow-xl rounded-lg py-1 z-20 w-32 border border-gray-200 dark:border-zinc-700 overflow-hidden">
                            <button
                              onClick={() => handleDeleteMessage(msg._id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.65l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`px-4 py-2 text-[15px] leading-snug break-words w-full shadow-sm ${msg.isDeleted
                      ? 'bg-transparent border border-gray-200 dark:border-zinc-800 text-gray-400 italic rounded-[20px]'
                      : isMe
                        ? 'bg-gradient-to-l from-indigo-500 via-purple-500 to-indigo-500 text-white rounded-[20px] rounded-br-[4px]'
                        : 'bg-gray-200 dark:bg-zinc-800 text-black dark:text-white rounded-[20px] rounded-bl-[4px]'
                      }`}>
                      {msg.isDeleted ? (
                        <span>Message deleted</span>
                      ) : msg.attachment?.type === 'voice' ? (
                        <VoiceMessage src={msg.attachment.url} isMe={isMe} />
                      ) : msg.attachment?.type === 'image' ? (
                        <div className="-mx-2 -my-1">
                          <img
                            src={msg.attachment.url}
                            alt="Attachment"
                            className="rounded-lg max-w-full max-h-[300px] object-cover cursor-pointer hover:opacity-95 transition"
                            onClick={() => window.open(msg.attachment.url, '_blank')}
                          />
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <div className="flex justify-start mb-4">
                <div className="w-8 h-8 mr-2 flex-shrink-0 self-end mb-1">
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-zinc-700 animate-pulse" />
                </div>
                <div className="bg-gray-200 dark:bg-zinc-800 text-black dark:text-white rounded-[20px] rounded-bl-[4px] px-4 py-3 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-black relative">
            {isRecording ? (                /* Recording UI Overlay */
              <div className="flex items-center justify-between bg-gray-100 dark:bg-zinc-800 rounded-[28px] px-3 py-2 border border-red-500/30 w-full transition-all duration-200">
                <div className="flex items-center gap-3 pl-2">
                  <div className={`w-3 h-3 rounded-full bg-red-500 ${!isPaused ? 'animate-pulse' : ''}`} />
                  <span className="font-mono text-red-600 dark:text-red-400 font-bold text-lg tracking-wider min-w-[3.5rem]">{formatTime(recordingTime)}</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Cancel */}
                  <button onClick={cancelRecording} className="p-2 text-gray-500 hover:text-red-500 transition" title="Cancel">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Restart */}
                  <button onClick={() => { cancelRecording(); startRecording(); }} className="p-2 text-gray-500 hover:text-black dark:hover:text-white transition" title="Restart">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h5.5a.75.75 0 0 0 .75-.75v-5.5a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5h-5.5a.75.75 0 0 0-.75.75v5.5a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Pause/Resume */}
                  <button onClick={isPaused ? resumeRecording : pauseRecording} className="p-2 text-gray-500 hover:text-black dark:hover:text-white transition" title={isPaused ? "Resume" : "Pause"}>
                    {isPaused ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-red-500">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-red-500">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM9 8.25a.75.75 0 0 0-.75.75v6a.75.75 0 0 0 1.5 0v-6a.75.75 0 0 0-.75-.75Zm6 0a.75.75 0 0 0-.75.75v6a.75.75 0 0 0 1.5 0v-6a.75.75 0 0 0-.75-.75Z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  {/* Send */}
                  <button onClick={sendVoiceMessage} className="p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition shadow-md" title="Send">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center bg-white dark:bg-black border border-gray-300 dark:border-zinc-700 rounded-[28px] px-2 py-1.5 focus-within:border-gray-400 dark:focus-within:border-zinc-500 transition-colors relative">

                {/* Emoji Picker Popup */}
                {showEmojiPicker && (
                  <div className="absolute bottom-12 left-0 z-50">
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      theme="auto"
                      width={300}
                      height={400}
                    />
                  </div>
                )}

                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 transition ${showEmojiPicker ? 'text-blue-500' : 'text-gray-900 dark:text-white hover:text-blue-500'}`}
                >
                  <svg aria-label="Emoji" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"></path></svg>
                </button>
                <input
                  value={newMessage}
                  onChange={handleMessageInput}
                  onKeyDown={handleSendKey}
                  placeholder="Message..."
                  className="flex-1 bg-transparent border-none focus:outline-none px-2 text-sm text-black dark:text-white placeholder-gray-500 dark:placeholder-zinc-400"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageSelect}
                />

                {newMessage.trim() ? (
                  <button
                    onClick={() => sendMessage(newMessage)}
                    className="p-2 text-blue-500 font-semibold text-sm hover:text-blue-600 transition"
                  >
                    Send
                  </button>
                ) : (
                  <div className="flex items-center">
                    <button
                      onClick={startRecording}
                      className="p-2 text-indigo-500 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors active:scale-110 duration-200"
                      title="Hold to record"
                    >
                      <svg aria-label="Voice Clip" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M12 2.25a3 3 0 0 0-3 3v4.5a3 3 0 0 0 6 0V5.25a3 3 0 0 0-3-3ZM15.75 9V5.25a3.75 3.75 0 1 0-7.5 0V9a3.75 3.75 0 0 0 7.5 0ZM7.25 10.5a.75.75 0 0 0-1.5 0v.107c0 2.972 2.062 5.518 4.875 6.257V19.5H7.875a.75.75 0 0 0 0 1.5h8.25a.75.75 0 0 0 0-1.5h-2.75v-2.636c2.813-.739 4.875-3.285 4.875-6.257V10.5a.75.75 0 0 0-1.5 0v.107c0 2.69-2.183 4.893-4.875 4.893-2.692 0-4.875-2.203-4.875-4.893V10.5Z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-indigo-500 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                      title="Attach Image"
                    >
                      <svg aria-label="Add Photo" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" /></svg>
                    </button>
                    <button
                      onClick={() => sendMessage('❤️')}
                      className="p-2 text-red-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                      title="Send Like"
                    >
                      <svg aria-label="Like" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-1a5.172 5.172 0 0 0-4.687 2.652 5.132 5.132 0 0 0-4.496-2.652 5.968 5.968 0 0 0-5.992 6.218c0 3.635 2.858 6.095 6.012 8.783 2.531 2.157 3.766 3.268 3.966 3.46a1.006 1.006 0 0 0 1.411 0c.2-.192 1.435-1.303 3.966-3.46 3.155-2.688 6.012-5.148 6.012-8.783a5.968 5.968 0 0 0-5.992-6.218Z"></path></svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Panel Side Bar */}
          {showChatInfo && selectedConversation && (
            <ConversationInfo
              conversation={currentConversationData}
              messages={messages}
              currentUserId={currentUser?._id}
              onClose={() => setShowChatInfo(false)}
              onMute={handleMuteConversation}
              onDelete={handleDeleteConversation}
              onBlock={() => alert('Block functionality coming soon')}
            />
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-white dark:bg-black p-8 text-center">
          <div className="w-24 h-24 border-2 border-black dark:border-white rounded-full flex items-center justify-center mb-4">
            <svg aria-label="Direct" color="currentColor" fill="currentColor" height="50" role="img" viewBox="0 0 24 24" width="50"><path d="M12.003 2.001a9.998 9.998 0 1 0 0 19.996 9.998 9.998 0 0 0 0-19.996Zm0 18.595a8.597 8.597 0 1 1 0-17.194 8.597 8.597 0 0 1 0 17.194Z"></path><path d="M12.053 10.398a1.328 1.328 0 0 0-1.879 0l-3.32 3.319a.75.75 0 1 0 1.06 1.06l2.16-2.159v6.634a.75.75 0 0 0 1.5 0v-6.633l2.159 2.159a.75.75 0 0 0 1.06-1.06Z"></path></svg>
          </div>
          <h2 className="text-xl font-medium mb-1">Your Messages</h2>
          <p className="text-gray-500 mb-6 text-sm">Send private photos and messages to a friend or group.</p>
          <button className="bg-blue-500 text-white px-4 py-1.5 rounded-lg font-semibold text-sm hover:bg-blue-600 transition">
            Send Message
          </button>
        </div>
      )}
    </div>
  );
}

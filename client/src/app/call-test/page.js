'use client';

import React, { useState, useEffect } from 'react';
import { useCall } from '@/contexts/CallContext';
import { getSocket, initSocket } from '@/lib/socket';

const CallTest = () => {
  const [status, setStatus] = useState([]);
  const [testUser, setTestUser] = useState(null);
  const {
    isCallActive,
    callType,
    incomingCall,
    remoteUser,
    localStream,
    remoteStream,
    initiateCall,
    answerCall,
    endCall,
  } = useCall();

  const addStatus = (message) => {
    setStatus(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    // Get current user
    const fetchUser = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/users/me`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        if (response.ok) {
          const data = await response.json();
          const user = data.user || data;
          setTestUser(user);
          addStatus(`✅ Logged in as: ${user.username}`);
          
          // Initialize socket
          const socket = initSocket(user._id);
          addStatus(`🔌 Socket initializing...`);
          
          setTimeout(() => {
            const sock = getSocket();
            if (sock && sock.connected) {
              addStatus(`✅ Socket connected: ${sock.id}`);
            } else {
              addStatus(`❌ Socket not connected`);
            }
          }, 1000);
        }
      } catch (error) {
        addStatus(`❌ Error fetching user: ${error.message}`);
      }
    };
    fetchUser();
  }, []);

  const testMicrophonePermission = async () => {
    try {
      addStatus('🎤 Testing microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addStatus('✅ Microphone access granted');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      addStatus(`❌ Microphone error: ${error.message}`);
    }
  };

  const testCameraPermission = async () => {
    try {
      addStatus('📹 Testing camera permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      addStatus('✅ Camera access granted');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      addStatus(`❌ Camera error: ${error.message}`);
    }
  };

  const testSocketConnection = () => {
    const socket = getSocket();
    if (socket) {
      addStatus(`Socket exists: ${socket.id || 'No ID'}`);
      addStatus(`Socket connected: ${socket.connected}`);
      addStatus(`Socket disconnected: ${socket.disconnected}`);
    } else {
      addStatus('❌ Socket is null');
    }
  };

  const testAudioCall = async () => {
    if (!testUser) {
      addStatus('❌ No user logged in');
      return;
    }
    
    addStatus('📞 Initiating test audio call...');
    
    // You need to replace this with an actual user ID to call
    const testUserId = '673f84f6ddfd3ceafe91e39a'; // Replace with real user ID
    
    try {
      await initiateCall(testUserId, 'audio', {
        _id: testUserId,
        username: 'Test User',
        profilePic: null,
      });
      addStatus('✅ Audio call initiated');
    } catch (error) {
      addStatus(`❌ Call error: ${error.message}`);
    }
  };

  const testVideoCall = async () => {
    if (!testUser) {
      addStatus('❌ No user logged in');
      return;
    }
    
    addStatus('📹 Initiating test video call...');
    
    // You need to replace this with an actual user ID to call
    const testUserId = '673f84f6ddfd3ceafe91e39a'; // Replace with real user ID
    
    try {
      await initiateCall(testUserId, 'video', {
        _id: testUserId,
        username: 'Test User',
        profilePic: null,
      });
      addStatus('✅ Video call initiated');
    } catch (error) {
      addStatus(`❌ Call error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Audio/Video Call Test Page</h1>
        
        {/* User Info */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">👤 Current User</h2>
          {testUser ? (
            <div>
              <p><strong>Username:</strong> {testUser.username}</p>
              <p><strong>ID:</strong> {testUser._id}</p>
              <p><strong>Email:</strong> {testUser.email}</p>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>

        {/* Test Buttons */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">🧪 Run Tests</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={testMicrophonePermission}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-all"
            >
              Test Microphone
            </button>
            <button
              onClick={testCameraPermission}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg transition-all"
            >
              Test Camera
            </button>
            <button
              onClick={testSocketConnection}
              className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition-all"
            >
              Test Socket
            </button>
            <button
              onClick={testAudioCall}
              className="bg-orange-600 hover:bg-orange-700 px-4 py-3 rounded-lg transition-all"
            >
              Test Audio Call
            </button>
            <button
              onClick={testVideoCall}
              className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg transition-all"
            >
              Test Video Call
            </button>
            <button
              onClick={endCall}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded-lg transition-all"
            >
              End Call
            </button>
          </div>
        </div>

        {/* Call State */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📞 Call State</h2>
          <div className="space-y-2">
            <p><strong>Call Active:</strong> {isCallActive ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Call Type:</strong> {callType || 'None'}</p>
            <p><strong>Incoming Call:</strong> {incomingCall ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Remote User:</strong> {remoteUser?.username || 'None'}</p>
            <p><strong>Local Stream:</strong> {localStream ? '✅ Active' : '❌ None'}</p>
            <p><strong>Remote Stream:</strong> {remoteStream ? '✅ Active' : '❌ None'}</p>
          </div>
          
          {incomingCall && (
            <div className="mt-4 p-4 bg-blue-900 rounded-lg">
              <p className="font-bold">Incoming Call from: {incomingCall.fromName}</p>
              <div className="flex gap-4 mt-4">
                <button
                  onClick={answerCall}
                  className="bg-green-600 px-6 py-2 rounded-lg"
                >
                  Answer
                </button>
                <button
                  onClick={() => addStatus('Call rejected')}
                  className="bg-red-600 px-6 py-2 rounded-lg"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status Log */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">📋 Status Log</h2>
          <div className="bg-black rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
            {status.length === 0 ? (
              <p className="text-gray-500">No status messages yet...</p>
            ) : (
              status.map((msg, i) => (
                <p key={i} className="mb-1">{msg}</p>
              ))
            )}
          </div>
          <button
            onClick={() => setStatus([])}
            className="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-all"
          >
            Clear Log
          </button>
        </div>

        {/* Video Preview */}
        {(localStream || remoteStream) && (
          <div className="bg-gray-900 rounded-lg p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">📺 Video Preview</h2>
            <div className="grid grid-cols-2 gap-4">
              {localStream && (
                <div>
                  <p className="mb-2">Local Stream:</p>
                  <video
                    ref={(el) => {
                      if (el) el.srcObject = localStream;
                    }}
                    autoPlay
                    muted
                    playsInline
                    className="w-full rounded-lg bg-black"
                  />
                </div>
              )}
              {remoteStream && (
                <div>
                  <p className="mb-2">Remote Stream:</p>
                  <video
                    ref={(el) => {
                      if (el) el.srcObject = remoteStream;
                    }}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg bg-black"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallTest;

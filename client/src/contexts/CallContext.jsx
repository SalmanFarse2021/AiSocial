'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { getSocket } from '@/lib/socket';

const CallContext = createContext();

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within CallProvider');
  }
  return context;
};

export const CallProvider = ({ children }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState(null); // 'audio' or 'video'
  const [incomingCall, setIncomingCall] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  
  // Call state management
  const [callStatus, setCallStatus] = useState('idle'); // 'idle', 'calling', 'ringing', 'connected', 'reconnecting', 'busy'
  const [networkQuality, setNetworkQuality] = useState('good'); // 'excellent', 'good', 'poor', 'disconnected'
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const peerConnectionRef = useRef(null);
  const missedCallTimeoutRef = useRef(null);
  const ringtoneRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const networkQualityIntervalRef = useRef(null);

  // Enhanced ICE server configuration with TURN servers
  const iceServers = {
    iceServers: [
      // Google STUN servers for NAT traversal
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      
      // Open Relay Project - Free TURN servers
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      
      // Twilio STUN (backup)
      { urls: 'stun:global.stun.twilio.com:3478' },
      
      // Production TURN servers (configure with environment variables)
      ...(process.env.NEXT_PUBLIC_TURN_SERVER_URL ? [{
        urls: process.env.NEXT_PUBLIC_TURN_SERVER_URL,
        username: process.env.NEXT_PUBLIC_TURN_USERNAME,
        credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
      }] : []),
    ],
    iceCandidatePoolSize: 10, // Pre-gather ICE candidates
    iceTransportPolicy: 'all', // Use both STUN and TURN
  };

  // Initialize ringtone
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        ringtoneRef.current = new Audio('/sounds/ringtone.mp3');
        ringtoneRef.current.loop = true;
      } catch (error) {
        console.log('Could not load ringtone');
      }
    }
  }, []);

  const cleanupCall = useCallback(() => {
    console.log('🧹 Cleaning up call');

    // Stop screen sharing if active
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }

    // Stop ringtone
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }

    // Clear timeouts and intervals
    if (missedCallTimeoutRef.current) {
      clearTimeout(missedCallTimeoutRef.current);
      missedCallTimeoutRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (networkQualityIntervalRef.current) {
      clearInterval(networkQualityIntervalRef.current);
      networkQualityIntervalRef.current = null;
    }

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Reset all state
    setIsCallActive(false);
    setCallType(null);
    setIncomingCall(null);
    setRemoteUser(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setCallStartTime(null);
    setCurrentCallId(null);
    setCallStatus('idle');
    setNetworkQuality('good');
    setIsReconnecting(false);
    setReconnectAttempts(0);
  }, [localStream, screenStream]);

  // Setup socket listeners
  useEffect(() => {
    // Wait for socket to be initialized
    const checkSocket = setInterval(() => {
      const socket = getSocket();
      if (socket && socket.connected) {
        clearInterval(checkSocket);
        setupSocketListeners();
      }
    }, 100);

    const setupSocketListeners = () => {
      const socket = getSocket();
      if (!socket) return;

      console.log('✅ Setting up call socket listeners');

    // Handle incoming call
    socket.on('incoming-call', async (data) => {
      console.log('📞 Incoming call from:', data.fromName || data.from, 'Type:', data.callType);
      
      // Check if already on a call
      if (isCallActive) {
        console.log('⚠️ User is busy on another call');
        // Send busy signal
        socket?.emit('call-busy', {
          to: data.from,
          from: JSON.parse(localStorage.getItem('user') || '{}')._id,
        });
        return;
      }
      
      setIncomingCall({
        from: data.from,
        fromName: data.fromName || 'Unknown User',
        fromPic: data.fromPic,
        offer: data.offer,
        callType: data.callType,
        callId: data.callId,
      });
      setCallStatus('ringing');

      console.log('🔔 Showing incoming call popup for:', data.fromName || 'Unknown User');

      // Play ringtone
      try {
        if (ringtoneRef.current) {
          ringtoneRef.current.play().catch(e => console.log('Ringtone play failed:', e));
        }
      } catch (error) {
        console.log('Could not play ringtone');
      }

      // Set 30-second timeout for missed call
      missedCallTimeoutRef.current = setTimeout(async () => {
        console.log('Call timeout - marking as missed');
        try {
          const token = localStorage.getItem('token');
          await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/calls/${data.callId}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status: 'missed' }),
            }
          );
        } catch (error) {
          console.error('Failed to update call status:', error);
        }
        setIncomingCall(null);
        if (ringtoneRef.current) {
          ringtoneRef.current.pause();
          ringtoneRef.current.currentTime = 0;
        }
      }, 30000);
    });

    // Handle call answered
    socket.on('call-answered', async (data) => {
      console.log('✅ Call answered by:', data.from);
      console.log('📡 Setting remote description with answer');
      
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }

      try {
        if (peerConnectionRef.current && data.answer) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          console.log('✅ Remote description set successfully');
          console.log('🎬 Call is now active, waiting for ICE connection...');
          
          // Set call start time for caller
          setCallStartTime(Date.now());
          setCallStatus('connected');
          
          console.log('📞 Call start time set, both sides should be connected');
        } else {
          console.error('❌ No peer connection or answer data');
        }
      } catch (error) {
        console.error('Error setting remote description:', error);
        cleanupCall();
      }
    });

    // Handle ICE candidates
    socket.on('ice-candidate', async (data) => {
      console.log('🧊 Received ICE candidate from:', data.from);
      
      try {
        if (!peerConnectionRef.current) {
          console.warn('⚠️ No peer connection yet, cannot add ICE candidate');
          return;
        }

        if (!data.candidate) {
          console.warn('⚠️ No candidate data received');
          return;
        }

        // Check if remote description is set before adding candidate
        if (!peerConnectionRef.current.remoteDescription) {
          console.warn('⚠️ Remote description not set yet, waiting...');
          // Queue the candidate to be added after remote description
          setTimeout(async () => {
            if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
              console.log('✅ Queued ICE candidate added');
            }
          }, 100);
          return;
        }

        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
        console.log('✅ ICE candidate added successfully');
      } catch (error) {
        console.error('❌ Error adding ICE candidate:', error);
      }
    });

    // Handle call rejected
    socket.on('call-rejected', () => {
      console.log('❌ Call rejected');
      
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
      
      cleanupCall();
      alert('Call was declined');
    });

    // Handle call busy
    socket.on('call-busy', () => {
      console.log('📵 User is busy');
      
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
      
      setCallStatus('busy');
      cleanupCall();
      alert('User is currently on another call');
    });

    // Handle call ended
    socket.on('call-ended', () => {
      console.log('📴 Call ended by remote user');
      cleanupCall();
    });

    // Handle call type changed
    socket.on('call-type-changed', (data) => {
      console.log('🔄 Remote user changed call type to:', data.callType);
      setCallType(data.callType);
    });

    // Handle call reconnect request
    socket.on('call-reconnect', async (data) => {
      console.log('🔄 Reconnect request from:', data.from);
      
      try {
        if (peerConnectionRef.current && data.offer) {
          // Set remote description with new offer
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );
          
          // Create answer
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          
          // Send answer back
          socket?.emit('answer-call', {
            to: data.from,
            answer: answer,
          });
          
          setCallStatus('connected');
          setIsReconnecting(false);
        }
      } catch (error) {
        console.error('Error handling reconnect:', error);
      }
    });
    };

    return () => {
      clearInterval(checkSocket);
      const socket = getSocket();
      if (socket) {
        socket.off('incoming-call');
        socket.off('call-answered');
        socket.off('ice-candidate');
        socket.off('call-rejected');
        socket.off('call-ended');
        socket.off('call-type-changed');
        socket.off('call-reconnect');
      }
    };
  }, [cleanupCall, isCallActive]);

  // Monitor network quality
  const monitorNetworkQuality = useCallback((pc) => {
    if (!pc || networkQualityIntervalRef.current) return;

    networkQualityIntervalRef.current = setInterval(async () => {
      try {
        const stats = await pc.getStats();
        let bytesReceived = 0;
        let packetsLost = 0;
        let totalPackets = 0;

        stats.forEach(report => {
          if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
            bytesReceived += report.bytesReceived || 0;
            packetsLost += report.packetsLost || 0;
            totalPackets += report.packetsReceived || 0;
          }
        });

        // Calculate packet loss percentage
        const packetLoss = totalPackets > 0 ? (packetsLost / totalPackets) * 100 : 0;

        // Determine quality based on packet loss
        if (packetLoss < 1) {
          setNetworkQuality('excellent');
        } else if (packetLoss < 3) {
          setNetworkQuality('good');
        } else if (packetLoss < 10) {
          setNetworkQuality('poor');
        } else {
          setNetworkQuality('disconnected');
        }
      } catch (error) {
        console.error('Error monitoring network quality:', error);
      }
    }, 2000); // Check every 2 seconds
  }, []);

  // Auto-reconnect logic (non-memoized to avoid circular deps)
  const attemptReconnect = async (userId, currentAttempt) => {
    if (currentAttempt >= 3) {
      console.log('❌ Max reconnect attempts reached');
      setIsReconnecting(false);
      setCallStatus('idle');
      alert('Failed to reconnect. Please try calling again.');
      cleanupCall();
      return;
    }

    setIsReconnecting(true);
    setCallStatus('reconnecting');
    setReconnectAttempts(currentAttempt + 1);

    console.log(`🔄 Reconnecting... Attempt ${currentAttempt + 1}/3`);

    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        // Note: Reconnection will be handled by ICE restart
        // For now, just wait and see if connection recovers
        console.log('Waiting for connection to recover...');
        
        // If still disconnected after timeout, try again
        setTimeout(() => {
          if (peerConnectionRef.current && 
              (peerConnectionRef.current.iceConnectionState === 'disconnected' || 
               peerConnectionRef.current.iceConnectionState === 'failed')) {
            attemptReconnect(userId, currentAttempt + 1);
          }
        }, 3000);
      } catch (error) {
        console.error('Reconnect failed:', error);
      }
    }, 2000);
  };

  const createPeerConnection = (userId) => {
    console.log('🎙️ Creating peer connection for:', userId);
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Generated ICE candidate:', event.candidate.type);
        const socket = getSocket();
        socket?.emit('ice-candidate', {
          to: userId,
          candidate: event.candidate,
        });
      } else {
        console.log('✅ ICE gathering completed');
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log('🧊 ICE gathering state:', pc.iceGatheringState);
    };

    pc.onsignalingstatechange = () => {
      console.log('📡 Signaling state:', pc.signalingState);
    };

    pc.ontrack = (event) => {
      console.log('📹 Remote stream received!');
      console.log('🎥 Stream has', event.streams[0].getTracks().length, 'tracks');
      event.streams[0].getTracks().forEach(track => {
        console.log('Track:', track.kind, 'enabled:', track.enabled);
      });
      setRemoteStream(event.streams[0]);
      setCallStatus('connected');
    };

    pc.oniceconnectionstatechange = () => {
      console.log('❄️ ICE connection state:', pc.iceConnectionState);
      
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setCallStatus('connected');
        setIsReconnecting(false);
        setReconnectAttempts(0);
        
        // Start monitoring network quality
        monitorNetworkQuality(pc);
      } else if (pc.iceConnectionState === 'disconnected') {
        setCallStatus('reconnecting');
        setNetworkQuality('disconnected');
        
        // Attempt to reconnect
        if (!isReconnecting) {
          attemptReconnect(userId, reconnectAttempts);
        }
      } else if (pc.iceConnectionState === 'failed') {
        console.log('❌ ICE connection failed');
        if (!isReconnecting && reconnectAttempts < 3) {
          attemptReconnect(userId, reconnectAttempts);
        } else {
          cleanupCall();
        }
      } else if (pc.iceConnectionState === 'checking') {
        setCallStatus('connecting');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔌 Connection state:', pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
      } else if (pc.connectionState === 'disconnected') {
        if (!isReconnecting) {
          setCallStatus('reconnecting');
        }
      } else if (pc.connectionState === 'failed') {
        if (reconnectAttempts < 3 && !isReconnecting) {
          attemptReconnect(userId, reconnectAttempts);
        } else {
          cleanupCall();
        }
      }
    };

    return pc;
  };

  const initiateCall = async (userId, type = 'audio', user = null) => {
    try {
      console.log(`🎬 Initiating ${type} call to:`, userId, 'User:', user?.username);
      
      const socket = getSocket();
      if (!socket || !socket.connected) {
        console.error('❌ Socket not connected');
        alert('Connection error. Please refresh and try again.');
        return;
      }
      
      setCallType(type);
      setRemoteUser(user);
      setCallStatus('calling');
      
      console.log('📞 Call status set to calling, remote user:', user?.username);

      // Get user media
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: type === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        } : false,
      };

      console.log('🎤 Requesting user media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Got local stream with', stream.getTracks().length, 'tracks');
      setLocalStream(stream);

      // Create peer connection
      const pc = createPeerConnection(userId);
      peerConnectionRef.current = pc;

      // Add local stream tracks
      stream.getTracks().forEach((track) => {
        console.log('➕ Adding track to peer connection:', track.kind);
        pc.addTrack(track, stream);
      });

      // Create offer with proper constraints
      console.log('📝 Creating offer...');
      const offerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video',
      };
      const offer = await pc.createOffer(offerOptions);
      await pc.setLocalDescription(offer);
      console.log('✅ Offer created and set as local description');

      // Create call record in database
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/calls`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            receiver: userId,
            callType: type,
          }),
        }
      );

      const data = await response.json();
      setCurrentCallId(data.call._id);

      // Send call signal via socket
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('📤 Sending call to user:', userId, 'from:', currentUser.username || currentUser.fullName);
      
      socket?.emit('call-user', {
        to: userId,
        from: currentUser._id,
        fromName: currentUser.username || currentUser.fullName || 'Unknown User',
        fromPic: currentUser.profilePic || currentUser.avatar,
        offer: offer,
        callType: type,
        callId: data.call._id,
      });

      // Set call as active for caller (so they see the calling screen)
      setIsCallActive(true);

      // Play ringtone for caller
      try {
        if (ringtoneRef.current) {
          ringtoneRef.current.play().catch(e => console.log('Ringtone play failed:', e));
        }
      } catch (error) {
        console.log('Could not play ringtone');
      }

    } catch (error) {
      console.error('Error initiating call:', error);
      cleanupCall();
      alert('Failed to start call. Please check your camera/microphone permissions.');
    }
  };

  const answerCall = async () => {
    try {
      console.log('📞 Answering call');

      // Clear missed call timeout
      if (missedCallTimeoutRef.current) {
        clearTimeout(missedCallTimeoutRef.current);
        missedCallTimeoutRef.current = null;
      }

      // Stop ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }

      if (!incomingCall) return;

      console.log('📞 Setting up call with:', incomingCall.fromName);
      
      setCallType(incomingCall.callType);
      setRemoteUser({
        _id: incomingCall.from,
        username: incomingCall.fromName,
        profilePic: incomingCall.fromPic,
      });
      setCallStatus('connecting');

      // Get user media
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: incomingCall.callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        } : false,
      };

      console.log('🎤 Requesting user media for answer...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Got local stream with', stream.getTracks().length, 'tracks');
      setLocalStream(stream);

      // Create peer connection
      const pc = createPeerConnection(incomingCall.from);
      peerConnectionRef.current = pc;

      // Add local stream tracks
      stream.getTracks().forEach((track) => {
        console.log('➕ Adding track to peer connection:', track.kind);
        pc.addTrack(track, stream);
      });

      // Set remote description
      console.log('📡 Setting remote description from offer...');
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      console.log('✅ Remote description set successfully');

      // Create answer
      console.log('📝 Creating answer...');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('✅ Answer created and set as local description');

      // Update call status in database
      if (incomingCall.callId) {
        const token = localStorage.getItem('token');
        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/calls/${incomingCall.callId}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'answered' }),
          }
        );
        setCurrentCallId(incomingCall.callId);
      }

      // Send answer via socket
      const socket = getSocket();
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('📤 Sending answer to caller:', incomingCall.from);
      
      socket?.emit('answer-call', {
        to: incomingCall.from,
        from: currentUser._id,
        answer: answer,
      });

      // Set call as active and start timer
      setIncomingCall(null);
      setIsCallActive(true);
      setCallStartTime(Date.now());
      setCallStatus('connecting');
      
      console.log('✅ Call answered successfully, waiting for ICE connection...');

    } catch (error) {
      console.error('Error answering call:', error);
      cleanupCall();
      alert('Failed to answer call. Please check your camera/microphone permissions.');
    }
  };

  const rejectCall = async () => {
    console.log('❌ Rejecting call');

    // Clear missed call timeout
    if (missedCallTimeoutRef.current) {
      clearTimeout(missedCallTimeoutRef.current);
      missedCallTimeoutRef.current = null;
    }

    // Stop ringtone
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }

    if (incomingCall) {
      // Update call status in database
      if (incomingCall.callId) {
        try {
          const token = localStorage.getItem('token');
          await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/calls/${incomingCall.callId}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status: 'rejected' }),
            }
          );
        } catch (error) {
          console.error('Failed to update call status:', error);
        }
      }

      // Send reject signal
      const socket = getSocket();
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      socket?.emit('reject-call', {
        to: incomingCall.from,
        from: currentUser._id,
      });

      setIncomingCall(null);
    }
  };

  const endCall = async () => {
    console.log('📴 Ending call');

    // Update call duration in database
    if (currentCallId && callStartTime) {
      const duration = Math.floor((Date.now() - callStartTime) / 1000);
      try {
        const token = localStorage.getItem('token');
        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/calls/${currentCallId}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'ended', duration }),
          }
        );
      } catch (error) {
        console.error('Failed to update call duration:', error);
      }
    }

    // Send end call signal
    if (remoteUser) {
      const socket = getSocket();
      socket?.emit('end-call', {
        to: remoteUser._id,
      });
    }

    cleanupCall();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const switchToVideo = async () => {
    if (callType === 'video') return;
    
    try {
      console.log('🔄 Switching to video call');
      
      // Get video track
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = videoStream.getVideoTracks()[0];
      
      if (peerConnectionRef.current && localStream) {
        // Add video track to peer connection
        const sender = peerConnectionRef.current.addTrack(videoTrack, localStream);
        
        // Add to local stream
        localStream.addTrack(videoTrack);
        setLocalStream(localStream);
        setCallType('video');
        
        // Notify remote user
        const socket = getSocket();
        socket?.emit('call-type-changed', {
          to: remoteUser._id,
          callType: 'video',
        });
        
        console.log('✅ Switched to video successfully');
      }
    } catch (error) {
      console.error('Failed to switch to video:', error);
      alert('Could not enable video. Please check camera permissions.');
    }
  };

  const switchToAudio = async () => {
    if (callType === 'audio') return;
    
    try {
      console.log('🔄 Switching to audio only');
      
      if (peerConnectionRef.current && localStream) {
        // Remove video track
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
          localStream.removeTrack(videoTrack);
          
          // Remove from peer connection
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(sender => sender.track?.kind === 'video');
          if (videoSender) {
            peerConnectionRef.current.removeTrack(videoSender);
          }
        }
        
        setLocalStream(localStream);
        setCallType('audio');
        setIsVideoOff(false);
        
        // Notify remote user
        const socket = getSocket();
        socket?.emit('call-type-changed', {
          to: remoteUser._id,
          callType: 'audio',
        });
        
        console.log('✅ Switched to audio only');
      }
    } catch (error) {
      console.error('Failed to switch to audio:', error);
    }
  };

  const switchCamera = async () => {
    if (!localStream || callType !== 'video') return;
    
    try {
      const videoTrack = localStream.getVideoTracks()[0];
      if (!videoTrack) return;
      
      // Get current facing mode
      const currentFacingMode = videoTrack.getSettings().facingMode;
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
      
      // Stop current track
      videoTrack.stop();
      
      // Get new stream with different camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false,
      });
      
      const newVideoTrack = newStream.getVideoTracks()[0];
      
      // Replace track in peer connection
      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find(sender => sender.track?.kind === 'video');
      if (videoSender) {
        await videoSender.replaceTrack(newVideoTrack);
      }
      
      // Replace in local stream
      localStream.removeTrack(videoTrack);
      localStream.addTrack(newVideoTrack);
      setLocalStream(localStream);
      
      console.log(`📷 Camera switched to: ${newFacingMode}`);
    } catch (error) {
      console.error('Failed to switch camera:', error);
      alert('Could not switch camera');
    }
  };

  const startScreenShare = async () => {
    if (isScreenSharing || !peerConnectionRef.current) return;

    try {
      console.log('🖥️ Starting screen share');

      // Get screen capture stream
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
        },
        audio: false,
      });

      const screenTrack = stream.getVideoTracks()[0];
      setScreenStream(stream);
      setIsScreenSharing(true);

      // Replace video track with screen track
      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find(sender => sender.track?.kind === 'video');
      
      if (videoSender && localStream) {
        await videoSender.replaceTrack(screenTrack);
      }

      // Handle when user stops sharing via browser UI
      screenTrack.onended = () => {
        stopScreenShare();
      };

      // Notify remote user
      const socket = getSocket();
      socket?.emit('screen-share-started', {
        to: remoteUser._id,
      });

      console.log('✅ Screen sharing started');
    } catch (error) {
      console.error('Failed to start screen share:', error);
      setIsScreenSharing(false);
      if (error.name === 'NotAllowedError') {
        alert('Screen sharing permission denied');
      } else {
        alert('Failed to share screen. Please try again.');
      }
    }
  };

  const stopScreenShare = async () => {
    if (!isScreenSharing || !peerConnectionRef.current) return;

    try {
      console.log('🖥️ Stopping screen share');

      // Stop screen stream
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }

      // Switch back to camera
      if (localStream && callType === 'video') {
        const videoTrack = localStream.getVideoTracks()[0];
        
        if (!videoTrack || videoTrack.readyState === 'ended') {
          // Get new camera stream
          const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          const newVideoTrack = newStream.getVideoTracks()[0];
          localStream.addTrack(newVideoTrack);
        }

        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find(sender => sender.track?.kind === 'video');
        
        if (videoSender) {
          const cameraTrack = localStream.getVideoTracks()[0];
          await videoSender.replaceTrack(cameraTrack);
        }
      }

      setIsScreenSharing(false);

      // Notify remote user
      const socket = getSocket();
      socket?.emit('screen-share-stopped', {
        to: remoteUser._id,
      });

      console.log('✅ Screen sharing stopped');
    } catch (error) {
      console.error('Failed to stop screen share:', error);
      setIsScreenSharing(false);
    }
  };

  const value = {
    isCallActive,
    callType,
    incomingCall,
    remoteUser,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchToVideo,
    switchToAudio,
    switchCamera,
    startScreenShare,
    stopScreenShare,
    // Call state management
    callStatus,
    networkQuality,
    isReconnecting,
    reconnectAttempts,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export default CallContext;

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export const useWebRTC = (userId, socket) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isCallActive, setIsCallActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [incomingCall, setIncomingCall] = useState(null);
    const [remoteUserId, setRemoteUserId] = useState(null);

    const peerConnection = useRef(null);
    const callTimerRef = useRef(null);

    // End call
    const endCall = useCallback(() => {
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
        }

        if (remoteStream) {
            setRemoteStream(null);
        }

        if (callTimerRef.current) {
            clearInterval(callTimerRef.current);
            callTimerRef.current = null;
        }

        setIsCallActive(false);
        setCallDuration(0);
        setIsMuted(false);

        if (socket && incomingCall) {
            socket.emit('call:end', {
                to: incomingCall.from,
                from: userId,
            });
        }
    }, [localStream, remoteStream, socket, userId, incomingCall]);

    // Initialize peer connection
    const createPeerConnection = useCallback(() => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit('call:ice-candidate', {
                    to: remoteUserId || incomingCall?.from,
                    candidate: event.candidate,
                    from: userId,
                });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                endCall();
            }
        };

        return pc;
    }, [userId, socket, incomingCall, remoteUserId, endCall]);

    // Get user media
    const startLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setLocalStream(stream);
            return stream;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            throw error;
        }
    };

    // Initiate call
    const initiateCall = async (toUserId, conversationId) => {
        try {
            setRemoteUserId(toUserId);
            const stream = await startLocalStream();
            const pc = createPeerConnection();
            peerConnection.current = pc;

            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit('call:initiate', {
                to: toUserId,
                from: userId,
                conversationId,
            });

            socket.emit('call:offer', {
                to: toUserId,
                offer: offer,
                from: userId,
            });

            setIsCallActive(true);
            startCallTimer();
        } catch (error) {
            console.error('Error initiating call:', error);
        }
    };

    // Accept call
    const acceptCall = async () => {
        if (!incomingCall) return;

        try {
            const stream = await startLocalStream();
            const pc = createPeerConnection();
            peerConnection.current = pc;

            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });

            socket.emit('call:accept', {
                to: incomingCall.from,
                from: userId,
            });

            setIsCallActive(true);
            setIncomingCall(null);
            startCallTimer();
        } catch (error) {
            console.error('Error accepting call:', error);
        }
    };

    // Reject call
    const rejectCall = () => {
        if (!incomingCall) return;

        socket.emit('call:reject', {
            to: incomingCall.from,
            from: userId,
        });

        setIncomingCall(null);
    };



    // Toggle mute
    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    // Start call timer
    const startCallTimer = () => {
        callTimerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
        }, 1000);
    };

    // Format call duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('call:incoming', (data) => {
            setIncomingCall(data);
        });

        socket.on('call:accepted', async () => {
            // Peer accepted, wait for answer
        });

        socket.on('call:rejected', () => {
            endCall();
            alert('Call was rejected');
        });

        socket.on('call:ended', () => {
            endCall();
        });

        socket.on('call:offer', async (data) => {
            if (peerConnection.current) {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await peerConnection.current.createAnswer();
                await peerConnection.current.setLocalDescription(answer);

                socket.emit('call:answer', {
                    to: data.from,
                    answer: answer,
                    from: userId,
                });
            }
        });

        socket.on('call:answer', async (data) => {
            if (peerConnection.current) {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
        });

        socket.on('call:ice-candidate', async (data) => {
            if (peerConnection.current && data.candidate) {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        });

        return () => {
            socket.off('call:incoming');
            socket.off('call:accepted');
            socket.off('call:rejected');
            socket.off('call:ended');
            socket.off('call:offer');
            socket.off('call:answer');
            socket.off('call:ice-candidate');
        };
    }, [socket, userId, endCall]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            endCall();
        };
    }, [endCall]);

    return {
        localStream,
        remoteStream,
        isCallActive,
        isMuted,
        callDuration: formatDuration(callDuration),
        incomingCall,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
    };
};

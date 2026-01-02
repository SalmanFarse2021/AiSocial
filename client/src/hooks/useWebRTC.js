import { useEffect, useRef, useCallback } from 'react';
import { useCall } from '../contexts/CallContext';
import { getSocket } from '../lib/socket';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
    ],
};

export const useWebRTC = () => {
    const { state, dispatch } = useCall();
    const { callId, callState, callType } = state;
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const iceCandidatesQueue = useRef([]);

    // Initialize Peer Connection
    const createPeerConnection = useCallback(() => {
        if (peerConnectionRef.current) return peerConnectionRef.current;

        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                const socket = getSocket();
                socket?.emit('webrtc:ice', { callId, candidate: event.candidate });
            }
        };

        // Handle incoming tracks
        pc.ontrack = (event) => {
            console.log('Remote track received', event.streams[0]);
            if (event.streams[0]) {
                dispatch({ type: 'SET_REMOTE_STREAM', payload: event.streams[0] });
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [callId, dispatch]);

    // Start Call (Caller side)
    const startCall = useCallback(async () => {
        try {
            const pc = createPeerConnection();

            // Get Local Stream
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: callType === 'video'
            });

            localStreamRef.current = stream;
            dispatch({ type: 'SET_LOCAL_STREAM', payload: stream });

            // Add tracks to PC
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            // Create Offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // We wait for call:accepted to emit the offer

        } catch (err) {
            console.error('Error starting call:', err);
            dispatch({ type: 'END_CALL', payload: { error: 'Could not access camera/microphone' } });
        }
    }, [callType, callId, dispatch, createPeerConnection]);

    // Send offer when call is accepted
    useEffect(() => {
        if (callState === 'active' && peerConnectionRef.current && peerConnectionRef.current.localDescription && !peerConnectionRef.current.remoteDescription) {
            const socket = getSocket();
            // Only if we are the caller (we have local desc but no remote desc yet)
            // Actually, Callee sets local desc (Answer) too. 
            // Caller has Local (Offer) and NO Remote initially.
            // Callee has Remote (Offer) and Local (Answer).
            // So !remoteDescription check is good for identifying we haven't processed an answer yet.
            // BUT Callee might not have remote description set if they just created PC in answerCall?
            // No, Callee sets remote desc in handleOffer.

            // Let's rely on simple fact: We generated the offer in startCall.
            // We can check if we are the caller.
            // But simpler: just emit if we have localDesc and type is 'offer'.

            const desc = peerConnectionRef.current.localDescription;
            if (desc.type === 'offer') {
                console.log('Sending WebRTC Offer');
                socket?.emit('webrtc:offer', { callId, sdp: desc });
            }
        }
    }, [callState, callId]);

    // Answer Call (Callee side)
    const answerCall = useCallback(async () => {
        try {
            const pc = createPeerConnection();

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: callType === 'video'
            });

            localStreamRef.current = stream;
            dispatch({ type: 'SET_LOCAL_STREAM', payload: stream });

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            // Wait for remote offer to set description... handled in effect below

        } catch (err) {
            console.error('Error answering call:', err);
            dispatch({ type: 'END_CALL', payload: { error: 'Could not access camera/microphone' } });
        }
    }, [callType, dispatch, createPeerConnection]);

    // Handle Signaling Events
    useEffect(() => {
        const socket = getSocket();
        if (!socket || !callId) return;

        const handleOffer = async ({ sdp }) => {
            if (!peerConnectionRef.current) return;
            const pc = peerConnectionRef.current;

            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            processIceQueue();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('webrtc:answer', { callId, sdp: answer });
        };

        const handleAnswer = async ({ sdp }) => {
            if (!peerConnectionRef.current) return;
            const pc = peerConnectionRef.current;
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            processIceQueue();
        };

        const handleIce = async ({ candidate }) => {
            if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error('Error adding ICE candidate', e);
                }
            } else {
                iceCandidatesQueue.current.push(candidate);
            }
        };

        const processIceQueue = async () => {
            if (!peerConnectionRef.current || !peerConnectionRef.current.remoteDescription) return;
            while (iceCandidatesQueue.current.length > 0) {
                const candidate = iceCandidatesQueue.current.shift();
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error('Error processing queued ICE candidate', e);
                }
            }
        };

        socket.on('webrtc:offer', handleOffer);
        socket.on('webrtc:answer', handleAnswer);
        socket.on('webrtc:ice', handleIce);

        return () => {
            socket.off('webrtc:offer', handleOffer);
            socket.off('webrtc:answer', handleAnswer);
            socket.off('webrtc:ice', handleIce);
        };
    }, [callId]);

    // Cleanup on end
    useEffect(() => {
        if (callState === 'idle') {
            // Stop all tracks
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }

            // Close PC
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }

            dispatch({ type: 'SET_LOCAL_STREAM', payload: null });
            dispatch({ type: 'SET_REMOTE_STREAM', payload: null });
        }
    }, [callState, dispatch]);

    return { startCall, answerCall };
};

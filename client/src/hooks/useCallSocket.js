import { useEffect } from 'react';
import { useCall } from '../contexts/CallContext';
import { getSocket, isSocketConnected } from '../lib/socket';

export const useCallSocket = () => {
    const { state, dispatch } = useCall();

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        // --- Signaling Handlers ---

        const onIncomingCall = (data) => {
            console.log('Incoming call:', data);
            dispatch({
                type: 'INCOMING_CALL',
                payload: {
                    callId: data.callId,
                    callType: data.callType, // 'audio' or 'video'
                    caller: {
                        _id: data.callerId,
                        username: data.callerName,
                        profilePic: data.callerPic,
                    },
                }
            });
        };

        const onCallAccepted = (data) => {
            console.log('Call accepted:', data);
            dispatch({ type: 'CALL_ACCEPTED' });
        };

        const onCallRejected = (data) => {
            console.log('Call rejected:', data);
            dispatch({ type: 'END_CALL', payload: { error: 'Call declined' } });
        };

        const onCallCanceled = (data) => {
            console.log('Call canceled:', data);
            dispatch({ type: 'END_CALL' });
        };

        const onCallEnded = (data) => {
            console.log('Call ended:', data);
            dispatch({ type: 'END_CALL' });
        };

        const onCallBusy = (data) => {
            dispatch({ type: 'END_CALL', payload: { error: 'User is busy' } });
        };

        const onCallUnavailable = (data) => {
            dispatch({ type: 'END_CALL', payload: { error: 'User is unavailable' } });
        };

        const onCallTimeout = (data) => {
            dispatch({ type: 'END_CALL', payload: { error: 'Call timed out' } });
        };



        const onCallCreated = (data) => {
            console.log('Call created with ID:', data.callId);
            dispatch({ type: 'START_OUTGOING_CALL', payload: { ...state, callId: data.callId } });
        };

        socket.on('call:created', onCallCreated);

        return () => {
            // ... previous cleanup ...
            socket.off('call:created', onCallCreated);
        };

        const onCallError = (data) => {
            dispatch({ type: 'END_CALL', payload: { error: data.message || 'Call failed' } });
        };

        // Attach listeners
        socket.on('call:ringing', onIncomingCall);
        socket.on('call:accepted', onCallAccepted);
        socket.on('call:rejected', onCallRejected);
        socket.on('call:canceled', onCallCanceled);
        socket.on('call:ended', onCallEnded);
        socket.on('call:busy', onCallBusy);
        socket.on('call:unavailable', onCallUnavailable);
        socket.on('call:timeout', onCallTimeout);
        socket.on('call:error', onCallError);

        return () => {
            // Remove listeners
            socket.off('call:ringing', onIncomingCall);
            socket.off('call:accepted', onCallAccepted);
            socket.off('call:rejected', onCallRejected);
            socket.off('call:canceled', onCallCanceled);
            socket.off('call:ended', onCallEnded);
            socket.off('call:busy', onCallBusy);
            socket.off('call:unavailable', onCallUnavailable);
            socket.off('call:timeout', onCallTimeout);
            socket.off('call:error', onCallError);
        };
    }, [dispatch]);
};

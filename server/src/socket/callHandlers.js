import { CallLog } from '../models/CallLog.js';
import { v4 as uuidv4 } from 'uuid';

// In-memory call store: callId -> { ...sessionData }
// Using a Map for O(1) access
const activeCalls = new Map();

// Helper to cleanup call
const cleanupCall = async (callId, finalStatus, io) => {
    const call = activeCalls.get(callId);
    if (!call) return;

    activeCalls.delete(callId);

    // If we have a DB ID (meaning it started or was logged), update it
    if (call.dbId) {
        try {
            const update = { status: finalStatus, endedAt: new Date() };
            if (call.startedAt) {
                update.duration = Math.round((new Date() - call.startedAt) / 1000);
            }
            await CallLog.findByIdAndUpdate(call.dbId, update);
        } catch (err) {
            console.error('Error updating call log:', err);
        }
    }
};

export const registerCallHandlers = (io, socket, userRegistryHooks) => {
    const { emitToUser, isOnline } = userRegistryHooks;

    // --- Call Signaling Events ---

    // 1. Caller invites Callee
    socket.on('call:invite', async (data) => {
        console.log(`[Call] Invite received from ${socket.userId} to ${data.toUserId}`);
        try {
            const { toUserId, callType, conversationId } = data;
            const callerId = socket.userId;
            const callId = uuidv4();

            if (!isOnline(toUserId)) {
                console.log(`[Call] User ${toUserId} is offline`);
                socket.emit('call:unavailable', { toUserId });
                // Log missed call
                await CallLog.create({
                    caller: callerId,
                    callee: toUserId,
                    type: callType,
                    status: 'missed',
                    conversationId,
                });
                return;
            }

            console.log(`[Call] Creating call session ${callId}`);

            // Create session
            const callSession = {
                callId,
                callerId,
                calleeId: toUserId,
                type: callType,
                status: 'ringing',
                conversationId,
                createdAt: new Date(),
                dbId: null, // will create log on answer or timeout
            };

            activeCalls.set(callId, callSession);

            // Create initial log entry (optional, or wait for result)
            // Let's wait for result to determining status, but needed for 'missed' if timeout
            const log = await CallLog.create({
                caller: callerId,
                callee: toUserId,
                type: callType,
                status: 'ringing', // temp status
                conversationId,
            });
            callSession.dbId = log._id;

            // Notify Callee
            const notified = emitToUser(toUserId, 'call:ringing', {
                callId,
                callerId,
                callType,
                conversationId,
                callerName: socket.user?.username, // Assuming socket.user attached in auth
                callerPic: socket.user?.profilePic,
            });

            if (!notified) {
                console.warn(`[Call] Failed to emit call:ringing to ${toUserId} despite online check`);
            } else {
                console.log(`[Call] Ringing notification sent to ${toUserId}`);
            }

            // Confirm to Caller
            socket.emit('call:created', { callId });
            console.log(`[Call] Call created and confirmed to caller ${callerId}`);

            // Setup Timeout (30s)
            setTimeout(() => {
                const currentCall = activeCalls.get(callId);
                if (currentCall && currentCall.status === 'ringing') {
                    console.log(`[Call] Timeout for call ${callId}`);
                    // Timeout
                    emitToUser(callerId, 'call:timeout', { callId });
                    emitToUser(toUserId, 'call:timeout', { callId });
                    cleanupCall(callId, 'missed', io);
                }
            }, 30000);

        } catch (err) {
            console.error('call:invite error', err);
            socket.emit('call:error', { message: 'Failed to start call' });
        }
    });

    // 2. Callee Accepts
    socket.on('call:accept', async (data) => {
        const { callId } = data;
        const call = activeCalls.get(callId);

        if (!call) return; // Call timed out or cancelled
        if (call.calleeId !== socket.userId) return; // Security check

        call.status = 'active';
        call.startedAt = new Date();

        // Notify Caller
        emitToUser(call.callerId, 'call:accepted', { callId });

        // Notify Other Sessions of Callee (to stop ringing on other devices)
        // We can just emit to user. Client should handle "answered elsewhere" logic if needed.
    });

    // 3. Callee Rejects
    socket.on('call:reject', async (data) => {
        const { callId } = data;
        const call = activeCalls.get(callId);

        if (!call) return;

        emitToUser(call.callerId, 'call:rejected', { callId });
        cleanupCall(callId, 'declined', io);
    });

    // 4. Caller Cancels (while ringing)
    socket.on('call:cancel', async (data) => {
        const { callId } = data;
        const call = activeCalls.get(callId);

        if (!call) return;
        if (call.callerId !== socket.userId) return;

        emitToUser(call.calleeId, 'call:canceled', { callId });
        cleanupCall(callId, 'canceled', io);
    });

    // 5. End Call (from either side)
    socket.on('call:end', async (data) => {
        const { callId } = data;
        const call = activeCalls.get(callId);

        if (!call) return;

        // Notify other party
        const otherUserId = socket.userId === call.callerId ? call.calleeId : call.callerId;
        emitToUser(otherUserId, 'call:ended', { callId });

        cleanupCall(callId, 'completed', io);
    });

    // --- WebRTC Signaling Events ---
    // Simple forwarding using the "user:<userId>" room pattern or emitToUser

    socket.on('webrtc:offer', (data) => {
        const { callId, sdp } = data;
        const call = activeCalls.get(callId);
        if (!call) return;

        // Forward to the OTHER party
        const targetId = socket.userId === call.callerId ? call.calleeId : call.callerId;
        emitToUser(targetId, 'webrtc:offer', { callId, sdp });
    });

    socket.on('webrtc:answer', (data) => {
        const { callId, sdp } = data;
        const call = activeCalls.get(callId);
        if (!call) return;

        const targetId = socket.userId === call.callerId ? call.calleeId : call.callerId;
        emitToUser(targetId, 'webrtc:answer', { callId, sdp });
    });

    socket.on('webrtc:ice', (data) => {
        const { callId, candidate } = data;
        const call = activeCalls.get(callId);
        if (!call) return;

        const targetId = socket.userId === call.callerId ? call.calleeId : call.callerId;
        emitToUser(targetId, 'webrtc:ice', { callId, candidate });
    });
};

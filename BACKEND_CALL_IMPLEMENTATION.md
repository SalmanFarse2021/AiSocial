# 🎥 1:1 Audio/Video Calling - Complete Backend Implementation

## 📋 Overview

The backend implements WebRTC signaling using Socket.io for real-time peer-to-peer audio/video calls. The server acts as a signaling server to exchange SDP (Session Description Protocol) offers/answers and ICE (Interactive Connectivity Establishment) candidates between peers.

---

## 🏗️ Architecture

```
┌─────────────┐                ┌─────────────┐
│   Caller    │                │   Callee    │
│  (User A)   │                │  (User B)   │
└──────┬──────┘                └──────┬──────┘
       │                              │
       │  1. call:initiate            │
       ├─────────────────────────────>│
       │                              │
       │  2. call:offer (SDP)         │
       ├─────────────────────────────>│
       │                              │
       │         3. call:answer (SDP) │
       │<─────────────────────────────┤
       │                              │
       │  4. call:ice-candidate       │
       │<────────────────────────────>│
       │     (Exchange ICE)           │
       │                              │
       │  5. WebRTC P2P Connection    │
       │═════════════════════════════>│
       │    (Direct audio/video)      │
       │                              │
       │  6. call:end                 │
       │<─────────────────────────────┤
       │                              │
```

---

## 🔌 Socket.io Events

### 1. **call:initiate** (Caller → Server → Callee)

**Purpose**: Initiate a call to another user

**Caller Emits**:
```javascript
socket.emit('call:initiate', {
  toUserId: '507f1f77bcf86cd799439011',  // Recipient's user ID
  callType: 'audio' | 'video',            // Type of call
  callerInfo: {
    name: 'John Doe',                     // Caller's display name
    pic: 'https://...avatar.jpg'          // Caller's profile picture
  }
});
```

**Callee Receives**:
```javascript
socket.on('call:incoming', (data) => {
  // data = {
  //   fromUserId: '507f1f77bcf86cd799439012',
  //   callType: 'audio',
  //   callerInfo: { name: 'John Doe', pic: '...' },
  //   timestamp: 1699876543210
  // }
});
```

**Error Cases**:
- If callee is offline, caller receives:
```javascript
socket.on('call:error', (data) => {
  // data = {
  //   type: 'RECIPIENT_OFFLINE',
  //   message: 'User is currently offline',
  //   toUserId: '507f1f77bcf86cd799439011'
  // }
});
```

---

### 2. **call:offer** (Caller → Server → Callee)

**Purpose**: Send WebRTC SDP offer to establish connection

**Caller Emits** (after receiving user media):
```javascript
const peerConnection = new RTCPeerConnection(config);
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);

socket.emit('call:offer', {
  toUserId: '507f1f77bcf86cd799439011',
  offer: {
    type: 'offer',
    sdp: '...'  // SDP string
  }
});
```

**Callee Receives**:
```javascript
socket.on('call:offer', (data) => {
  // data = {
  //   fromUserId: '507f1f77bcf86cd799439012',
  //   offer: { type: 'offer', sdp: '...' },
  //   timestamp: 1699876543210
  // }
  
  // Set remote description
  await peerConnection.setRemoteDescription(data.offer);
});
```

---

### 3. **call:answer** (Callee → Server → Caller)

**Purpose**: Send WebRTC SDP answer back to caller

**Callee Emits** (after creating answer):
```javascript
const answer = await peerConnection.createAnswer();
await peerConnection.setLocalDescription(answer);

socket.emit('call:answer', {
  toUserId: '507f1f77bcf86cd799439012',  // Caller's user ID
  answer: {
    type: 'answer',
    sdp: '...'  // SDP string
  }
});
```

**Caller Receives**:
```javascript
socket.on('call:answer', (data) => {
  // data = {
  //   fromUserId: '507f1f77bcf86cd799439011',
  //   answer: { type: 'answer', sdp: '...' },
  //   timestamp: 1699876543210
  // }
  
  // Set remote description
  await peerConnection.setRemoteDescription(data.answer);
});
```

---

### 4. **call:ice-candidate** (Both Peers)

**Purpose**: Exchange ICE candidates for NAT traversal

**Either Peer Emits** (when ICE candidate is generated):
```javascript
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('call:ice-candidate', {
      toUserId: otherUserId,
      candidate: {
        candidate: event.candidate.candidate,
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        sdpMid: event.candidate.sdpMid
      }
    });
  }
};
```

**Other Peer Receives**:
```javascript
socket.on('call:ice-candidate', async (data) => {
  // data = {
  //   fromUserId: '507f1f77bcf86cd799439012',
  //   candidate: { candidate: '...', sdpMLineIndex: 0, sdpMid: '0' }
  // }
  
  // Add ICE candidate
  await peerConnection.addIceCandidate(data.candidate);
});
```

---

### 5. **call:reject** (Callee → Server → Caller)

**Purpose**: Reject an incoming call

**Callee Emits**:
```javascript
socket.emit('call:reject', {
  toUserId: '507f1f77bcf86cd799439012',  // Caller's user ID
  reason: 'User declined the call'        // Optional reason
});
```

**Caller Receives**:
```javascript
socket.on('call:rejected', (data) => {
  // data = {
  //   fromUserId: '507f1f77bcf86cd799439011',
  //   reason: 'User declined the call',
  //   timestamp: 1699876543210
  // }
});
```

---

### 6. **call:end** (Either Peer)

**Purpose**: End an active call

**Either Peer Emits**:
```javascript
socket.emit('call:end', {
  toUserId: otherUserId,
  duration: 127  // Call duration in seconds (optional)
});
```

**Other Peer Receives**:
```javascript
socket.on('call:ended', (data) => {
  // data = {
  //   fromUserId: '507f1f77bcf86cd799439012',
  //   duration: 127,
  //   timestamp: 1699876543210
  // }
  
  // Clean up peer connection
  peerConnection.close();
});
```

---

### 7. **call:busy** (Callee → Server → Caller)

**Purpose**: Notify caller that callee is on another call

**Callee Emits**:
```javascript
socket.emit('call:busy', {
  toUserId: '507f1f77bcf86cd799439012'  // Caller's user ID
});
```

**Caller Receives**:
```javascript
socket.on('call:busy', (data) => {
  // data = {
  //   fromUserId: '507f1f77bcf86cd799439011',
  //   message: 'User is currently on another call',
  //   timestamp: 1699876543210
  // }
});
```

---

## 🗄️ Call Model (Database Schema)

The `Call` model logs call history for analytics and records:

```javascript
{
  _id: ObjectId('507f1f77bcf86cd799439011'),
  caller: ObjectId('507f1f77bcf86cd799439012'),      // User who initiated
  receiver: ObjectId('507f1f77bcf86cd799439013'),    // User who received
  callType: 'audio' | 'video',                       // Call type
  status: 'pending' | 'answered' | 'rejected' | 'missed' | 'ended',
  duration: 127,                                     // Call duration in seconds
  startedAt: ISODate('2025-11-14T10:30:00Z'),       // When call was answered
  endedAt: ISODate('2025-11-14T10:32:07Z'),         // When call ended
  createdAt: ISODate('2025-11-14T10:29:55Z'),       // When call was initiated
  updatedAt: ISODate('2025-11-14T10:32:07Z')
}
```

**Status Flow**:
1. `pending` → Call initiated, ringing
2. `answered` → Call accepted and connected
3. `rejected` → Callee declined the call
4. `missed` → Callee didn't answer within timeout
5. `ended` → Call completed successfully

---

## 🔒 User Routing (userId → socketId Map)

Socket.io automatically manages this using **rooms**:

```javascript
// When user connects
socket.on('user-connected', (userId) => {
  socket.userId = userId;
  socket.join(`user:${userId}`);  // Join room named "user:123abc..."
});

// To send message to specific user
io.to(`user:${userId}`).emit('call:incoming', data);
```

**Benefits**:
- No manual map maintenance needed
- Handles multiple tabs/devices (same user, multiple sockets)
- Automatic cleanup on disconnect
- Built-in room management

---

## ⚠️ Error Handling

### 1. **Recipient Offline**
```javascript
const recipientSockets = io.sockets.adapter.rooms.get(`user:${toUserId}`);

if (!recipientSockets || recipientSockets.size === 0) {
  socket.emit('call:error', {
    type: 'RECIPIENT_OFFLINE',
    message: 'User is currently offline',
    toUserId
  });
  return;
}
```

### 2. **Recipient Busy**
Frontend should track if user is already on a call:
```javascript
let isOnCall = false;

socket.on('call:incoming', (data) => {
  if (isOnCall) {
    socket.emit('call:busy', { toUserId: data.fromUserId });
    return;
  }
  // Show incoming call UI
});
```

### 3. **Connection Timeout**
Frontend should implement timeout:
```javascript
const callTimeout = setTimeout(() => {
  // No answer after 30 seconds
  socket.emit('call:end', { toUserId, duration: 0 });
  updateCallStatus(callId, 'missed');
}, 30000);
```

### 4. **Network Issues**
Handle socket disconnection:
```javascript
socket.on('disconnect', () => {
  if (isOnCall) {
    // Notify other peer
    socket.emit('call:end', { toUserId: otherUserId });
    peerConnection.close();
  }
});
```

---

## 📊 Complete Frontend Flow Example

```javascript
// ============================================
// CALLER SIDE (User A initiating call)
// ============================================

// 1. Initialize call
socket.emit('call:initiate', {
  toUserId: 'userB_id',
  callType: 'audio',
  callerInfo: { name: currentUser.name, pic: currentUser.pic }
});

// 2. Get user media
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
localStream = stream;

// 3. Create peer connection
const peerConnection = new RTCPeerConnection(config);
stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

// 4. Create and send offer
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);
socket.emit('call:offer', { toUserId: 'userB_id', offer });

// 5. Listen for ICE candidates
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('call:ice-candidate', {
      toUserId: 'userB_id',
      candidate: event.candidate
    });
  }
};

// 6. Listen for answer
socket.on('call:answer', async (data) => {
  await peerConnection.setRemoteDescription(data.answer);
});

// 7. Listen for ICE candidates
socket.on('call:ice-candidate', async (data) => {
  await peerConnection.addIceCandidate(data.candidate);
});

// 8. Listen for remote stream
peerConnection.ontrack = (event) => {
  remoteStream = event.streams[0];
  // Display remote video/audio
};

// 9. End call
socket.emit('call:end', { toUserId: 'userB_id', duration: 120 });

// ============================================
// CALLEE SIDE (User B receiving call)
// ============================================

// 1. Listen for incoming call
socket.on('call:incoming', (data) => {
  // Show incoming call UI with data.callerInfo
  showIncomingCallPopup(data);
});

// 2. User accepts call - get media
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
localStream = stream;

// 3. Create peer connection
const peerConnection = new RTCPeerConnection(config);
stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

// 4. Listen for offer
socket.on('call:offer', async (data) => {
  await peerConnection.setRemoteDescription(data.offer);
  
  // Create and send answer
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('call:answer', { toUserId: data.fromUserId, answer });
});

// 5. Listen for ICE candidates
socket.on('call:ice-candidate', async (data) => {
  await peerConnection.addIceCandidate(data.candidate);
});

// 6. Send ICE candidates
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('call:ice-candidate', {
      toUserId: callerUserId,
      candidate: event.candidate
    });
  }
};

// 7. User rejects call
socket.emit('call:reject', {
  toUserId: data.fromUserId,
  reason: 'User declined'
});
```

---

## 🔧 WebRTC Configuration

```javascript
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};
```

---

## 🧪 Testing Checklist

- [ ] Caller can initiate audio call
- [ ] Caller can initiate video call
- [ ] Callee receives incoming call notification
- [ ] Callee can accept call
- [ ] Callee can reject call
- [ ] ICE candidates are exchanged
- [ ] Audio/video streams work bidirectionally
- [ ] Either side can end call
- [ ] Offline user shows error
- [ ] Busy user shows busy signal
- [ ] Call history is saved to database
- [ ] Multiple tabs/devices handled correctly

---

## 📝 Notes

1. **WebRTC Signaling Only**: Backend only handles signaling. Actual media flows peer-to-peer.
2. **STUN/TURN Servers**: Use public STUN servers for NAT traversal. For production, add TURN servers.
3. **Security**: In production, validate userId matches authenticated user.
4. **Scalability**: For large scale, use Redis adapter for Socket.io clustering.
5. **Call Recording**: Not implemented - would require media server (e.g., Janus, Jitsi).

---

## ✅ Summary

**Frontend Should**:
- ✅ Emit: `call:initiate`, `call:offer`, `call:answer`, `call:ice-candidate`, `call:reject`, `call:end`, `call:busy`
- ✅ Listen: `call:incoming`, `call:offer`, `call:answer`, `call:ice-candidate`, `call:rejected`, `call:ended`, `call:busy`, `call:error`

**Backend Provides**:
- ✅ Event routing between peers
- ✅ Online/offline detection
- ✅ Error handling for offline/busy users
- ✅ Call history logging (optional)

**Data Flows**:
- ✅ All signaling data (SDP, ICE) routed through Socket.io
- ✅ Media streams flow directly peer-to-peer (WebRTC)

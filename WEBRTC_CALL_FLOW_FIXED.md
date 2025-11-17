# WebRTC Call Flow - Fixed Implementation

## ✅ Fixed Issues

### 1. Event Listener Duplication
**Problem**: Event listeners were being registered multiple times, causing callbacks to fire multiple times.
**Solution**: Added `socket.off()` before `socket.on()` in all socket event registration functions.

```javascript
// Before (causes duplicates)
export const onIncomingCall = (callback) => {
  if (socket) {
    socket.on('incoming-call', callback);  // Registers multiple times
  }
};

// After (removes old listeners first)
export const onIncomingCall = (callback) => {
  if (socket) {
    socket.off('incoming-call');  // Remove old listener
    socket.on('incoming-call', callback);  // Register new one
  }
};
```

### 2. Peer Connection State Management
**Problem**: Peer connection was created but not properly stored/referenced.
**Solution**: Ensure `peerConnection` state is properly set and available for ICE candidate handling.

### 3. Answer Callback Setup
**Problem**: Caller wasn't listening for the answer from the recipient.
**Solution**: Added proper `onCallAnswered` handler in `initiateCall` to process the answer when received.

```javascript
// Setup listener for answer BEFORE sending call
const handleAnswer = async (data) => {
  console.log('Answer received from:', data.from);
  if (data.answer && pc) {
    await setRemoteAnswer(pc, data.answer);
  }
};

onCallAnswered(handleAnswer);

// Then send the call
callUser(recipientId, currentUser._id, currentUser.username, currentUser.profilePic, offer);
```

### 4. Console Logging
**Added**: Detailed console logging at every step for debugging:
- Call initiation
- Offer creation
- Answer reception
- ICE candidate exchange
- Error reporting

---

## 📱 Complete Call Flow (Fixed)

### User A (Caller) → User B (Recipient)

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: User A clicks [📞] phone button in Messenger        │
└─────────────────────────────────────────────────────────────┘
                            ↓
        Messenger.jsx sets showVideoCall=true
        and opens VideoCall component
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: User A's VideoCall initiateCall()                   │
│ - Requests camera/microphone access (getUserMedia)          │
│ - Creates RTCPeerConnection                                 │
│ - Adds local stream to peer connection                       │
│ - Creates SDP offer                                          │
│ - Sets up answer listener: onCallAnswered()                 │
│ - Emits 'call-user' via Socket.io                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
        Socket.io event: 'call-user'
        Backend receives from User A's socket
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend (server/index.js)                                   │
│ Receives 'call-user' event with:                            │
│   - to: User B's ID                                         │
│   - from: User A's ID                                       │
│   - fromName: User A's username                             │
│   - fromPic: User A's profile picture                       │
│   - offer: SDP offer                                        │
│                                                              │
│ Forwards to User B's socket room:                           │
│ io.to(`user:${to}`).emit('incoming-call', {...})           │
└─────────────────────────────────────────────────────────────┘
                            ↓
        Socket.io event: 'incoming-call'
        User B's browser receives notification
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: User B's VideoCall Component                        │
│ - onIncomingCall listener triggered                         │
│ - setIncomingCall(data) displays notification modal         │
│ - Shows User A's name, picture, "Incoming video call..."   │
│ - User B sees [✓ Accept] and [✗ Reject] buttons            │
└─────────────────────────────────────────────────────────────┘
                            ↓
        User B clicks [✓ Accept]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: User B's acceptCall()                               │
│ - Requests camera/microphone access (getUserMedia)          │
│ - Creates RTCPeerConnection                                 │
│ - Adds local stream to peer connection                       │
│ - Creates SDP answer from User A's offer                    │
│ - Emits 'answer-call' via Socket.io                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
        Socket.io event: 'answer-call'
        Backend receives from User B's socket
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend (server/index.js)                                   │
│ Receives 'answer-call' event with:                          │
│   - to: User A's ID                                         │
│   - from: User B's ID                                       │
│   - answer: SDP answer                                      │
│                                                              │
│ Forwards to User A's socket room:                           │
│ io.to(`user:${to}`).emit('call-answered', {...})           │
└─────────────────────────────────────────────────────────────┘
                            ↓
        Socket.io event: 'call-answered'
        User A's onCallAnswered handler triggered
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: User A receives answer                              │
│ - onCallAnswered callback executes                          │
│ - setRemoteAnswer(pc, answer) processed                     │
│ - Peer connection now has both offer and answer             │
└─────────────────────────────────────────────────────────────┘
                            ↓
        Both peers now have SDP information
        ICE candidate exchange begins
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 6: ICE Candidate Exchange (Both Directions)            │
│                                                              │
│ User A's pc.onicecandidate → sends to User B                │
│ User B receives 'ice-candidate' → adds to peer connection   │
│                                                              │
│ User B's pc.onicecandidate → sends to User A                │
│ User A receives 'ice-candidate' → adds to peer connection   │
│                                                              │
│ Multiple exchanges occur to find best network path          │
└─────────────────────────────────────────────────────────────┘
                            ↓
        P2P connection established
        DTLS encryption secured
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 7: Media Streams Connect                               │
│                                                              │
│ User A's pc.ontrack → remoteStream captured                 │
│ Shows User B's video in main display                        │
│                                                              │
│ User B's pc.ontrack → remoteStream captured                 │
│ Shows User A's video in main display                        │
│                                                              │
│ Audio & video flowing both directions                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 8: Call Active                                         │
│ - Both see video of each other                              │
│ - Audio streaming in both directions                        │
│ - Can mute/unmute microphone                                │
│ - Can toggle camera on/off                                  │
│ - Both can end call with [☎️]                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
        User A (or B) clicks [☎️] end call
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 9: User Ends Call                                      │
│ - endCurrentCall() cleanup function                         │
│ - Stop all media tracks                                     │
│ - Close peer connection                                     │
│ - Emit 'end-call' to other user                             │
│ - Close VideoCall modal                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
        Socket.io event: 'end-call'
        Backend receives and forwards
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Other User Receives End Signal                              │
│ - onCallEnded callback executes                             │
│ - endCurrentCall() cleanup on their side                    │
│ - VideoCall modal closes                                    │
│ - Connection terminates cleanly                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
        Call Complete - Return to Messenger
```

---

## 🔧 Debug Tips

### In Browser Console (F12 → Console tab)

**Check Socket Connection:**
```javascript
// Should show Socket.io connection status
// Look for: "Socket connected: [socket-id]"
// Look for: "Call emitted to: [recipient-id]"
```

**Monitor Incoming Calls:**
```javascript
// Should see:
// "Incoming call received from: [caller-id]"
```

**Track Answer Reception:**
```javascript
// Should see:
// "Answer received from: [responder-id]"
```

**ICE Candidate Flow:**
```javascript
// Should see multiple:
// "Received ICE candidate"
```

### Network Tab (F12 → Network tab)

**Look for Socket.io events:**
1. `call-user` (from caller to server)
2. `incoming-call` (from server to recipient)
3. `answer-call` (from recipient to server)
4. `call-answered` (from server to caller)
5. `ice-candidate` (multiple, both directions)
6. `end-call` (from whoever closes)
7. `call-ended` (from server to other user)

---

## ✅ Testing Procedure

### Prerequisites
- [ ] Backend running on localhost:5050
- [ ] Frontend running on localhost:3000
- [ ] Two browser windows/tabs with different user accounts logged in
- [ ] Both users have cameras/microphones accessible

### Test Steps

1. **Setup**
   - Open User A's browser → Login → Open Messenger
   - Open User B's browser → Login → Open Messenger
   - Open F12 (DevTools) on both → Console tab

2. **Initiate Call**
   - User A selects conversation with User B
   - User A clicks [📞] phone button
   - Check console: should see "Call emitted to: [User B's ID]"
   - Check console: should see "Offer created: {...}"

3. **Receive Call Notification**
   - User B should see incoming call modal with User A's info
   - Check User B console: should see "Incoming call received from: [User A's ID]"

4. **Accept Call**
   - User B clicks [✓ Accept]
   - Check console: should see "Answer created: {...}"
   - Check console: should see "Answer sent to: [User A's ID]"

5. **Video Connection**
   - User A should see "Answer received from: [User B's ID]"
   - Both users should see remote video after 1-2 seconds
   - Should hear audio

6. **Test Controls**
   - Click 🎤 on both - check if audio mutes
   - Click 📷 on both - check if video turns off
   - Toggle back on

7. **End Call**
   - Either user clicks [☎️] end call
   - Check console: should see "Call ended to: [other user]"
   - VideoCall modal should close
   - Should return to Messenger

8. **Make Another Call**
   - Reverse roles (User B calls User A)
   - Repeat steps 2-7

---

## 🐛 Common Issues & Fixes

### Issue: "Incoming call notification doesn't appear"

**Possible Causes:**
1. Recipient's Socket.io not connected
2. `onIncomingCall` listener not registered
3. Backend not forwarding event correctly

**Debug:**
```
1. Check recipient's console for "Socket connected: [id]"
2. Check recipient console for "Incoming call received from: ..."
3. Check backend socket.io logs for "call-user" event
```

**Fix:**
- Make sure recipient is in Messenger component (which initializes VideoCall listeners)
- Ensure backend PORT is 5050
- Restart backend server

---

### Issue: "Video doesn't appear after accepting call"

**Possible Causes:**
1. getUserMedia failing (camera permission denied)
2. Peer connection not properly created
3. Remote track not being handled

**Debug:**
```
1. Check browser permissions (camera/microphone)
2. Check console for "Remote stream received: ..."
3. Check console for errors in initiateCall or acceptCall
```

**Fix:**
- Grant camera/microphone permissions
- Restart browser
- Check browser supports WebRTC (Chrome, Firefox, Safari 11+)

---

### Issue: "Can hear audio but no video"

**Possible Causes:**
1. Video tracks not being added to peer connection
2. Remote video element not displaying
3. Camera turned off

**Debug:**
- Check if 📷 button shows camera is on
- Check remoteVideoRef has srcObject

**Fix:**
- Click 📷 to turn camera back on
- Check camera is not in use by other app

---

### Issue: "One-sided audio (can hear them, they can't hear you)"

**Possible Causes:**
1. Local audio tracks not enabled
2. Microphone permission denied
3. Audio codec issue

**Debug:**
- Check microphone permission in browser settings
- Check if 🎤 shows muted/unmuted state
- Try unmuting

**Fix:**
- Grant microphone permission
- Restart browser
- Try different browser

---

### Issue: "Socket.io connection keeps disconnecting"

**Possible Causes:**
1. Backend not running
2. Wrong backend PORT
3. CORS not configured
4. Network connectivity issue

**Debug:**
1. Check backend running: `ps aux | grep node`
2. Check backend PORT: `echo $PORT` or check .env
3. Check CORS: should allow localhost:3000

**Fix:**
- Start backend: `cd server && npm run dev`
- Verify PORT 5050
- Restart frontend

---

## 📊 Architecture After Fixes

```
┌─────────────────────────────────────────────────────────────┐
│                     Messenger.jsx                           │
│                   [Phone Button 📞]                          │
│              ↓ (opens VideoCall component)                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │      VideoCall.jsx Component          │
        │  ┌─────────────────────────────────┐  │
        │  │  State Management               │  │
        │  │  - inCall                       │  │
        │  │  - localStream / remoteStream   │  │
        │  │  - peerConnection               │  │
        │  │  - incomingCall                 │  │
        │  └─────────────────────────────────┘  │
        │                                       │
        │  ┌─────────────────────────────────┐  │
        │  │  Event Listeners (clean setup)  │  │
        │  │  - onIncomingCall               │  │
        │  │  - onCallAnswered               │  │
        │  │  - onIceCandidate               │  │
        │  │  - onCallRejected / onCallEnded │  │
        │  └─────────────────────────────────┘  │
        │                                       │
        │  ┌─────────────────────────────────┐  │
        │  │  Call Management                │  │
        │  │  - initiateCall()               │  │
        │  │  - acceptCall()                 │  │
        │  │  - rejectIncomingCall()         │  │
        │  │  - endCurrentCall()             │  │
        │  └─────────────────────────────────┘  │
        │                                       │
        │  ┌─────────────────────────────────┐  │
        │  │  Peer Connection                │  │
        │  │  - RTCPeerConnection            │  │
        │  │  - addStreamToPeer()            │  │
        │  │  - createOffer()                │  │
        │  │  - createAnswer()               │  │
        │  └─────────────────────────────────┘  │
        └───────────────────────────────────────┘
                            ↓
    ┌─────────────────────────────────────────┐
    │       Socket.io Client (socket.js)      │
    │  ┌─────────────────────────────────────┐│
    │  │ Event Registration (with .off())    ││
    │  │ - callUser()                        ││
    │  │ - answerCall()                      ││
    │  │ - sendIceCandidate()                ││
    │  │ - rejectCall()                      ││
    │  │ - endCall()                         ││
    │  └─────────────────────────────────────┘│
    └─────────────────────────────────────────┘
                            ↓
            ┌────────────────────────────┐
            │    Socket.io Protocol      │
            │  Messages Forwarded        │
            │  - call-user               │
            │  - answer-call             │
            │  - ice-candidate           │
            │  - reject-call             │
            │  - end-call                │
            └────────────────────────────┘
                            ↓
    ┌─────────────────────────────────────────┐
    │   Backend Socket.io (server/index.js)   │
    │  ┌─────────────────────────────────────┐│
    │  │ Event Handlers                      ││
    │  │ socket.on('call-user', ...)         ││
    │  │ socket.on('answer-call', ...)       ││
    │  │ socket.on('ice-candidate', ...)     ││
    │  │ io.to(`user:${to}`).emit(...)       ││
    │  └─────────────────────────────────────┘│
    └─────────────────────────────────────────┘
                            ↓
    ┌──────────────────────────────────┐
    │   Direct P2P Connection          │
    │   (WebRTC Media Flow)            │
    │   - Video Stream                 │
    │   - Audio Stream                 │
    │   - DTLS Encrypted               │
    └──────────────────────────────────┘
```

---

## ✨ Summary of Fixes Applied

| Issue | Fix | Result |
|-------|-----|--------|
| Duplicate event listeners | Added `socket.off()` before `socket.on()` | Single callback per event |
| Missing answer handler | Added `onCallAnswered()` in initiateCall | Caller receives answer |
| No logging/debugging | Added console.log() at each step | Easy troubleshooting |
| State management | Ensured peerConnection state properly stored | ICE candidates handled correctly |
| Error handling | Added try-catch with clear error messages | Better UX on failures |
| Listener cleanup | Proper useEffect hooks with return | No memory leaks |

---

## 🚀 Next Steps

1. **Test locally** following the testing procedure
2. **Monitor console** for any errors
3. **Check Network tab** for Socket.io events
4. **Deploy to production** when satisfied
5. **Monitor error logs** in production

**All fixes are now complete. The call flow should work correctly!** 🎥


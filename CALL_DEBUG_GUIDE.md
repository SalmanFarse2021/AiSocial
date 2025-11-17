# Call Connection Debugging Guide

## Changes Made

### 1. Fixed Audio Element (CRITICAL)
- **Issue**: Audio element was sharing the same ref as video element
- **Fix**: Created separate `remoteAudioRef` for audio-only calls
- **Location**: `client/src/components/CallInterface.jsx`
- **Impact**: Audio stream now has its own dedicated element for playback

### 2. Enhanced Audio Playback
- Added retry logic for audio play
- Set volume to 1.0 and muted to false
- Added play retry with 100ms delay
- **Location**: `client/src/components/CallInterface.jsx` lines 50-75

### 3. Complete Logging Throughout Call Flow
All critical points now log:
- Call initiation (offer creation)
- Call reception (incoming-call)
- Answer creation and sending
- Answer reception (call-answered)
- ICE candidate generation and reception
- Remote stream reception (ontrack)
- Peer connection state changes

## Testing Instructions

### Step 1: Open Two Browser Windows
1. Open browser window A and login as User 1
2. Open browser window B (private/incognito) and login as User 2
3. Open Developer Console (F12) in **BOTH** windows
4. Keep both consoles visible

### Step 2: Initiate Call
**From Window A (Caller):**
1. Go to messages
2. Click audio call button for User 2
3. **Watch console for these logs:**
   ```
   📞 Audio call button clicked
   🎤 Requesting user media with constraints
   ✅ Got local stream with X tracks
   🎙️ Creating peer connection for: [userId]
   📝 Creating offer...
   ✅ Offer created and set as local description
   📤 Sending call to user: [userId]
   🧊 Generated ICE candidate: [type]
   ```

**From Window B (Receiver):**
1. **Watch console for these logs:**
   ```
   📞 Incoming call from: [username] Type: audio
   🔔 Showing incoming call popup for: [username]
   ```
2. Incoming call popup should appear
3. Click "Accept" button

### Step 3: Answer Call
**From Window B (after clicking Accept):**
1. **Watch console for:**
   ```
   🎤 Requesting user media for answer...
   ✅ Got local stream with X tracks
   🎙️ Creating peer connection for: [callerId]
   📡 Setting remote description from offer...
   ✅ Remote description set successfully
   📝 Creating answer...
   ✅ Answer created and set as local description
   📤 Sending answer to caller: [callerId]
   🧊 Generated ICE candidate: [type]
   ```

**From Window A (Caller should see):**
1. **Watch console for:**
   ```
   ✅ Call answered by: [userId]
   📡 Setting remote description with answer
   ✅ Remote description set successfully
   🎬 Call is now active, waiting for ICE connection...
   ❄️ ICE connection state: checking
   ❄️ ICE connection state: connected (or completed)
   📹 Remote stream received!
   ```

### Step 4: Verify Audio
**In BOTH windows:**
1. Check for: `📹 Remote stream received!`
2. Check for: `🔊 Setting remote stream to audio element` (in audio calls)
3. Check for: `✅ Remote audio playing successfully`
4. Check for: `❄️ ICE connection state: connected`

### Step 5: Check for Issues

#### If No Incoming Call Popup (Window B):
- Check Window B console for errors
- Verify socket connection: Look for "user-connected" event
- Verify backend logs: Should see "📞 Call from..."

#### If Call Not Answered (Window A):
- Check Window B console for: "📤 Sending answer to caller"
- Check Window A console for: "✅ Call answered by"
- If answer not received, check backend logs for "✅ Answer from..."

#### If No Audio (Both Windows):
- Check for: `📹 Remote stream received!` in console
- Check for: `🔊 Setting remote stream to audio element`
- Check for: `❌ Failed to play remote audio:` (if present, note the error)
- Check ICE connection state: Should be "connected" or "completed", not "failed" or "disconnected"

#### If ICE Connection Fails:
- Look for: `❄️ ICE connection state: failed`
- Check for: `🧊 Generated ICE candidate` in both windows (should see multiple)
- Check for: `🧊 Received ICE candidate` in both windows
- If no ICE candidates: Possible firewall/NAT issue
- If ICE failed: May need TURN server (currently using STUN only)

## Common Issues & Solutions

### Issue 1: Permission Denied
**Symptoms:** `Failed to start call. Please check your camera/microphone permissions`
**Solution:** Allow microphone access in browser settings

### Issue 2: No Incoming Call
**Symptoms:** Caller sees "calling" but receiver sees nothing
**Solutions:**
- Refresh receiver's page
- Check if receiver is logged in
- Check backend is running: `lsof -i :5050 | grep LISTEN`
- Check socket connection in receiver's console

### Issue 3: Call Received But No Audio
**Symptoms:** Incoming popup appears, accept works, but no audio
**Debug Steps:**
1. Check if `📹 Remote stream received!` appears
2. Check if ICE state reaches "connected"
3. Check if `🔊 Setting remote stream to audio element` appears
4. Check for autoplay errors in console

### Issue 4: ICE Connection Failed
**Symptoms:** `❄️ ICE connection state: failed`
**Possible Causes:**
- Firewall blocking UDP traffic
- NAT traversal issue
- Need TURN server (not just STUN)
**Solution:** May need to add TURN server credentials or test on same network

## Backend Verification

### Check Server is Running
```bash
lsof -i :5050 | grep LISTEN
```
Should show: `node [PID] ... TCP *:mmcc (LISTEN)`

### Check Backend Logs
Server should log:
```
📞 Call from [userId] to [userId]: audio
✅ Answer from [userId] to [userId]
🧊 ICE candidate from [userId] to [userId]
```

## Network Requirements

### Required for WebRTC:
- UDP ports open (for RTP media)
- Access to STUN servers (currently using Google STUN)
- Possibly TURN server for restrictive networks

### Current STUN Servers:
- stun.l.google.com:19302
- stun1-4.l.google.com:19302
- global.stun.twilio.com:3478

### Current TURN Server:
- openrelay.metered.ca (ports 80, 443)

## Next Steps Based on Logs

### If Offer Not Sent:
- Check initiateCall function errors
- Check getUserMedia permissions
- Check socket connection before emit

### If Answer Not Received:
- Check answerCall function in Window B
- Check if answer is being emitted
- Check backend forwards answer correctly

### If ICE Fails:
- Try on same network first
- Check firewall settings
- Consider adding more TURN servers
- Test with trickle ICE disabled

### If Audio Element Not Playing:
- Check browser autoplay policy
- Check audio track is not muted
- Check audio element has correct stream
- Try clicking on page first (user interaction required for autoplay)

## Success Indicators

✅ **Call Successfully Connected When You See:**
1. Both windows: `❄️ ICE connection state: connected`
2. Both windows: `📹 Remote stream received!`
3. Caller: `✅ Call answered by: [userId]`
4. Receiver: `📤 Sending answer to caller`
5. Audio calls: `🔊 Setting remote stream to audio element`
6. Audio calls: `✅ Remote audio playing successfully`
7. No errors in console

## File Locations for Reference

- **Call Context**: `client/src/contexts/CallContext.jsx` (1254 lines)
- **Call Interface**: `client/src/components/CallInterface.jsx` (405 lines)
- **Messenger (Call Buttons)**: `client/src/components/Messenger.jsx`
- **Backend Socket Events**: `server/src/index.js` (lines 96-286)
- **Socket Client**: `client/src/lib/socket.js`

## Contact Points for Debugging

1. **Offer Creation**: CallContext.jsx line 620-680
2. **Offer Sending**: CallContext.jsx line 705
3. **Incoming Call**: CallContext.jsx line 168
4. **Answer Creation**: CallContext.jsx line 820-830
5. **Answer Sending**: CallContext.jsx line 870
6. **Answer Reception**: CallContext.jsx line 231
7. **ICE Candidates**: CallContext.jsx lines 281, 500
8. **Remote Stream**: CallContext.jsx line 523 (ontrack)
9. **Audio Playback**: CallInterface.jsx line 62

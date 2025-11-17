# Video Call Feature - Comprehensive Testing Guide

## Phase 1 Integration Testing Checklist ✅

All components integrated. RTCStats wired. Ready for comprehensive testing.

---

## Test Suite 1: Incoming Call UI

### Test 1.1: Call Invite Modal Appears
**Prerequisites**: Two logged-in users
- [ ] User A calls User B
- [ ] User B sees CallInviteModal popup
- [ ] Modal shows:
  - [ ] User A's profile picture
  - [ ] User A's name
  - [ ] "Incoming call" label
  - [ ] Call type (Video/Audio)
  - [ ] Three buttons visible: Accept, Reject, Message

### Test 1.2: Accept Button
- [ ] Click "Accept" button
- [ ] Modal closes
- [ ] Call connects
- [ ] Video/audio streams start flowing
- [ ] CallControlsPanel appears

### Test 1.3: Reject Button
- [ ] User B receives another call from User A
- [ ] Click "Reject" button
- [ ] Modal closes
- [ ] Call ends
- [ ] User A sees "Call rejected" or similar

### Test 1.4: Message Button
- [ ] User B receives call from User A
- [ ] Click "Message" button
- [ ] Modal closes
- [ ] Messenger or chat interface opens (if implemented)
- [ ] User can send message

### Test 1.5: Modal Auto-Dismiss
- [ ] User B receives call from User A
- [ ] Wait 20 seconds without clicking anything
- [ ] Modal should auto-dismiss or call should timeout
- [ ] User A sees "No answer" or similar

---

## Test Suite 2: Active Call Controls

### Test 2.1: Mute Button (M Key)
**During active call**:
- [ ] Click microphone icon OR press M
- [ ] Icon changes to "muted" state (crossed out or different color)
- [ ] User A can still hear User B
- [ ] User B doesn't hear User A
- [ ] Press M again to unmute
- [ ] Audio restores

### Test 2.2: Video Toggle Button (V Key)
**During active call**:
- [ ] Click camera icon OR press V
- [ ] Video from local stream stops
- [ ] Remote user sees black/frozen screen (no video)
- [ ] "Video off" indicator shows
- [ ] Press V again to restore video
- [ ] Local video resumes

### Test 2.3: Camera Flip Button (F Key)
**During video call**:
- [ ] Click camera flip icon OR press F
- [ ] Camera switches from front to back (or vice versa)
- [ ] Video continues without interruption
- [ ] No significant delay or blank screen

### Test 2.4: Screen Share Button (X Key)
**During video call**:
- [ ] Click screen share icon OR press X
- [ ] Browser requests screen selection
- [ ] Select a screen/window to share
- [ ] Local video replaced with screen content
- [ ] Remote user sees shared screen
- [ ] Screen share status indicator shows
- [ ] Press X again to stop sharing
- [ ] Local camera video resumes

### Test 2.5: Speaker Button
**During active call**:
- [ ] Click speaker icon
- [ ] Audio output toggles (muted/unmuted)
- [ ] Icon state changes
- [ ] No change to audio being sent to other user

### Test 2.6: Fullscreen Button (Z Key)
**During video call**:
- [ ] Click fullscreen icon OR press Z
- [ ] Call interface goes fullscreen
- [ ] All controls remain accessible
- [ ] Press Z again to exit fullscreen
- [ ] Returns to normal view

### Test 2.7: End Call Button (ESC Key)
**During active call**:
- [ ] Click hang-up icon OR press ESC
- [ ] Confirmation dialog appears (optional)
- [ ] Call terminates
- [ ] Remote user sees call ended
- [ ] Return to chat/home screen

---

## Test Suite 3: Network Quality Indicator

### Test 3.1: Real-time Stats Display
**During video call**:
- [ ] Network Quality Indicator visible
- [ ] Shows color indicator (green/yellow/orange/red)
- [ ] Stats update visible (every 1 second)
- [ ] Shows: Bitrate, FPS, Packet Loss, Latency

### Test 3.2: Stats During Normal Connection
**Good network (~10Mbps+)**:
- [ ] Bitrate: 500+ kbps
- [ ] FPS: 24+ frames/sec
- [ ] Packet Loss: < 1%
- [ ] Latency: < 50ms
- [ ] Indicator: GREEN (excellent/good)

### Test 3.3: Stats During Network Stress
**Simulate poor network** (throttle to 1Mbps):
- [ ] Bitrate drops to 100-300 kbps
- [ ] FPS drops to 10-15
- [ ] Packet Loss increases to 2-5%
- [ ] Latency increases to 100-200ms
- [ ] Indicator: YELLOW/ORANGE (poor)

### Test 3.4: Stats During Disconnection
**Disconnect network completely**:
- [ ] Bitrate drops to 0
- [ ] FPS drops to 0
- [ ] Packet Loss increases significantly
- [ ] Latency spikes or shows 0
- [ ] Indicator: RED (disconnected)
- [ ] Reconnection attempt begins

### Test 3.5: Expandable Stats Panel
**If implemented**:
- [ ] Click on stats indicator
- [ ] Detailed stats panel expands
- [ ] Shows full stats history (optional)
- [ ] Close button dismisses panel
- [ ] Stats continue updating

---

## Test Suite 4: Keyboard Shortcuts

### Shortcut Testing Matrix
| Key | Function | Expected Result |
|-----|----------|-----------------|
| M | Mute toggle | Microphone icon changes |
| V | Video toggle | Camera icon changes |
| F | Flip camera | Camera source switches |
| X | Screen share | Share begins/ends |
| Z | Fullscreen | Call goes fullscreen/normal |
| ESC | End call | Call terminates |

**Test Method**:
- [ ] Start video call
- [ ] Press each key individually
- [ ] Verify expected result
- [ ] Repeat with multiple keys in sequence
- [ ] Test with focus on input field (shortcut should NOT work)

---

## Test Suite 5: Stream Management

### Test 5.1: Local Video Stream
**At call start**:
- [ ] Local video appears in PiP (Picture-in-Picture)
- [ ] Shows YOUR face/camera
- [ ] Video is live and responsive
- [ ] No lag or delay in local preview

### Test 5.2: Remote Video Stream
**When remote user's camera is on**:
- [ ] Remote video appears in main area
- [ ] Shows OTHER user's face/camera
- [ ] Video is live
- [ ] Clear and responsive

### Test 5.3: Audio Only (Audio Call)
**During audio call**:
- [ ] No video player visible (or shows placeholder)
- [ ] Call interface adapted for audio
- [ ] Audio controls still work
- [ ] Can switch to video if supported

### Test 5.4: Screen Share Stream
**During screen sharing**:
- [ ] Local video is main content
- [ ] Shows desktop/application being shared
- [ ] Clear and responsive
- [ ] Remote user sees shared content
- [ ] Local PiP still visible (optional)

---

## Test Suite 6: Error Handling

### Test 6.1: Camera Permission Denied
- [ ] Start video call
- [ ] Deny camera permission
- [ ] Error message displays
- [ ] User can still make audio call
- [ ] Option to retry camera permission

### Test 6.2: Microphone Permission Denied
- [ ] Start call
- [ ] Deny microphone permission
- [ ] Error message displays
- [ ] Option to retry permission
- [ ] Other users can still hear (if audio given before)

### Test 6.3: Network Disconnection During Call
- [ ] During call, disconnect internet
- [ ] "Reconnecting..." indicator shows
- [ ] After network restore, auto-reconnect
- [ ] Call resumes without manual action

### Test 6.4: Peer Connection Error
- [ ] Start call
- [ ] Simulate WebRTC error (browser console)
- [ ] Error gracefully handled
- [ ] User sees "Connection error" message
- [ ] Option to retry or end call

### Test 6.5: Missing Remote Stream
- [ ] Call established
- [ ] Remote stream fails to arrive
- [ ] Placeholder or "No video" message shows
- [ ] Audio may still work
- [ ] Reconnection attempted

---

## Test Suite 7: Performance & Stability

### Test 7.1: Memory Leaks
**During 10-minute call**:
- [ ] Open DevTools → Memory tab
- [ ] Take heap snapshot at start
- [ ] After 5 minutes, take another snapshot
- [ ] No significant memory increase
- [ ] After 10 minutes, end call
- [ ] Memory released after call ends

### Test 7.2: CPU Usage
**During video call**:
- [ ] Open System Monitor / Activity Monitor
- [ ] Check browser CPU usage
- [ ] Should be < 30% during normal call
- [ ] Reasonable for video encoding/decoding

### Test 7.3: Long Call Duration
- [ ] Keep call active for 30+ minutes
- [ ] No crashes or disconnections
- [ ] Stats continue updating
- [ ] Video/audio remains stable
- [ ] All controls remain responsive

### Test 7.4: Multiple Rapid Button Clicks
- [ ] Click buttons rapidly in sequence
- [ ] No UI freezes or crashes
- [ ] Commands queue properly
- [ ] No duplicate states

---

## Test Suite 8: User Experience

### Test 8.1: UI Responsiveness
**During call**:
- [ ] All buttons responsive to clicks
- [ ] No lag in button feedback
- [ ] Smooth animations/transitions
- [ ] Stats update smoothly

### Test 8.2: Accessibility
- [ ] Keyboard shortcuts work (all 6)
- [ ] Buttons are visible and clear
- [ ] Text is readable
- [ ] High contrast maintained
- [ ] Touch-friendly button sizes on mobile

### Test 8.3: Visual Feedback
- [ ] Active state clearly visible
- [ ] Muted state indicated
- [ ] Video off state indicated
- [ ] Screen sharing state indicated
- [ ] Network quality color changes visible

### Test 8.4: Audio/Video Sync
- [ ] Lip sync maintained
- [ ] No audio/video delay
- [ ] Both streams start simultaneously
- [ ] Both streams stop simultaneously

---

## Test Suite 9: Cross-Platform Testing

### Desktop Browsers
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari iOS
- [ ] Firefox Mobile

### Devices
- [ ] Laptop with webcam
- [ ] Desktop with external camera
- [ ] Tablet with front/back camera
- [ ] Mobile phone

---

## Test Suite 10: Multi-Peer Scenarios

### Test 10.1: Rapid Successive Calls
- [ ] User A calls User B, hangs up
- [ ] User A calls User B again (< 5 seconds)
- [ ] Call connects without issues
- [ ] No state corruption

### Test 10.2: Call Transfer Between Users
- [ ] User A on call with User B
- [ ] User C sends call to User A
- [ ] User A's device notifies of incoming call
- [ ] User A can accept/reject/ignore

### Test 10.3: Simultaneous Calls Attempt
- [ ] User A on call with User B
- [ ] User A tries to call User C
- [ ] System prevents simultaneous calls
- [ ] Error message or waiting message shows

---

## Regression Test Checklist

After any changes, verify:
- [ ] Existing audio calls still work
- [ ] Existing video calls still work
- [ ] Previous bugs haven't returned
- [ ] Performance not degraded
- [ ] All shortcuts still functional

---

## Bug Report Template

When finding issues, document:

```
**Issue Title**: [Brief description]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Environment**:
- Browser: [Chrome/Firefox/etc]
- OS: [Windows/Mac/Linux]
- Network: [Good/Poor/Disconnected]

**Screenshots/Video**: [Attach if possible]

**Console Errors**: [Paste any errors from DevTools]
```

---

## Testing Schedule

### Phase 1 - Quick Validation (30 minutes)
- [ ] Test 1.1-1.4 (Incoming calls)
- [ ] Test 2.1-2.2 (Mute & Video)
- [ ] Test 3.2 (Stats display)
- [ ] Test 4 (Keyboard shortcuts)

### Phase 2 - Full Integration (2-3 hours)
- [ ] All Test Suites 1-7
- [ ] Document any issues
- [ ] Fix critical bugs

### Phase 3 - Platform Testing (1-2 hours per platform)
- [ ] Test Suite 9 (Cross-platform)
- [ ] Fix platform-specific issues

### Phase 4 - Stress Testing (1-2 hours)
- [ ] Test Suite 7 (Performance)
- [ ] Test Suite 10 (Multi-peer)
- [ ] Optimization if needed

---

## Success Criteria

✅ **Phase 1 Complete When**:
- All Test Suites 1-8 pass
- No critical bugs
- No console errors
- All controls functional
- Stats displaying correctly
- Memory stable during 30+ minute call

✅ **Ready for Phase 2 When**:
- All success criteria met
- Cross-platform testing complete
- Performance acceptable
- User experience smooth

---

## Notes

- Test with real network conditions (good/poor/wireless)
- Test with various camera qualities (HD, 720p, VGA)
- Test with different audio quality settings
- Document any quirks or unexpected behaviors
- Collect performance metrics for optimization

---

**Last Updated**: After RTCStats Integration
**Status**: Ready for Testing
**Estimated Time**: 6-8 hours for full testing

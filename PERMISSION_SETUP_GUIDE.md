# 🎤 Camera/Microphone Permission Setup Guide

## 🔴 If You See: "Failed to start call. Camera/microphone permission was denied"

This means your browser blocked access to your camera/microphone. Here's how to fix it:

---

## 🌐 Google Chrome / Brave / Edge

### Method 1: Click the Permission Icon (Quickest)
1. Look at your browser's address bar (where it shows `http://localhost:3000`)
2. You'll see a 🎥 or 🔒 icon on the left side
3. Click that icon
4. Change **Camera** and **Microphone** to **"Allow"**
5. Click **"Done"**
6. **Refresh the page** (press `F5` or `Cmd+R`)
7. Try the call again

### Method 2: Browser Settings
1. Open Chrome Settings: `chrome://settings/content/camera`
2. Under **"Allowed to use your camera"**, add `http://localhost:3000`
3. Go to: `chrome://settings/content/microphone`
4. Under **"Allowed to use your microphone"**, add `http://localhost:3000`
5. Refresh the page and try again

### Method 3: Reset Site Permissions
1. Click the 🔒 lock icon in address bar
2. Click **"Site settings"**
3. Find **Camera** and **Microphone**
4. Change both to **"Allow"**
5. Refresh the page

---

## 🦊 Firefox

1. Click the 🔒 lock icon in the address bar
2. Click the **">"** arrow next to "Connection secure"
3. Click **"More Information"**
4. Go to **"Permissions"** tab
5. Find **"Use the Camera"** → Uncheck **"Use Default"** → Check **"Allow"**
6. Find **"Use the Microphone"** → Uncheck **"Use Default"** → Check **"Allow"**
7. Close the window
8. Refresh the page

---

## 🧭 Safari (macOS)

1. Safari menu → **"Settings for localhost"** (or "Settings for This Website")
2. Change **Camera** to **"Allow"**
3. Change **Microphone** to **"Allow"**
4. Close settings
5. Refresh the page

**If that doesn't work:**
1. Safari menu → **"Settings"** → **"Websites"**
2. Click **"Camera"** in sidebar
3. Find `localhost` and change to **"Allow"**
4. Click **"Microphone"** in sidebar
5. Find `localhost` and change to **"Allow"**
6. Close settings and refresh

---

## 💻 System-Level Permissions (macOS)

If browser settings don't work, check macOS settings:

1. Open **System Settings** (or System Preferences)
2. Go to **"Privacy & Security"**
3. Click **"Camera"**
4. Make sure your browser (Chrome, Firefox, Safari) is **checked ✓**
5. Go back and click **"Microphone"**
6. Make sure your browser is **checked ✓**
7. **Restart your browser** completely (quit and reopen)
8. Try the call again

---

## 🪟 System-Level Permissions (Windows)

1. Open **Settings**
2. Go to **"Privacy & security"** → **"Camera"**
3. Turn on **"Camera access"** and **"Let apps access your camera"**
4. Make sure your browser has permission
5. Go to **"Privacy & security"** → **"Microphone"**
6. Turn on **"Microphone access"** and **"Let apps access your microphone"**
7. Make sure your browser has permission
8. **Restart your browser**
9. Try the call again

---

## 🐧 Linux

### Check if camera/mic is detected:
```bash
# List video devices
ls -l /dev/video*

# Test microphone
arecord -l

# Test camera with VLC or cheese
vlc v4l2:///dev/video0
```

### Browser permissions:
- **Chrome/Chromium**: Same as Chrome instructions above
- **Firefox**: Same as Firefox instructions above

---

## 🔍 Troubleshooting Specific Errors

### Error: "No camera or microphone found"
**Solution:**
- Make sure your device is physically connected
- Check if it works in other apps (Zoom, Skype, etc.)
- On Mac: Go to **System Settings → Camera/Microphone** and grant access
- On Windows: Check **Device Manager** → **Audio inputs/outputs**

### Error: "Camera/microphone is already in use"
**Solution:**
- Close other apps using camera/mic (Zoom, Teams, Discord, etc.)
- Close other browser tabs that might be using them
- Restart your browser completely
- On Mac: Check menu bar for apps with camera indicator (green dot)

### Error: "Your browser does not support camera/microphone access"
**Solution:**
- Make sure you're using HTTPS or localhost (HTTP works for localhost)
- Update your browser to the latest version
- Try a different browser (Chrome recommended for WebRTC)

### Error: "Camera/microphone does not support the requested settings"
**Solution:**
- Your camera doesn't support 720p (HD)
- Lower the video quality in the code
- Or use audio-only calling instead

---

## ✅ How to Test if Permissions Work

### Quick Test:
1. Open browser console (F12 or Cmd+Option+I)
2. Paste this and press Enter:
```javascript
navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  .then(stream => {
    console.log('✅ SUCCESS! Camera and microphone work!');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => {
    console.error('❌ ERROR:', err.name, err.message);
  });
```
3. Browser should ask for permission
4. Click "Allow"
5. Check console:
   - ✅ **"SUCCESS! Camera and microphone work!"** → You're good to go!
   - ❌ **"ERROR: NotAllowedError"** → Permission denied, follow steps above
   - ❌ **"ERROR: NotFoundError"** → No device found, check connections

---

## 🎯 After Fixing Permissions

1. **Refresh the page** (F5 or Cmd+R)
2. Navigate to **Messages**
3. Select a conversation
4. Click the 📞 **Phone** or 🎥 **Video** icon
5. You should now see: "Calling..."
6. The other user accepts
7. ✅ **Call should connect!**

---

## 🆘 Still Not Working?

Check browser console (F12) and look for:
- `🎤 Requesting user media with constraints:`
- Any red error messages

Common console errors:
- `NotAllowedError` → Permission denied (follow steps above)
- `NotFoundError` → No device connected
- `NotReadableError` → Device in use by another app
- `OverconstrainedError` → Camera doesn't support settings

If you see any of these, refer to the specific error solutions above.

---

## 📱 Mobile Testing Notes

- **iOS Safari**: Must use HTTPS (not HTTP), even for local testing
- **Android Chrome**: Works with HTTP on localhost
- **Mobile browsers** may require different permission flows
- Consider using **ngrok** or similar to test with HTTPS locally

---

**💡 Pro Tip**: After granting permissions, **bookmark the page** so you don't have to grant them again!

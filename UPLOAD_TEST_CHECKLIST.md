# Image Upload - Quick Test Checklist ✅

## 🔧 Pre-Test Setup

- [ ] Server running: `cd server && npm start` (should see ✅ MongoDB connected, ✅ Cloudinary configured)
- [ ] Client running: `cd client && npm run dev` (should see Ready on http://localhost:3000)
- [ ] Browser open to http://localhost:3000
- [ ] DevTools open (F12) with Console tab visible

## 📝 Test Steps

### Test 1: Verify Server Endpoint
```bash
# In terminal, run:
curl -X POST http://localhost:5050/api/upload/signature \
  -H "Content-Type: application/json" \
  -d '{"folder":"aisocial"}' | jq .

# ✅ Should see JSON with: timestamp, folder, signature, cloudName, apiKey
# ❌ If error, check server logs for ❌ Missing environment variable messages
```

### Test 2: Manual Upload Test
1. Navigate to http://localhost:3000/home
2. Look for the **image upload area** at the top
3. Click to select an image file (any JPG, PNG, GIF, WebP under 10MB)
4. **Watch the DevTools Console** for logs starting with 📝 or 🚀
5. Should see:
   - 🚀 Starting Cloudinary upload...
   - 📝 Fetching Cloudinary signature...
   - ✅ Signature obtained successfully
   - 📤 Sending request to Cloudinary...
   - ✅ Upload successful!
   - 🖼️ Image URL: https://res.cloudinary.com/...

### Test 3: Verify Image Display
1. After upload succeeds, you should see:
   - ✅ Image preview appears in the UI
   - ✅ Image is in the "Create Post" section
   - ✅ You can add caption and AI suggestions work
2. Click "Post" to create the post
3. ✅ Post appears in feed with image

### Test 4: Refresh & Persist
1. Refresh the page (Cmd+R or Ctrl+R)
2. Navigate to home feed
3. ✅ Your posted image should still be there

## 🐛 If Something Goes Wrong

### Check Server Console
Look for these patterns:
- ✅ "Signature generated successfully" = Good
- ❌ "CLOUDINARY_API_SECRET not configured" = Env var missing
- ❌ "Failed to generate signature" = Signature generation error

### Check Browser Console
Look for these in order:
1. 📝 Fetching Cloudinary signature... (RED = Network error)
2. 📤 Sending request to Cloudinary... (RED = Signature is invalid or network error)
3. ✅ Upload successful! (Should see this)

### Check Network Tab
1. DevTools → Network tab
2. Look for POST requests:
   - `/api/upload/signature` - Should be **200** (green)
   - `api.cloudinary.com` - Should be **200** (green)

### Check File
- [ ] Is the file an image? (JPG, PNG, GIF, WebP)
- [ ] Is it under 10MB?
- [ ] Is it a valid image file (not corrupted)?

## 🎯 Expected Behavior

### Upload Process (should take 1-3 seconds):
1. Select image → validation happens instantly
2. Loading indicator appears
3. Preview image shows immediately (blob URL)
4. After 1-3 seconds: Image URL changes to Cloudinary URL
5. Loading indicator disappears
6. Success! Image ready to post

### Post Creation:
1. Add optional caption
2. (Optional) Generate AI captions
3. Click "Post"
4. Post appears at top of feed with image
5. Refresh page → image still there

## 📊 Success Indicators

✅ All of these should be true:
- [ ] No red errors in console (check for 4xx or 5xx status codes)
- [ ] Server console shows "✅ Signature generated successfully"
- [ ] Browser console shows "✅ Upload successful!"
- [ ] Image URL appears in browser console
- [ ] Image preview visible in UI
- [ ] Post saves to database
- [ ] Image persists after refresh

## 🔴 Common Failures

| Issue | Cause | Fix |
|-------|-------|-----|
| Network error when fetching signature | Server not running | `npm start` in /server |
| "Invalid signature" error | Env vars not loaded | Restart server |
| "Failed to get upload signature (500)" | Server error | Check server console |
| Image doesn't display | URL is wrong or image deleted | Check browser console for URL |
| Upload hangs/never completes | Network timeout | Check network tab, try smaller file |
| File type error | Selected non-image file | Select JPG, PNG, GIF, or WebP |

## 📋 Report Template

If upload fails and you need help, provide:

```
Browser Console Error:
[paste full error message]

Server Console Output:
[paste relevant lines with ❌ or ✅]

Network Request:
- Signature endpoint response: [200/400/500]
- Cloudinary endpoint response: [200/400/500]

File Details:
- Name: [filename]
- Size: [size in MB]
- Type: [file type]
```

---

**Version:** v1.0 (Nov 15, 2025)
**Status:** Ready for Testing ✅

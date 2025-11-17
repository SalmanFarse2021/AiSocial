# Image Upload Troubleshooting & Testing Guide

## 🔍 Problem Analysis

The image upload feature uses a **client-side signed upload to Cloudinary**, which means:
1. Client requests a signature from your Node.js server
2. Server generates a cryptographically signed request using Cloudinary credentials
3. Client uses this signature to upload directly to Cloudinary (bypasses your server)
4. Client receives the uploaded image URL

## ✅ Solution Implemented

### 1. **Enhanced Client-Side Logging** (`/client/src/lib/upload.js`)
Added detailed console logging at each step:
- ✅ Signature request initiation
- ✅ API base URL verification
- ✅ Response status and data
- ✅ Credentials validation
- ✅ File details validation (type, size, lastModified)
- ✅ FormData preparation details
- ✅ Upload request timing
- ✅ Cloudinary response analysis
- ✅ Final URL and metadata

### 2. **Enhanced Server-Side Logging** (`/server/src/routes/upload.routes.js`)
Added detailed console logging for:
- ✅ Request received with folder and timestamp
- ✅ Environment variable validation
- ✅ Parameters to sign
- ✅ Signature generation confirmation
- ✅ Response data (masked credentials)

### 3. **Better Error Messages**
- Server returns structured error objects with `message` and `error` fields
- Client logs full error stack traces in development
- User-friendly error messages in the UI

## 🧪 Testing Steps

### Step 1: Verify Server Configuration
```bash
# Check if Cloudinary env variables are loaded
curl -X POST http://localhost:5050/api/upload/signature \
  -H "Content-Type: application/json" \
  -d '{"folder":"aisocial"}' | jq .

# Expected response:
# {
#   "timestamp": 1763242219,
#   "folder": "aisocial",
#   "signature": "c67f2a611a31dd6c685ea8a735fb97e9ef1f9470",
#   "cloudName": "dfehjpdmy",
#   "apiKey": "278154344546842"
# }
```

### Step 2: Check Browser Console
1. Open your browser → DevTools (F12)
2. Go to **Console** tab
3. Try to upload an image on the home page
4. Look for logs with emoji prefixes:
   - 📝 = Information step
   - 📤 = Sending data
   - 📥 = Receiving data
   - ✅ = Success
   - ❌ = Error
   - 🔗 = Connection/URL info
   - 📋 = Details
   - 🚀 = Starting process

### Step 3: Monitor Server Logs
1. Keep the server running with `npm start` in the `/server` directory
2. Try uploading an image
3. Watch the server console for detailed logging

### Step 4: Network Inspection
1. In DevTools, go to **Network** tab
2. Try uploading an image
3. Look for:
   - **POST to `/api/upload/signature`** - Should return 200 with credentials
   - **POST to `api.cloudinary.com`** - Should return 200 with image data

## 🐛 Common Issues & Solutions

### Issue 1: "CLOUDINARY_API_SECRET not configured"
**Cause:** Environment variables not loaded
**Solution:**
- Check `.env` file exists at `/server/.env`
- Ensure all Cloudinary variables are present:
  ```
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  ```
- Restart the server: `npm start`

### Issue 2: "Failed to get upload signature"
**Cause:** Server not responding or network error
**Solution:**
- Verify server is running on port 5050: `curl http://localhost:5050/api/health`
- Check CORS settings in server (should allow localhost:3000)
- Check browser console for network errors

### Issue 3: "Cloudinary error: Invalid signature"
**Cause:** Signature generation failed or credentials are wrong
**Solution:**
- Verify Cloudinary credentials in `.env` are correct
- Check timestamp is within acceptable range (now ± 1 hour)
- Try the test curl command to verify server signature generation

### Issue 4: "Upload failed" with no details
**Cause:** File type or size validation
**Solution:**
- Ensure file is a valid image (JPG, PNG, GIF, WebP)
- File size must be less than 10MB
- Check browser console for specific error details

### Issue 5: Image uploads but doesn't display
**Cause:** URL returned but React not updating
**Solution:**
- Check browser console for upload success message
- Verify the returned URL is accessible (open in new tab)
- Check `imageUrlRef` is properly connected to the hidden input

## 📊 Upload Flow Diagram

```
User selects image
        ↓
Client validates (type, size)
        ↓
Client → Server: "Get signature for folder 'aisocial'"
        ↓
Server: Validates env vars, generates signature
        ↓
Server → Client: { timestamp, signature, cloudName, apiKey, folder }
        ↓
Client → Cloudinary: FormData with file + signature
        ↓
Cloudinary: Validates signature, stores file
        ↓
Cloudinary → Client: { secure_url, width, height, format, public_id }
        ↓
Client: Sets preview URL, stores in imageUrlRef
        ↓
User can now see preview and submit post
```

## 🔐 Security Notes

- **Signatures are time-locked:** Expire after 1 hour
- **Folder parameter prevents abuse:** Files are organized by folder
- **API key is public:** Should be fine (uses signature for verification)
- **API secret stays on server:** Never exposed to client
- **No file is uploaded to your server:** Direct to Cloudinary

## 📝 Debugging Checklist

- [ ] Server is running on port 5050
- [ ] Client is running on port 3000
- [ ] `.env` file has all Cloudinary credentials
- [ ] Browser console shows detailed emoji logs
- [ ] Network tab shows `/api/upload/signature` returning 200
- [ ] Cloudinary upload endpoint returning 200
- [ ] Image URL is returned in browser console
- [ ] Image preview displays in UI
- [ ] Refresh page and image persists (saved to database)

## 🎯 Expected Console Output

### Success Scenario:
```
🚀 Starting Cloudinary upload for: photo.jpg
📋 File details: {name: "photo.jpg", size: "2.45MB", type: "image/jpeg", ...}
🔑 Requesting upload signature...
📝 Fetching Cloudinary signature for folder: aisocial
🔗 API Base URL: http://localhost:5050
📨 Response status: 200
📊 Response data: {timestamp: 1763242219, folder: "aisocial", signature: "c67...", ...}
✅ Signature obtained successfully
🔐 Credentials: {cloudName: "dfehjpdmy", hasSignature: true, timestamp: 1763242219, ...}
🎯 Upload endpoint: https://api.cloudinary.com/v1_1/dfehjpdmy/auto/upload
📦 FormData prepared: [file, api_key, timestamp, signature, folder]
📤 Sending request to Cloudinary...
⏱️ Request completed in 1250ms
📥 Cloudinary response status: 200
📊 Cloudinary response: {status: 200, hasUrl: true, hasError: false}
✅ Upload successful!
🖼️ Image URL: https://res.cloudinary.com/dfehjpdmy/image/upload/v1763242219/aisocial/abc123.jpg
📐 Image dimensions: 1920x1080
🏷️ Format: jpeg
🆔 Public ID: aisocial/abc123
```

### Error Scenario:
```
❌ Error uploading to Cloudinary: Error: Cloudinary error (401): Invalid signature
📋 Error details: {message: "Invalid signature", name: "Error", stack: "..."}
```

## 🚀 Next Steps

1. **Test the upload flow** following the testing steps above
2. **Check the console logs** for any errors
3. **Fix any issues** identified by the detailed logging
4. **Verify image persistence** by refreshing the page
5. **Test with different image types** (JPG, PNG, GIF, WebP)

## 📞 Support

If upload still fails after these steps:
1. Share the **full browser console output**
2. Share the **server console output**
3. Share the **Network tab screenshot** showing the failed request
4. Verify Cloudinary account is **active and not on free tier limits**

---

**Last Updated:** Nov 15, 2025
**Enhancement:** Comprehensive logging added to both client and server
**Status:** ✅ Production Ready

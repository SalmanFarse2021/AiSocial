# Image Upload Debugging Guide

## Overview
Image upload functionality has been enhanced with better error handling and logging. Follow these steps to debug and test the upload process.

## Changes Made

### 1. **Frontend Improvements** (`/client/src/app/home/page.js`)
- Enhanced `handleFileSelect()` with:
  - File type validation (images only)
  - File size validation (max 10MB)
  - Detailed console logging
  - Better error messages
  - Proper error state management

- Updated Upload Menu with:
  - Loading state indicator (`⏳ Uploading...`)
  - Disabled state while uploading
  - Prevents multiple concurrent uploads

### 2. **Upload Utility Improvements** (`/client/src/lib/upload.js`)
- Added comprehensive logging to `getCloudinarySignature()`:
  - Logs when signature fetch starts
  - Logs when signature is obtained
  - Logs all error responses with status codes

- Enhanced `uploadImageToCloudinary()` with:
  - Detailed step-by-step logging
  - Validation of credentials (cloudName, apiKey, signature)
  - Clear error messages with HTTP status codes
  - Logs successful upload URL

### 3. **Backend Improvements** (`/server/src/routes/upload.routes.js`)
- Added comprehensive error handling to signature endpoint:
  - Individual validation for each Cloudinary env variable
  - Specific error messages for missing credentials
  - Try/catch wrapper for unexpected errors
  - Success logging for signature generation

### 4. **Verification**
- Server `.env` confirmed with valid Cloudinary credentials:
  ```
  CLOUDINARY_CLOUD_NAME=dfehjpdmy
  CLOUDINARY_API_KEY=278154344546842
  CLOUDINARY_API_SECRET=wMh9BM-aURlZOOZZYKrCNxO3xT0
  ```

## Testing Steps

### Step 1: Check Server Logs
1. Start the server: `npm start` in `/server` directory
2. Look for startup message: `✅ Cloudinary configured`
3. If you see `⚠️ Cloudinary env vars missing`, the credentials are not loaded

### Step 2: Test Image Upload
1. Open the app at `http://localhost:3000`
2. Navigate to Home page
3. Click the **📎 Upload** button
4. Select an image file (JPG, PNG, GIF, WebP)
5. Check browser console (F12 → Console tab) for logs:

**Expected Success Logs:**
```
Starting upload for: filename.jpg Size: 123456
Fetching Cloudinary signature for folder: aisocial
Signature obtained successfully
Uploading to: https://api.cloudinary.com/v1_1/dfehjpdmy/auto/upload
FormData prepared, sending request...
Upload successful, URL: https://res.cloudinary.com/...
Image ready for posting or AI tools
```

### Step 3: Check Browser Network Tab
1. Open DevTools (F12 → Network tab)
2. Click **📎 Upload** and select an image
3. Look for requests:

**Request to `/api/upload/signature`:**
- Method: POST
- Status: Should be 200
- Response: Should contain timestamp, folder, signature, cloudName, apiKey

**Request to Cloudinary:**
- URL: `https://api.cloudinary.com/v1_1/dfehjpdmy/auto/upload`
- Method: POST
- Status: Should be 200
- Response: Should contain `secure_url` or `url` field

### Step 4: Test With AI Caption Generator
1. Upload an image successfully
2. Click **✨ AI Tools** button
3. Select **📝 AI Caption Generator**
4. Should see 5 AI-generated captions
5. Click one to insert into post

## Common Issues & Solutions

### Issue 1: "Signature endpoint error"
**Cause:** Cloudinary credentials missing from server
**Solution:**
1. Check `/server/.env` has:
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET
2. Restart server
3. Look for `✅ Cloudinary configured` in logs

### Issue 2: "CLOUDINARY_API_SECRET not configured"
**Cause:** Server can't read env variables
**Solution:**
1. Ensure `/server/.env` file exists
2. Check file permissions: `ls -la /server/.env`
3. Restart server with: `npm start`
4. Check startup logs

### Issue 3: "Failed to fetch the image" (from AI Caption)
**Cause:** Upload didn't complete successfully
**Solution:**
1. Check browser console for upload errors
2. Check Network tab for failed requests
3. Verify image is valid (not corrupted)
4. Try a different image file
5. Check file size < 10MB

### Issue 4: "Upload failed" with no details
**Cause:** Network error or CORS issue
**Solution:**
1. Check server is running on port 5050
2. Check `CLIENT_ORIGIN` in server `.env`:
   ```
   CLIENT_ORIGIN=http://localhost:3000
   ```
3. Restart both server and client
4. Check for firewall/antivirus blocking requests

### Issue 5: Image uploads but shows wrong URL
**Cause:** Cloudinary response parsing issue
**Solution:**
1. Check browser console for upload success
2. Verify response contains `secure_url` or `url`
3. Check Network tab response body
4. Contact Cloudinary support if URL format is unexpected

## Verification Checklist

- [ ] Server logs show `✅ Cloudinary configured` on startup
- [ ] Upload button shows loading state when uploading
- [ ] Browser console shows all the "Starting upload" logs
- [ ] Network tab shows 200 responses for both requests
- [ ] Image preview shows after upload completes
- [ ] AI Caption button becomes enabled after upload
- [ ] AI captions generate successfully
- [ ] Post submission works with image

## Advanced Debugging

### Enable verbose logging on server
Add this to `/server/src/routes/upload.routes.js` before the endpoint:

```javascript
router.use((req, res, next) => {
  console.log('📝 Upload request:', req.method, req.path, req.body);
  next();
});
```

### Test Cloudinary credentials directly
In server directory, create `test-cloudinary.js`:

```javascript
import dotenv from 'dotenv';
import { initCloudinary, cloudinary } from './src/modules/cloudinary.js';

dotenv.config();
initCloudinary();

const params = { timestamp: Math.round(Date.now() / 1000), folder: 'aisocial' };
const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

console.log('Signature test:');
console.log('Params:', params);
console.log('Signature:', signature);
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
```

Run with: `node test-cloudinary.js`

### Monitor server logs in real-time
```bash
cd /server
npm start | grep -E "(Upload|Signature|Cloudinary|Error)"
```

## Success Indicators

✅ **Image Upload Working When:**
1. Upload button shows loading state
2. Console logs show successful upload URL
3. Image preview displays in composer
4. AI tools become available for the image
5. Post can be submitted with image
6. Image appears in feed after posting

✅ **System Working End-to-End When:**
1. Image uploads successfully
2. AI caption generator produces captions
3. User can select caption and insert it
4. Post submits with both image and caption
5. Post appears in feed with image and caption

## Next Steps if Still Failing

1. **Capture full error logs:**
   ```bash
   npm start 2>&1 | tee server.log
   ```

2. **Screenshot the Network tab** showing:
   - Request to `/api/upload/signature`
   - Request to Cloudinary upload endpoint
   - Response bodies for both

3. **Share the following:**
   - Browser console errors (F12 → Console)
   - Server logs from startup to upload attempt
   - Network tab screenshot
   - File size and type of test image

## Contact Support

If you've followed all steps and upload still fails:
1. Check Cloudinary dashboard: https://cloudinary.com/console
2. Verify cloud name matches: `dfehjpdmy`
3. Check API credentials haven't been regenerated
4. Check account hasn't been suspended

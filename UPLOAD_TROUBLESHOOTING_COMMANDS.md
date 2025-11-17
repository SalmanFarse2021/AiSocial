# Quick Troubleshooting Commands

## Server Setup & Testing

### 1. Start Server with Full Logging
```bash
cd /server
npm start
```
Look for: `✅ Cloudinary configured`

### 2. Test Cloudinary Credentials
Create a temporary test file to verify credentials work:

**File: `/server/test-upload.js`**
```javascript
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

console.log('Testing Cloudinary Configuration...\n');
console.log('CLOUDINARY_CLOUD_NAME:', CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing');
console.log('CLOUDINARY_API_KEY:', CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('CLOUDINARY_API_SECRET:', CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing');

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder: 'aisocial' };
  const signature = cloudinary.utils.api_sign_request(params, CLOUDINARY_API_SECRET);

  console.log('\n✅ Cloudinary initialized successfully!\n');
  console.log('Signature Test:');
  console.log('  Timestamp:', timestamp);
  console.log('  Folder:', params.folder);
  console.log('  Signature:', signature);
  console.log('\n✅ All credentials are valid!');
} else {
  console.log('\n❌ Missing credentials - check /server/.env');
}
```

Run it:
```bash
cd /server
node test-upload.js
```

### 3. Monitor Server in Real-Time
```bash
cd /server
npm start 2>&1 | grep -E "(Upload|Signature|Cloudinary|Error|configured)"
```

### 4. Check Server Environment
```bash
cd /server
echo "CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME"
echo "CLOUDINARY_API_KEY=$CLOUDINARY_API_KEY"
echo "CLOUDINARY_API_SECRET=$CLOUDINARY_API_SECRET"
```

## Client Testing

### 1. Start Client
```bash
cd /client
npm run dev
```

### 2. Open Browser DevTools
```
F12 → Console tab
```

### 3. Test Upload with Console Open
1. Click **📎 Upload** button
2. Select an image
3. Watch console for these logs:

**Success Pattern:**
```
Starting upload for: image.jpg Size: 12345
Fetching Cloudinary signature for folder: aisocial
Signature obtained successfully
Uploading to: https://api.cloudinary.com/v1_1/dfehjpdmy/auto/upload
FormData prepared, sending request...
Upload successful, URL: https://res.cloudinary.com/...
```

**Error Pattern (Debug What's Shown):**
- If stops after "Starting upload for:" → File validation error
- If stops after "Fetching signature:" → Network error
- If stops after "Signature obtained:" → Signature validation failed
- If stops after "FormData prepared:" → Cloudinary rejected upload

### 4. Check Network Requests (F12 → Network tab)

**Filter for signature request:**
```
Request: POST /api/upload/signature
Expected Status: 200
Expected Response: 
{
  "timestamp": 1234567890,
  "folder": "aisocial",
  "signature": "abcd1234...",
  "cloudName": "dfehjpdmy",
  "apiKey": "278154344546842"
}
```

**Filter for Cloudinary request:**
```
Request: POST https://api.cloudinary.com/v1_1/dfehjpdmy/auto/upload
Expected Status: 200
Expected Response contains:
{
  "secure_url": "https://res.cloudinary.com/...",
  "width": 1920,
  "height": 1080,
  "format": "jpg",
  "public_id": "aisocial/..."
}
```

### 5. Test Different File Types
```javascript
// In browser console, test upload programmatically
async function testUpload(filename, mimeType) {
  const response = await fetch(
    'https://api.cloudinary.com/v1_1/dfehjpdmy/auto/upload',
    { method: 'POST' }
  );
  console.log(`${filename}: ${response.status} ${response.statusText}`);
}

// Try different scenarios
testUpload('test.jpg', 'image/jpeg');
testUpload('test.png', 'image/png');
testUpload('test.gif', 'image/gif');
testUpload('test.webp', 'image/webp');
```

## Common Quick Fixes

### Fix 1: Server Not Starting
```bash
# Check if port 5050 is in use
lsof -i :5050

# Kill the process if needed
kill -9 <PID>

# Or use different port
PORT=5051 npm start
```

### Fix 2: Env Variables Not Loading
```bash
# Verify .env file exists
ls -la /server/.env

# Check if readable
cat /server/.env | grep CLOUDINARY

# Update .env
nano /server/.env
```

### Fix 3: CORS Issues
```bash
# Verify CLIENT_ORIGIN in server .env
cat /server/.env | grep CLIENT_ORIGIN

# Should show: http://localhost:3000
```

### Fix 4: Cloudinary Not Configured
```bash
# Restart server after changing .env
npm start

# Look for this message:
# ✅ Cloudinary configured

# If missing, env vars didn't load
```

## Advanced: Capture Full Logs

### Create Log File
```bash
cd /server
npm start > server.log 2>&1 &
echo $! > server.pid

# Run uploads in browser...

# Stop and save logs
kill $(cat server.pid)
cat server.log
```

### Send Logs for Support
```bash
# Create debug package
mkdir debug-logs
cp /server/.env debug-logs/
cp server.log debug-logs/

# (Remove sensitive data from .env first!)
sed 's/API_SECRET=.*/API_SECRET=REDACTED/' /server/.env > debug-logs/env-safe

zip -r debug-logs.zip debug-logs/
```

## One-Command Test Suite

### Test Everything
```bash
#!/bin/bash
echo "🧪 Starting AiSocial Upload Test Suite"
echo ""

echo "1️⃣ Checking server .env..."
grep -q CLOUDINARY_CLOUD_NAME /server/.env && echo "✅ CLOUDINARY_CLOUD_NAME found" || echo "❌ CLOUDINARY_CLOUD_NAME missing"
grep -q CLOUDINARY_API_KEY /server/.env && echo "✅ CLOUDINARY_API_KEY found" || echo "❌ CLOUDINARY_API_KEY missing"
grep -q CLOUDINARY_API_SECRET /server/.env && echo "✅ CLOUDINARY_API_SECRET found" || echo "❌ CLOUDINARY_API_SECRET missing"
echo ""

echo "2️⃣ Checking ports..."
lsof -i :5050 && echo "✅ Server port 5050 available" || echo "⚠️ Port 5050 might be in use"
lsof -i :3000 && echo "⚠️ Client port 3000 might be in use" || echo "✅ Client port 3000 available"
echo ""

echo "3️⃣ Checking files..."
[ -f /server/src/routes/upload.routes.js ] && echo "✅ Upload routes exist" || echo "❌ Upload routes missing"
[ -f /client/src/lib/upload.js ] && echo "✅ Upload utility exists" || echo "❌ Upload utility missing"
echo ""

echo "✅ Pre-flight checks complete!"
echo ""
echo "Next steps:"
echo "1. Start server: cd /server && npm start"
echo "2. Start client: cd /client && npm run dev"
echo "3. Open http://localhost:3000"
echo "4. Test upload with console open (F12)"
```

Save as `/test-upload.sh` and run:
```bash
chmod +x test-upload.sh
./test-upload.sh
```

## Direct Cloudinary API Test

Test Cloudinary upload directly (no app):

```bash
# Get credentials from .env
source /server/.env

# Upload test file
curl -X POST \
  -F "file=@/path/to/test.jpg" \
  -F "api_key=$CLOUDINARY_API_KEY" \
  -F "timestamp=$(date +%s)" \
  -F "signature=$(echo -n "timestamp=$(date +%s)folder=aisocial$CLOUDINARY_API_SECRET" | openssl sha1 -hex)" \
  -F "folder=aisocial" \
  https://api.cloudinary.com/v1_1/dfehjpdmy/auto/upload
```

Expected successful response:
```json
{
  "public_id": "aisocial/...",
  "version": 1234567890,
  "signature": "abc123...",
  "width": 1920,
  "height": 1080,
  "format": "jpg",
  "resource_type": "image",
  "created_at": "2024-01-01T12:00:00Z",
  "tags": [],
  "bytes": 12345,
  "type": "upload",
  "etag": "abc123...",
  "placeholder": false,
  "url": "http://res.cloudinary.com/...",
  "secure_url": "https://res.cloudinary.com/..."
}
```

## Reset to Clean State

If stuck, clean and restart:

```bash
# Stop all processes
pkill -f "npm start"
pkill -f "npm run dev"

# Clear node modules and reinstall
cd /server
rm -rf node_modules
npm install

cd /client
rm -rf node_modules
npm install

# Clear Next.js cache
rm -rf /client/.next

# Start fresh
cd /server && npm start &
cd /client && npm run dev
```

---

**💡 Tip:** Keep browser console open while testing. All upload steps are logged for easy debugging!

// Quick debug script to test call functionality
// Open browser console and paste this to test

console.log('🔍 CALL SYSTEM DEBUG TEST');
console.log('========================\n');

// 1. Check if socket is initialized
const socket = window.socket || null;
console.log('1. Socket Status:');
console.log('   - Socket exists:', !!socket);
console.log('   - Socket connected:', socket?.connected);
console.log('   - Socket ID:', socket?.id || 'N/A');

// 2. Check if user is logged in
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('\n2. User Status:');
console.log('   - User logged in:', !!user._id);
console.log('   - User ID:', user._id || 'N/A');
console.log('   - Username:', user.username || user.fullName || 'N/A');

// 3. Check if token exists
const token = localStorage.getItem('token');
console.log('\n3. Authentication:');
console.log('   - Token exists:', !!token);
console.log('   - Token length:', token?.length || 0);

// 4. Check if getUserMedia is available
console.log('\n4. Media Devices:');
console.log('   - getUserMedia supported:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));

// 5. Test API endpoint
console.log('\n5. Testing API endpoint...');
fetch('http://localhost:5050/api/health')
  .then(r => r.json())
  .then(d => console.log('   - API Health:', d))
  .catch(e => console.error('   - API Error:', e.message));

// 6. Try to access camera/mic (will trigger permission popup)
console.log('\n6. Testing Camera/Microphone Access...');
navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  .then(stream => {
    console.log('   ✅ Audio access granted!');
    console.log('   - Audio tracks:', stream.getAudioTracks().length);
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => {
    console.error('   ❌ Media access error:', err.name, '-', err.message);
    if (err.name === 'NotAllowedError') {
      console.log('   💡 Solution: Click the camera icon in address bar and allow permissions');
    }
  });

console.log('\n========================');
console.log('If all checks pass, call should work!');
console.log('If any fail, that\'s the issue to fix.');

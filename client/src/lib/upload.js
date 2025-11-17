import { API_BASE } from './api';

export async function getCloudinarySignature(folder = 'aisocial') {
  try {
    console.log('📝 Fetching Cloudinary signature for folder:', folder);
    console.log('🔗 API Base URL:', API_BASE);
    
    const res = await fetch(`${API_BASE}/api/upload/signature`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ folder }),
      credentials: 'include',
    });
    
    console.log('📨 Response status:', res.status);
    const data = await res.json();
    console.log('📊 Response data:', data);
    
    if (!res.ok) {
      console.error('❌ Signature error response:', data);
      throw new Error(data?.message || `Failed to get upload signature (${res.status})`);
    }
    
    console.log('✅ Signature obtained successfully');
    console.log('🔐 Credentials:', { 
      cloudName: data.cloudName, 
      hasSignature: !!data.signature,
      timestamp: data.timestamp,
      folder: data.folder 
    });
    
    return data; // { timestamp, folder, signature, cloudName, apiKey }
  } catch (err) {
    console.error('❌ Error getting Cloudinary signature:', err);
    throw err;
  }
}

export async function uploadImageToCloudinary(file, folder = 'aisocial') {
  try {
    console.log('🚀 Starting Cloudinary upload for:', file.name);
    console.log('📋 File details:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error(`Invalid file type: ${file.type}. Expected image file.`);
    }
    
    if (file.size === 0) {
      throw new Error('File is empty');
    }
    
    // Get signature from server
    console.log('🔑 Requesting upload signature...');
    const signatureData = await getCloudinarySignature(folder);
    const { timestamp, folder: fld, signature, cloudName, apiKey } = signatureData;
    
    if (!cloudName || !apiKey || !signature) {
      throw new Error('Invalid upload credentials - missing cloudName, apiKey, or signature');
    }
    
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    console.log('🎯 Upload endpoint:', uploadUrl);
    
    // Build FormData
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', apiKey);
    form.append('timestamp', timestamp);
    form.append('signature', signature);
    form.append('folder', fld);
    
    console.log('📦 FormData prepared:');
    console.log('  - file:', file.name);
    console.log('  - api_key:', apiKey.substring(0, 5) + '...');
    console.log('  - timestamp:', timestamp);
    console.log('  - signature:', signature.substring(0, 10) + '...');
    console.log('  - folder:', fld);
    
    // Send to Cloudinary
    console.log('📤 Sending request to Cloudinary...');
    const startTime = Date.now();
    
    const res = await fetch(uploadUrl, { 
      method: 'POST', 
      body: form,
      // Don't include headers - browser will set Content-Type with boundary
    });
    
    const elapsed = Date.now() - startTime;
    console.log(`⏱️ Request completed in ${elapsed}ms`);
    
    const data = await res.json();
    console.log('📥 Cloudinary response status:', res.status);
    console.log('📊 Cloudinary response:', {
      status: res.status,
      hasUrl: !!data.secure_url || !!data.url,
      hasError: !!data.error,
      errorMessage: data.error?.message || data.message
    });
    
    if (!res.ok) {
      console.error('❌ Cloudinary error response:', data);
      const errorMsg = data?.error?.message || data?.message || 'Upload failed';
      throw new Error(`Cloudinary error (${res.status}): ${errorMsg}`);
    }
    
    const uploadedUrl = data.secure_url || data.url;
    console.log('✅ Upload successful!');
    console.log('🖼️ Image URL:', uploadedUrl);
    console.log('📐 Image dimensions:', `${data.width}x${data.height}`);
    console.log('🏷️ Format:', data.format);
    console.log('🆔 Public ID:', data.public_id);
    
    return {
      url: uploadedUrl,
      width: data.width,
      height: data.height,
      format: data.format,
      publicId: data.public_id,
    };
  } catch (err) {
    console.error('❌ Error uploading to Cloudinary:', err);
    console.error('📋 Error details:', {
      message: err.message,
      name: err.name,
      stack: err.stack
    });
    throw err;
  }
}

export function dataUrlToFile(dataUrl, filename = 'image.png') {
  const arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

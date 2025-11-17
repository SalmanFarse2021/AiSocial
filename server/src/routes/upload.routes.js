import { Router } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import { cloudinary } from '../modules/cloudinary.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Direct file upload endpoint
router.post('/', authRequired, upload.single('file'), async (req, res) => {
  try {
    console.log('📤 Direct upload request received');
    
    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📁 File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      type: req.body.type
    });

    const { type } = req.body;
    const folder = type === 'profile' ? 'aisocial/profiles' : 
                   type === 'cover' ? 'aisocial/covers' : 
                   type === 'post' ? 'aisocial/posts' : 
                   'aisocial/uploads';

    console.log(`🗂️ Uploading to folder: ${folder}`);

    // Upload to Cloudinary using upload_stream
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
          transformation: type === 'profile' ? [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' }
          ] : type === 'cover' ? [
            { width: 1500, height: 500, crop: 'fill' }
          ] : undefined
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload success:', result.secure_url);
            resolve(result);
          }
        }
      );

      // Write the buffer to the stream
      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    res.json({ 
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    });
  } catch (error) {
    console.error('❌ Upload endpoint error:', error);
    res.status(500).json({ 
      error: error.message || 'Upload failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Returns a signature for client-side uploads to Cloudinary
router.post('/signature', (req, res) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = req.body?.folder || 'aisocial';
    const { CLOUDINARY_API_SECRET, CLOUDINARY_API_KEY, CLOUDINARY_CLOUD_NAME } = process.env;

    console.log('📝 Signature request received:');
    console.log('  - folder:', folder);
    console.log('  - timestamp:', timestamp);

    // Validate env vars with detailed logging
    if (!CLOUDINARY_API_SECRET) {
      console.error('❌ Missing: CLOUDINARY_API_SECRET');
      return res.status(500).json({ 
        message: 'CLOUDINARY_API_SECRET not configured',
        error: 'Server configuration error'
      });
    }
    if (!CLOUDINARY_API_KEY) {
      console.error('❌ Missing: CLOUDINARY_API_KEY');
      return res.status(500).json({ 
        message: 'CLOUDINARY_API_KEY not configured',
        error: 'Server configuration error'
      });
    }
    if (!CLOUDINARY_CLOUD_NAME) {
      console.error('❌ Missing: CLOUDINARY_CLOUD_NAME');
      return res.status(500).json({ 
        message: 'CLOUDINARY_CLOUD_NAME not configured',
        error: 'Server configuration error'
      });
    }

    console.log('✅ All Cloudinary env variables present');

    // Create params to sign
    const paramsToSign = { timestamp, folder };
    console.log('🔐 Params to sign:', paramsToSign);
    
    // Generate signature using cloudinary SDK
    const signature = cloudinary.utils.api_sign_request(paramsToSign, CLOUDINARY_API_SECRET);
    
    if (!signature) {
      console.error('❌ Failed to generate Cloudinary signature');
      return res.status(500).json({ 
        message: 'Failed to generate signature',
        error: 'Signature generation failed'
      });
    }

    console.log('✅ Signature generated successfully');
    console.log('📊 Generated signature:', signature.substring(0, 20) + '...');

    const response = {
      timestamp,
      folder,
      signature,
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
    };

    console.log('📤 Sending response:', {
      ...response,
      apiKey: response.apiKey.substring(0, 5) + '...',
      signature: response.signature.substring(0, 10) + '...'
    });

    res.json(response);
  } catch (err) {
    console.error('❌ Signature endpoint error:', err);
    res.status(500).json({ 
      message: 'Error generating signature', 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

export default router;


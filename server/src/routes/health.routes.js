import { Router } from 'express';
import mongoose from 'mongoose';
import { cloudinary } from '../modules/cloudinary.js';

const router = Router();

router.get('/', async (_req, res) => {
  const mongo = mongoose.connection.readyState === 1 ? 'up' : 'down';
  let cloud = 'not_configured';
  try {
    // This will throw if not configured
    // We do a harmless call to ensure config exists
    // There is no ping; relying on configuration presence
    const cfg = cloudinary.config();
    if (cfg?.cloud_name) cloud = 'configured';
  } catch (_) {
    cloud = 'error';
  }
  res.json({ status: 'ok', services: { mongo, cloudinary: cloud } });
});

export default router;


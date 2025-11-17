import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { createAlbum, listUserAlbums, listAlbumPhotos } from '../controllers/album.controller.js';

const router = Router();

router.post('/', authRequired, createAlbum);
router.get('/user/:username', authRequired, listUserAlbums);
router.get('/:id/photos', authRequired, listAlbumPhotos);

export default router;


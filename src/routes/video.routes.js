import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { optionalAuth } from '../middlewares/optionalAuth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { uploadVideo, getVideoById, listVideos, updateVideo, deleteVideo } from '../controllers/video.controller.js';

const router = Router();

router.post('/upload', protect, upload.single('videoFile'), uploadVideo);
router.get('/', listVideos);
router.get('/:id', optionalAuth, getVideoById);
router.patch('/:id', protect, updateVideo);
router.delete('/:id', protect, deleteVideo);

export default router;

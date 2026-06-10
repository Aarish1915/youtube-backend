import { Router } from 'express';
import { protect } from '../middlewares/Auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { uploadVideo, getVideoById, listVideos } from '../controllers/video.controller.js';

const router = Router();

router.post('/upload', protect, upload.single('videoFile'), uploadVideo);
router.get('/', listVideos);
router.get('/:id', getVideoById);

export default router;

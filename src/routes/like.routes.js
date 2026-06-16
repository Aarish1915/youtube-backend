import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { toggleVideoLike, toggleCommentLike, getLikedVideos } from '../controllers/like.controller.js';

const router = Router();

router.use(protect); // All routes require auth

router.post('/toggle/v/:videoId', toggleVideoLike);
router.post('/toggle/c/:commentId', toggleCommentLike);
router.get('/videos', getLikedVideos);

export default router;

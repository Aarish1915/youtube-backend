import { Router } from 'express';
import { protect } from '../middlewares/Auth.middleware.js';
import { createComment, listComments } from '../controllers/comment.controller.js';

const router = Router();

router.post('/', protect, createComment);
router.get('/video/:videoId', listComments);

export default router;

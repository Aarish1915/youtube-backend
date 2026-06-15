import { Router } from 'express';
import { protect } from '../middlewares/Auth.middleware.js';
import { createComment, listComments, updateComment, deleteComment } from '../controllers/comment.controller.js';

const router = Router();

router.post('/', protect, createComment);
router.get('/video/:videoId', listComments);
router.patch('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);

export default router;

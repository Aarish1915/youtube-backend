

import { Router } from 'express';
import { protect } from '../middlewares/Auth.middleware.js';
import { registerUser, getCurrentUser, addWatchHistory } from '../controllers/user.controller.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

router.post(
  '/register',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 5 },
  ]),
  registerUser
);
router.get('/me', protect, getCurrentUser);
router.post('/watch-history', protect, addWatchHistory);

export default router;


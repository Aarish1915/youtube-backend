

import { Router } from 'express';
import { protect } from '../middlewares/Auth.middleware.js';
import { registerUser, getCurrentUser, addWatchHistory, updateAccountDetails, updateAvatar } from '../controllers/user.controller.js';
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
router.patch('/update-account', protect, updateAccountDetails);
router.patch('/avatar', protect, upload.single('avatar'), updateAvatar);

export default router;


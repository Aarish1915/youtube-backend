import { Router } from 'express';
import { protect } from '../middlewares/Auth.middleware.js';
import { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels } from '../controllers/subscription.controller.js';

const router = Router();

router.use(protect); // All routes require auth

router.post('/c/:channelId', toggleSubscription);
router.get('/c/:channelId', getUserChannelSubscribers);
router.get('/u/:subscriberId', getSubscribedChannels);

export default router;

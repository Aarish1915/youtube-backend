import { Router } from 'express';
import passport from 'passport';
import { registerUser, loginUser, refreshToken, logoutUser } from '../controllers/auth.controller.js';

// Import passport config to register the Google strategy
import '../config/Passport.js';

const router = Router();

// Local auth
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshToken);
router.post('/logout', logoutUser);

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    // req.user is set by Passport from the strategy's done() callback
    const { user, accessToken, refreshToken } = req.user;
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
        },
        accessToken,
        refreshToken,
      },
      message: 'Google login successful',
    });
  }
);

export default router;

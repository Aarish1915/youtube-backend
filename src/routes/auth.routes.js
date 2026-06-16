import { Router } from 'express';
import passport from 'passport';
import { loginUser, refreshToken, logoutUser } from '../controllers/auth.controller.js';
import { registerUser } from '../controllers/user.controller.js';

// Import passport config to register the Google strategy
import '../config/Passport.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
};

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
  passport.authenticate('google', { failureRedirect: '/oauth-test.html?error=Google+authentication+failed', session: false }),
  (req, res) => {
    // req.user is set by Passport from the strategy's done() callback
    const { user, accessToken, refreshToken } = req.user;

    // If client wants JSON (Postman / API call), return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(200).json({
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

    // Browser flow — redirect to test page with tokens
    res.cookie('accessToken', accessToken, cookieOptions)
       .cookie('refreshToken', refreshToken, cookieOptions)
       .redirect('/oauth-callback.html');
  }
);

export default router;

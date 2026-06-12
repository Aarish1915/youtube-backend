import crypto from 'crypto';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            // Also check if email already exists (local account)
            const email = profile.emails[0].value;
            user = await User.findOne({ email: email.toLowerCase() });

            if (user) {
                // Link Google to existing local account
                user.googleId = profile.id;
                user.avatar = user.avatar || profile.photos[0]?.value || '';
                await user.save({ validateBeforeSave: false });
            } else {
                // Create brand new user
                user = await User.create({
                    googleId: profile.id,
                    fullName: profile.displayName,
                    email: email.toLowerCase(),
                    username: email.split('@')[0] + '_' + Date.now(),
                    password: 'oauth_' + crypto.randomUUID(), // placeholder — never used for login
                    avatar: profile.photos[0]?.value || '',
                });
            }
        }

        // Generate tokens using your existing model methods
        const accessJwt = user.generateAccessToken();
        const refreshJwt = user.generateRefToken();
        user.refreshToken = refreshJwt;
        await user.save({ validateBeforeSave: false });

        return done(null, { user, accessToken: accessJwt, refreshToken: refreshJwt });
    } catch (err) {
        return done(err, null);
    }
}));

export default passport;

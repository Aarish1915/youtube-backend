import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import passport from 'passport';

import { CORS_ORIGIN } from './config/index.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';
import commentRouter from './routes/comment.routes.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';
import healthRouter from './routes/health.routes.js';

const app = express();

// Sanitize objects in-place (removes keys starting with $ or containing .)
function sanitize(obj) {
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitize(obj[key]);
      }
    }
  }
}

// Security middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ limit: '16kb', extended: true }));
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.static('Public'));
app.use(cookieParser());

// Mongo sanitize (Express 5 compatible — mutates in-place, doesn't reassign req.query)
app.use((req, res, next) => {
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  // req.query is read-only in Express 5, but its properties are mutable
  if (req.query) sanitize(req.query);
  next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

// Passport init (only once!)
app.use(passport.initialize());

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/videos', videoRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/health', healthRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

export { app };

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { CORS_ORIGIN } from './config/index.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';
import commentRouter from './routes/comment.routes.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';
import healthRouter from './routes/health.routes.js';

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ limit: '16kb', extended: true }));
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.static('Public'));
app.use(cookieParser());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/videos', videoRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/health', healthRouter);
app.use(notFound);
app.use(errorHandler);

export { app };

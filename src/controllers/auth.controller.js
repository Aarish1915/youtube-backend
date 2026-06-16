import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import { api_error } from '../utils/ApiError.js';
import { api_response } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
};

export const loginUser = asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw new api_error(400, error.details[0].message);
  }

  if (!value.email || !value.password) {
    throw new api_error(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: value.email.toLowerCase() });
  if (!user) {
    throw new api_error(401, 'Invalid email or password');
  }

  const passwordMatches = await user.isPasswordCorrect(value.password);
  if (!passwordMatches) {
    throw new api_error(401, 'Invalid email or password');
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefToken();
  user.refreshToken = refreshToken;
  await user.save();

  res.status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(
      new api_response(200, {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
        }
      }, 'Login successful')
    );
});

export const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new api_error(401, 'Refresh token is required');
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new api_error(401, 'Invalid refresh token');
  }

  const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new api_error(401, 'Refresh token invalid or expired');
  }

  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefToken();
  user.refreshToken = newRefreshToken;
  await user.save();

  res.status(200)
    .cookie('accessToken', newAccessToken, cookieOptions)
    .cookie('refreshToken', newRefreshToken, cookieOptions)
    .json(
      new api_response(200, {}, 'Token refreshed successfully')
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (incomingRefreshToken) {
    const user = await User.findOne({ refreshToken: incomingRefreshToken });
    if (user) {
      user.refreshToken = '';
      await user.save();
    }
  }

  res.status(200)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new api_response(200, null, 'Logged out successfully'));
});

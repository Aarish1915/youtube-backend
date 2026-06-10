import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { api_error } from '../utils/ApiError.js';
import { api_response } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

export const registerUser = asyncHandler(async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    throw new api_error(400, error.details[0].message);
  }

  if (!value.email || !value.username || !value.password || !value.fullName) {
    throw new api_error(400, 'Email, username, fullName and password are required');
  }

  const normalizedEmail = value.email.toLowerCase();
  const normalizedUsername = value.username.toLowerCase();

  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
  });

  if (existingUser) {
    throw new api_error(409, 'User with this email or username already exists');
  }

  let user;
  try {
    user = await User.create({
      fullName: value.fullName,
      email: normalizedEmail,
      username: normalizedUsername,
      password: value.password,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new api_error(409, 'Email or username already exists');
    }
    throw err;
  }

  const userResponse = await User.findById(user._id).select('-password -refreshToken');
  res.status(201).json(new api_response(201, userResponse, 'User created successfully'));
});

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

  res.status(200).json(
    new api_response(200, {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
      },
      accessToken,
      refreshToken,
    }, 'Login successful')
  );
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new api_error(400, 'Refresh token is required');
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new api_error(401, 'Invalid refresh token');
  }

  const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== refreshToken) {
    throw new api_error(401, 'Refresh token invalid or expired');
  }

  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefToken();
  user.refreshToken = newRefreshToken;
  await user.save();

  res.status(200).json(
    new api_response(200, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }, 'Token refreshed successfully')
  );
});

export const logoutUser = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = '';
      await user.save();
    }
  }

  res.status(200).json(new api_response(200, null, 'Logged out successfully'));
});

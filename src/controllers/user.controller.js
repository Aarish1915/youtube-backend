/**
 * User controller — handles user registration (with avatar upload),
 * profile retrieval, and watch history management.
 */
import { asyncHandler } from '../utils/AsyncHandler.js';
import { api_error } from '../utils/ApiError.js';
import { api_response } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { Video } from '../models/video.model.js';
import { uploadToCloudinary } from '../services/cloudinary.service.js';

export const registerUser = asyncHandler(async (req, res) => {
  const { Fullname, fullName, email, password, username } = req.body;
  const resolvedFullName = (fullName || Fullname)?.trim();
  const resolvedUsername = username?.trim?.();
  const trimmedEmail = email?.trim();
  const trimmedPassword = password?.toString().trim();

  if ([resolvedFullName, trimmedEmail, trimmedPassword, resolvedUsername].some((field) => !field)) {
    throw new api_error(400, 'All fields are required');
  }

  const normalizedEmail = trimmedEmail.toLowerCase();
  const normalizedUsername = resolvedUsername.toLowerCase();

  const existingUser = await User.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
  });

  if (existingUser) {
    throw new api_error(409, 'User with email or username already exists');
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path || req.files?.images?.[0]?.path;

  const avatarUrl = avatarLocalPath ? (await uploadToCloudinary(avatarLocalPath)) : null;
  const coverImageUrl = coverImageLocalPath ? (await uploadToCloudinary(coverImageLocalPath)) : null;

  const createdUser = await User.create({
    fullName: resolvedFullName,
    avatar: avatarUrl ? avatarUrl.secure_url || avatarUrl.url : '',
    coverImage: coverImageUrl ? coverImageUrl.secure_url || coverImageUrl.url : '',
    email: normalizedEmail,
    password: trimmedPassword,
    username: normalizedUsername,
  });

  const userResponse = await User.findById(createdUser._id).select('-password -refreshToken');

  if (!userResponse) {
    throw new api_error(500, 'Something went wrong while registering');
  }

  return res.status(201).json(new api_response(201, userResponse, 'User registered successfully'));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password -refreshToken')
    .populate({ path: 'WatchHistory', select: 'title description videoUrl thumbnail duration' });

  if (!user) {
    throw new api_error(404, 'User not found');
  }

  res.status(200).json(
    new api_response(200, { user, watchHistory: user.WatchHistory || [] }, 'User profile retrieved')
  );
});

export const addWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.body;
  if (!videoId) {
    throw new api_error(400, 'videoId is required');
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new api_error(404, 'Video not found');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new api_error(404, 'User not found');
  }

  user.WatchHistory = user.WatchHistory.filter((id) => id.toString() !== videoId);
  user.WatchHistory.unshift(videoId);
  if (user.WatchHistory.length > 50) {
    user.WatchHistory = user.WatchHistory.slice(0, 50);
  }

  await user.save();

  res.status(200).json(new api_response(200, { watchHistory: user.WatchHistory }, 'Watch history updated'));
});

export const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName && !email) throw new api_error(400, 'fullName or email is required to update');

  const user = await User.findById(req.user._id);
  if (fullName) user.fullName = fullName;
  if (email) user.email = email.toLowerCase();

  await user.save();
  res.status(200).json(new api_response(200, { user }, 'Account details updated'));
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) throw new api_error(400, 'Avatar file is missing');

  const avatarUrl = await uploadToCloudinary(avatarLocalPath);
  if (!avatarUrl) throw new api_error(500, 'Error uploading avatar');

  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: { avatar: avatarUrl.secure_url }
  }, { new: true }).select('-password -refreshToken');

  res.status(200).json(new api_response(200, { user }, 'Avatar updated successfully'));
});
















import { asyncHandler } from '../utils/asyncHandler.js';
import { api_error } from '../utils/ApiError.js';
import { api_response } from '../utils/ApiResponse.js';
import { Like } from '../models/like.model.js';

export const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res.status(200).json(new api_response(200, { liked: false }, 'Video unliked'));
  } else {
    await Like.create({ video: videoId, likedBy: userId });
    return res.status(200).json(new api_response(200, { liked: true }, 'Video liked'));
  }
});

export const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  const existingLike = await Like.findOne({ comment: commentId, likedBy: userId });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res.status(200).json(new api_response(200, { liked: false }, 'Comment unliked'));
  } else {
    await Like.create({ comment: commentId, likedBy: userId });
    return res.status(200).json(new api_response(200, { liked: true }, 'Comment liked'));
  }
});

export const getLikedVideos = asyncHandler(async (req, res) => {
  const likes = await Like.find({ likedBy: req.user._id, video: { $exists: true } })
    .populate({
      path: 'video',
      populate: { path: 'owner', select: 'username fullName avatar' }
    });

  const videos = likes.map(like => like.video).filter(Boolean);
  res.status(200).json(new api_response(200, videos, 'Liked videos retrieved'));
});

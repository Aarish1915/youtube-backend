import { asyncHandler } from '../utils/AsyncHandler.js';
import { api_error } from '../utils/ApiError.js';
import { api_response } from '../utils/ApiResponse.js';
import { Comment } from '../models/comment.model.js';
import { Video } from '../models/video.model.js';

export const createComment = asyncHandler(async (req, res) => {
  const { videoId, text } = req.body;
  if (!videoId || !text) {
    throw new api_error(400, 'videoId and text are required');
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new api_error(404, 'Video not found');
  }

  const comment = await Comment.create({
    video: videoId,
    user: req.user._id,
    text,
  });

  res.status(201).json(new api_response(201, comment, 'Comment added successfully'));
});

export const listComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ video: req.params.videoId })
    .sort({ createdAt: -1 })
    .populate('user', 'username fullName avatar');

  res.status(200).json(new api_response(200, comments, 'Comments retrieved')); 
});

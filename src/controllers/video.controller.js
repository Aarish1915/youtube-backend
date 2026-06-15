import { asyncHandler } from '../utils/AsyncHandler.js';
import { api_error } from '../utils/ApiError.js';
import { api_response } from '../utils/ApiResponse.js';
import { uploadToCloudinary } from '../services/cloudinary.service.js';
import { Video } from '../models/video.model.js';
import { videoUploadSchema } from '../validators/video.validator.js';

export const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new api_error(400, 'Video file is required');
  }

  const { error, value } = videoUploadSchema.validate(req.body);
  if (error) {
    throw new api_error(400, error.details[0].message);
  }

  const uploaded = await uploadToCloudinary(req.file.path, 'youtube_clone/videos');
  if (!uploaded) {
    throw new api_error(500, 'Video upload failed');
  }

  const video = await Video.create({
    title: value.title,
    description: value.description,
    duration: value.duration,
    videoUrl: uploaded.secure_url,
    videoPublicId: uploaded.public_id,
    thumbnail: value.thumbnail || uploaded.secure_url,
    owner: req.user._id,
    isPublic: value.isPublic,
  });

  res.status(201).json(new api_response(201, video, 'Video uploaded successfully'));
});

export const listVideos = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const videos = await Video.find({ isPublic: true })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('owner', 'username fullName avatar');

  res.status(200).json(new api_response(200, videos, 'Public videos retrieved'));
});

export const getVideoById = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id).populate('owner', 'username fullName avatar');
  if (!video) {
    throw new api_error(404, 'Video not found');
  }
  res.status(200).json(new api_response(200, video, 'Video retrieved successfully'));
});

export const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const video = await Video.findOne({ _id: req.params.id, owner: req.user._id });
  
  if (!video) throw new api_error(404, 'Video not found or unauthorized');

  if (title) video.title = title;
  if (description) video.description = description;
  
  await video.save();
  res.status(200).json(new api_response(200, video, 'Video updated successfully'));
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const video = await Video.findOne({ _id: req.params.id, owner: req.user._id });
  
  if (!video) throw new api_error(404, 'Video not found or unauthorized');
  
  // Here we would typically also delete from Cloudinary using video.videoPublicId
  await Video.findByIdAndDelete(video._id);
  
  res.status(200).json(new api_response(200, null, 'Video deleted successfully'));
});

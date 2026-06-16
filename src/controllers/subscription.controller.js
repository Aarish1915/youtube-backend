import { asyncHandler } from '../utils/asyncHandler.js';
import { api_error } from '../utils/ApiError.js';
import { api_response } from '../utils/ApiResponse.js';
import { Subscription } from '../models/subscription.model.js';

export const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user._id;

  if (channelId === subscriberId.toString()) {
    throw new api_error(400, 'You cannot subscribe to yourself');
  }

  const existingSub = await Subscription.findOne({ subscriber: subscriberId, channel: channelId });

  if (existingSub) {
    await Subscription.findByIdAndDelete(existingSub._id);
    return res.status(200).json(new api_response(200, { subscribed: false }, 'Unsubscribed successfully'));
  } else {
    await Subscription.create({ subscriber: subscriberId, channel: channelId });
    return res.status(200).json(new api_response(200, { subscribed: true }, 'Subscribed successfully'));
  }
});

export const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscribers = await Subscription.find({ channel: channelId })
    .populate('subscriber', 'username fullName avatar');
    
  res.status(200).json(new api_response(200, subscribers, 'Subscribers fetched successfully'));
});

export const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const channels = await Subscription.find({ subscriber: subscriberId })
    .populate('channel', 'username fullName avatar');
    
  res.status(200).json(new api_response(200, channels, 'Subscribed channels fetched successfully'));
});

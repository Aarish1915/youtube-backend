import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ACCESS_TOKEN_SECRET } from '../config/index.js';

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = req.cookies?.accessToken || tokenFromHeader;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Invalid user token' });
    }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

export { protect };

import { Request, Response } from 'express';
import User from '../../../models/User.js';
import Artist from '../../../models/Artist.js';
import { generateJWT } from '../../../utils/auth/auth.js';

interface AuthenticatedRequest extends Request {
  userId?: string | number;
  refreshToken?: string;
}

export const generateAccessToken = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const refreshToken = req.refreshToken; // Get the refresh token from the request
    
    if (!userId) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    let user = await User.findById(userId);
    
    if (!user) {
      user = await Artist.findById(userId);
    }

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Generate access token
    const token = generateJWT(
      userId,
      process.env.ACCESS_TOKEN_SECRET,
      Number(process.env.ACCESS_TOKEN_LIFE_SECOND)
    );

    // Return access token along with user data
    res.status(200).json({
      user,
      token,
      refreshToken, // Include the refresh token in response for fallback
      expiresAt: new Date(Date.now() + Number(process.env.ACCESS_TOKEN_LIFE_SECOND) * 1000),
    });
  } catch (error) {
    console.error('Error generating access token:', error);
    res.status(500).json({ error: 'Failed to generate access token' });
  }
};

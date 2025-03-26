import jwt from 'jsonwebtoken';
import createError from 'http-errors';
import { clearTokens, generateJWT } from '../../../utils/auth/auth.js';
import { Request, Response, NextFunction } from 'express';
import User from '../../../models/User.js';
import Artist from '../../../models/Artist.js';
import dotenv from 'dotenv';

dotenv.config();

interface DecodedToken {
  userId: number | string;
}

// Ensure environment variables are properly loaded
if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
  throw new Error('Missing required environment variables');
}

const ACCESS_TOKEN_LIFE_SECONDS = Number(process.env.ACCESS_TOKEN_LIFE_SECOND);
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return next(createError.Unauthorized("No refresh token"));
    }

    const decoded = jwt.verify(
      refreshToken,
      REFRESH_TOKEN_SECRET
    ) as DecodedToken;
    const { userId } = decoded;

    let user = await User.findById(userId);
    if (!user) {
      user = await Artist.findById(userId);
    }

    if (!user) {
      await clearTokens(req, res);
      return next(createError.Unauthorized("User not found"));
    }

    // Additional token validation if needed
    // For example, check if refresh token is in a blacklist or has been revoked

    const accessToken = generateJWT(
      user._id.toString(),
      ACCESS_TOKEN_SECRET,
      ACCESS_TOKEN_LIFE_SECONDS
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: ACCESS_TOKEN_LIFE_SECONDS * 1000,
    });

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.username,
        email: user.email,
        // Include only necessary user info
      },
      accessToken,
      expiresAt: new Date(Date.now() + ACCESS_TOKEN_LIFE_SECONDS * 1000),
    });
  } catch (error) {
    // Specific error handling
    if (error.name === "TokenExpiredError") {
      await clearTokens(req, res);
      return next(createError.Unauthorized("Refresh token expired"));
    }

    if (error.name === "JsonWebTokenError") {
      await clearTokens(req, res);
      return next(createError.Unauthorized("Invalid refresh token"));
    }

    // Unexpected errors
    console.error("Refresh Token Error:", error);
    await clearTokens(req, res);
    return next(createError.Unauthorized("Authentication failed"));
  }
};

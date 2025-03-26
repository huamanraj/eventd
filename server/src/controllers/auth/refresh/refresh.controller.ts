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
    // Check multiple sources for refresh token
    const refreshToken =
      req.cookies?.refreshToken ||
      req.headers["x-refresh-token"] ||
      req.body?.refreshToken;

    console.log("Received Refresh Token:", !!refreshToken); // Debugging log

    if (!refreshToken) {
      res.status(401).json({ message: "No refresh token provided" });
      return;
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
      res.status(401).json({ message: "User not found" });
      return;
    }

    const accessToken = generateJWT(
      user._id.toString(),
      ACCESS_TOKEN_SECRET,
      ACCESS_TOKEN_LIFE_SECONDS
    );

    // Set new refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        // Add other safe user fields
      },
      accessToken,
      expiresAt: new Date(Date.now() + ACCESS_TOKEN_LIFE_SECONDS * 1000),
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);

    if (error.name === "JsonWebTokenError") {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    if (error.name === "TokenExpiredError") {
      res.status(401).json({ message: "Refresh token expired" });
      return;
    }

    res.status(500).json({ message: "Internal server error" });
  }
};

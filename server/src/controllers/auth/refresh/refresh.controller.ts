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
    // Multiple ways to retrieve the refresh token
    const refreshToken =
      req.cookies?.refreshToken || // Cookie-based
      req.headers["x-refresh-token"] || // Header-based
      req.body?.refreshToken || // Body-based
      req.headers.authorization?.split(" ")[1]; // Authorization header

    console.log("Received Token Sources:", {
      cookieToken: !!req.cookies?.refreshToken,
      headerToken: !!req.headers["x-refresh-token"],
      bodyToken: !!req.body?.refreshToken,
      authHeaderToken: !!req.headers.authorization,
    });

    if (!refreshToken) {
      console.error("No refresh token found in:", {
        cookies: req.cookies,
        headers: req.headers,
        body: req.body,
      });

      res.status(401).json({
        message: "No refresh token provided",
        details: {
          cookies: Object.keys(req.cookies || {}),
          headers: Object.keys(req.headers || {}),
          body: Object.keys(req.body || {}),
        },
      });
      return;
    }

    // Rest of the existing token verification logic
    const decoded = jwt.verify(
      refreshToken,
      REFRESH_TOKEN_SECRET
    ) as DecodedToken;
    // ... continue with user lookup and token generation
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

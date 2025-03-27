import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

const dev = process.env.NODE_ENV === 'development';

export const generateJWT = (userId: string | number, secret: string, expirationTime: number): string => {
  return jwt.sign({ userId }, secret, {expiresIn: expirationTime });
};

// Set refresh token as cookie
export const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: Number(process.env.REFRESH_TOKEN_LIFE_SECOND) * 1000,
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined
  });
};

export const clearTokens = async (req: Request, res: Response): Promise<void> => {
  // Clear the refresh token cookie with proper options
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined
  });

  // Clear any other cookies if they exist
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined
  });

  // Clear the session if it exists
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
    });
  }
};

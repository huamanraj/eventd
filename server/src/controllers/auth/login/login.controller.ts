import createError from 'http-errors';
import { Request, Response, NextFunction } from 'express';
import User from '../../../models/User.js';
import Artist from '../../../models/Artist.js';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { username, password, role } = req.body as { username?: string; password?: string; role?: string };
  try {
    if (!username || !password) {
      res.status(422).json({ error: 'Please fill all the required fields' });
      return;
    }
    let user;

    if (role === 'artist') {
      user = await Artist.findOne({ $or: [{ username }, { email: username }] });
    } else {
      user = await User.findOne({ $or: [{ username }, { email: username }] });
    }

    if (!user) {
      throw createError.Unauthorized('Invalid username or password');
    }

    if (user.password !== password) {
      throw createError.Unauthorized('Invalid username or password');
    }

    // Generate refresh token and set it as an HTTP-only cookie
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: Number(process.env.REFRESH_TOKEN_LIFE_SECOND) }
    );

    // Set cookie with appropriate options for cross-domain usage
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: Number(process.env.REFRESH_TOKEN_LIFE_SECOND) * 1000,
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined
    });

    (req as any).userId = user._id;
    (req as any).refreshToken = refreshToken; // Pass the refresh token to the next middleware
    return next();
  } catch (error) {
    return next(error);
  }
};

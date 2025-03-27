import { OAuth2Client } from 'google-auth-library';
import createError from 'http-errors';
import User from '../../../models/User.js';
import jwt from 'jsonwebtoken';
import { setRefreshTokenCookie } from '../../../utils/auth/auth.js';

const client = new OAuth2Client(process.env.GOOGLE_AUTH);

export const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return next(createError(400, "Missing Google credential"));
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
  
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        username: name,
        email,
        password: "nopassword", // Consider using a more secure approach
        role: "User",
        avatar: picture,
      });
    }

    // Generate refresh token and set as cookie
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: Number(process.env.REFRESH_TOKEN_LIFE_SECOND) }
    );

    // Set the refresh token as a cookie
    setRefreshTokenCookie(res, refreshToken);

    (req as any).userId = user._id;
    (req as any).refreshToken = refreshToken; // Pass the refresh token to next middleware

    next();
  } catch (error) {
    next(error);
  }
};



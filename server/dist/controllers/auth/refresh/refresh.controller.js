var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jwt from 'jsonwebtoken';
import createError from 'http-errors';
import { clearTokens, generateJWT, setRefreshTokenCookie } from '../../../utils/auth/auth.js';
import User from '../../../models/User.js';
import Artist from '../../../models/Artist.js';
import dotenv from 'dotenv';
dotenv.config();
// Ensure environment variables are properly loaded
if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('Missing required environment variables');
}
const ACCESS_TOKEN_LIFE_SECONDS = Number(process.env.ACCESS_TOKEN_LIFE_SECOND);
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
export const refreshAccessToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log('Cookies received:', req.cookies);
        // First check normal cookies (depends on cookie-parser middleware)
        let refreshToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken;
        // If not found in cookies, check signed cookies
        if (!refreshToken && req.signedCookies) {
            refreshToken = req.signedCookies.refreshToken;
        }
        // If still not found, check headers for manually included token
        if (!refreshToken) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                try {
                    // Check if this is a refresh token by validating with refresh secret
                    jwt.verify(token, REFRESH_TOKEN_SECRET);
                    refreshToken = token;
                }
                catch (e) {
                    // Not a valid refresh token, ignore
                }
            }
        }
        // If refresh token not found anywhere, return error
        if (!refreshToken) {
            console.log('No refresh token found in request');
            return next(createError.Unauthorized('No refresh token provided'));
        }
        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        const { userId } = decoded;
        let user = yield User.findById(userId);
        if (!user) {
            user = yield Artist.findById(userId);
        }
        // If user does not exist, clear tokens and return error
        if (!user) {
            yield clearTokens(req, res);
            return next(createError.Unauthorized('User not found'));
        }
        // Generate a new access token
        const accessToken = generateJWT(user._id.toString(), ACCESS_TOKEN_SECRET, ACCESS_TOKEN_LIFE_SECONDS);
        // Generate a new refresh token and set cookie
        const newRefreshToken = generateJWT(user._id.toString(), REFRESH_TOKEN_SECRET, Number(process.env.REFRESH_TOKEN_LIFE_SECOND));
        // Set the new refresh token as a cookie
        setRefreshTokenCookie(res, newRefreshToken);
        // Send new access token
        res.status(200).json({
            user,
            accessToken,
            refreshToken: newRefreshToken, // Include refresh token in response for client-side backup
            expiresAt: new Date(Date.now() + ACCESS_TOKEN_LIFE_SECONDS * 1000),
        });
    }
    catch (error) {
        console.error('Error refreshing token:', error);
        // Clear tokens in case of invalid refresh token
        yield clearTokens(req, res);
        return next(createError.Unauthorized('Invalid refresh token'));
    }
});
//# sourceMappingURL=refresh.controller.js.map
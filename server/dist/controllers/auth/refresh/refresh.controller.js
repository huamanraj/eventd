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
import { generateJWT } from '../../../utils/auth/auth.js';
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
    var _a, _b;
    try {
        // Check multiple sources for refresh token
        const refreshToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken) ||
            req.headers["x-refresh-token"] ||
            ((_b = req.body) === null || _b === void 0 ? void 0 : _b.refreshToken);
        console.log("Received Refresh Token:", !!refreshToken); // Debugging log
        if (!refreshToken) {
            res.status(401).json({ message: "No refresh token provided" });
            return;
        }
        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        const { userId } = decoded;
        let user = yield User.findById(userId);
        if (!user) {
            user = yield Artist.findById(userId);
        }
        if (!user) {
            res.status(401).json({ message: "User not found" });
            return;
        }
        const accessToken = generateJWT(user._id.toString(), ACCESS_TOKEN_SECRET, ACCESS_TOKEN_LIFE_SECONDS);
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
    }
    catch (error) {
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
});
//# sourceMappingURL=refresh.controller.js.map
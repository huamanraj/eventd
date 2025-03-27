var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import createError from 'http-errors';
import User from '../../../models/User.js';
import Artist from '../../../models/Artist.js';
import jwt from 'jsonwebtoken';
export const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, role } = req.body;
    try {
        if (!username || !password) {
            res.status(422).json({ error: 'Please fill all the required fields' });
            return;
        }
        let user;
        if (role === 'artist') {
            user = yield Artist.findOne({ $or: [{ username }, { email: username }] });
        }
        else {
            user = yield User.findOne({ $or: [{ username }, { email: username }] });
        }
        if (!user) {
            throw createError.Unauthorized('Invalid username or password');
        }
        if (user.password !== password) {
            throw createError.Unauthorized('Invalid username or password');
        }
        // Generate refresh token and set it as an HTTP-only cookie
        const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: Number(process.env.REFRESH_TOKEN_LIFE_SECOND) });
        // Set cookie with appropriate options for cross-domain usage
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: Number(process.env.REFRESH_TOKEN_LIFE_SECOND) * 1000,
            path: '/',
            domain: process.env.COOKIE_DOMAIN || undefined
        });
        req.userId = user._id;
        req.refreshToken = refreshToken; // Pass the refresh token to the next middleware
        return next();
    }
    catch (error) {
        return next(error);
    }
});
//# sourceMappingURL=login.controller.js.map
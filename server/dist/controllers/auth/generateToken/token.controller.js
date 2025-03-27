var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import User from '../../../models/User.js';
import Artist from '../../../models/Artist.js';
import { generateJWT } from '../../../utils/auth/auth.js';
export const generateAccessToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const refreshToken = req.refreshToken; // Get the refresh token from the request
        if (!userId) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        let user = yield User.findById(userId);
        if (!user) {
            user = yield Artist.findById(userId);
        }
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        // Generate access token
        const token = generateJWT(userId, process.env.ACCESS_TOKEN_SECRET, Number(process.env.ACCESS_TOKEN_LIFE_SECOND));
        // Return access token along with user data
        res.status(200).json({
            user,
            token,
            refreshToken, // Include the refresh token in response for fallback
            expiresAt: new Date(Date.now() + Number(process.env.ACCESS_TOKEN_LIFE_SECOND) * 1000),
        });
    }
    catch (error) {
        console.error('Error generating access token:', error);
        res.status(500).json({ error: 'Failed to generate access token' });
    }
});
//# sourceMappingURL=token.controller.js.map
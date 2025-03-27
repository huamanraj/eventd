import express from 'express';
import { isAuthenticated } from '../../middlewares/isAuthenticated.js';
import { signUp } from '../../controllers/auth/signup/signup.controller.js'; // Changed from signup to signUp
import { login } from '../../controllers/auth/login/login.controller.js';
import { generateAccessToken } from '../../controllers/auth/generateToken/token.controller.js';
import { logout } from '../../controllers/auth/logout/logout.controller.js';
import { refreshAccessToken } from '../../controllers/auth/refresh/refresh.controller.js';
import { googleAuth } from '../../controllers/auth/googleauth/googleAuth.js';
const router = express.Router();
// Signup and login routes - changed from signup to signUp
router.post('/signup', signUp, generateAccessToken);
router.post('/login', login, generateAccessToken);
// Google authentication
router.post('/google', googleAuth, generateAccessToken);
// Logout endpoint
router.post('/logout', logout);
// Refresh token endpoint - doesn't require auth middleware
router.post('/refresh', refreshAccessToken);
// Test route to check if user is authenticated
router.get('/verify', isAuthenticated('user&artist'), (req, res) => {
    // Cast the request to our authenticated request type
    const authenticatedReq = req;
    res.status(200).json({
        message: 'User is authenticated',
        userId: authenticatedReq.userId
    });
});
export default router;
//# sourceMappingURL=auth.route.js.map
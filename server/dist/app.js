import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import connectToDatabase from './config/db.js';
import cors from 'cors';
import authRoutes from './routes/auth/auth.route.js';
import eventRoutes from './routes/event/event.route.js';
import userRoutes from './routes/user/user.route.js';
import artistRoutes from './routes/artist/artist.route.js';
import eventRegistratoinRoute from './routes/event/eventregistration/eventregistration.route.js';
import artistReviews from './routes/artist/review/review.js';
import fileUpload from './routes/fileupload/fileuplad.js';
import contact from './routes/artist/contact/contact.js';
import savedArtist from './routes/user/favartist/favartist.js';
import paymentRoutes from './routes/payment/payment.route.js';
import bookingsRouter from './routes/bookings/bookings.route.js';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
const app = express();
// Setup middleware
app.use(cookieParser(process.env.SECRET_COOKIE));
app.set("trust proxy", 1);
app.use(session({
    secret: process.env.SECRET_COOKIE,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: "sessions",
    }),
    cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        domain: process.env.COOKIE_DOMAIN || undefined
    },
}));
// Configure CORS with proper options for cross-domain cookies
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(cors({
    origin: [frontendUrl, "https://eventduniya.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Cookie",
        "x-refresh-token",
    ],
    exposedHeaders: ["set-cookie"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Connect to MongoDB
connectToDatabase();
// Add route debugging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
});
// Add a test route to verify API is working
app.get('/api/test', (req, res) => {
    res.status(200).json({ message: 'API is working!' });
});
// Register routes - moving payments to the top
app.use('/api/payment', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/user', userRoutes);
app.use('/api/artist', artistRoutes);
app.use('/api/bookticket', eventRegistratoinRoute);
app.use('/api/review', artistReviews);
app.use('/api/image', fileUpload);
app.use('/api/contact', contact);
app.use('/api/savedartist', savedArtist);
app.use('/api/bookings', bookingsRouter);
const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => {
    res.status(200).json({ data: "EventDuniya API is running" });
});
// Health check endpoint that also shows cookie info for debugging
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        cookies: req.cookies,
        signedCookies: req.signedCookies,
        env: {
            nodeEnv: process.env.NODE_ENV,
            frontendUrl,
            cookieDomain: process.env.COOKIE_DOMAIN || 'not set'
        }
    });
});
// Test endpoint to set cookies
app.get('/api/test-cookie', (req, res) => {
    res.cookie('testCookie', 'cookieValue', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 60 * 60 * 1000,
        domain: process.env.COOKIE_DOMAIN || undefined
    });
    res.json({ message: 'Test cookie set' });
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
export default app;
//# sourceMappingURL=app.js.map
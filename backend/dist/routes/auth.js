"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
const signAccessToken = (userId) => jsonwebtoken_1.default.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRY ?? '15m'),
});
const signRefreshToken = (userId) => jsonwebtoken_1.default.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRY ?? '7d'),
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password)
        throw new errorHandler_1.AppError('Credentials required', 400);
    const user = await User_1.default.findOne({
        $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
        active: true,
    });
    if (!user)
        throw new errorHandler_1.AppError('Invalid credentials', 401);
    // First-time login: password is their phone number (plain, not hashed yet via pre-save if different)
    let valid = false;
    if (user.isFirstLogin) {
        valid = password === user.phone || (await user.comparePassword(password));
    }
    else {
        valid = await user.comparePassword(password);
    }
    if (!valid)
        throw new errorHandler_1.AppError('Invalid credentials', 401);
    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString());
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
        accessToken,
        isFirstLogin: user.isFirstLogin,
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
            username: user.username,
            avatar: user.avatar,
        },
    });
});
// POST /api/auth/setup  (first login: set custom username + password)
router.post('/setup', auth_1.authenticate, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        throw new errorHandler_1.AppError('Username and password required', 400);
    if (password.length < 8)
        throw new errorHandler_1.AppError('Password must be at least 8 characters', 400);
    const exists = await User_1.default.findOne({ username, _id: { $ne: req.user._id } });
    if (exists)
        throw new errorHandler_1.AppError('Username already taken', 409);
    const hash = await bcryptjs_1.default.hash(password, 12);
    await User_1.default.findByIdAndUpdate(req.user._id, {
        username,
        passwordHash: hash,
        isFirstLogin: false,
    });
    res.json({ message: 'Account setup complete' });
});
// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token)
        throw new errorHandler_1.AppError('No refresh token', 401);
    const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User_1.default.findById(payload.userId);
    if (!user || user.refreshToken !== token)
        throw new errorHandler_1.AppError('Invalid refresh token', 401);
    const accessToken = signAccessToken(user._id.toString());
    res.json({ accessToken });
});
// POST /api/auth/logout
router.post('/logout', auth_1.authenticate, async (req, res) => {
    await User_1.default.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
});
exports.default = router;
//# sourceMappingURL=auth.js.map
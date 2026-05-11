import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const signAccessToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRY ?? '15m') as unknown as number,
  });

const signRefreshToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRY ?? '7d') as unknown as number,
  });

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) throw new AppError('Credentials required', 400);

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
    active: true,
  });

  if (!user) throw new AppError('Invalid credentials', 401);

  // First-time login: password is their phone number (plain, not hashed yet via pre-save if different)
  let valid = false;
  if (user.isFirstLogin) {
    valid = password === user.phone || (await user.comparePassword(password));
  } else {
    valid = await user.comparePassword(password);
  }

  if (!valid) throw new AppError('Invalid credentials', 401);

  const accessToken = signAccessToken(user._id!.toString());
  const refreshToken = signRefreshToken(user._id!.toString());

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
router.post('/setup', authenticate, async (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) throw new AppError('Username and password required', 400);
  if (password.length < 8) throw new AppError('Password must be at least 8 characters', 400);

  const exists = await User.findOne({ username, _id: { $ne: req.user!._id } });
  if (exists) throw new AppError('Username already taken', 409);

  const hash = await bcrypt.hash(password, 12);
  await User.findByIdAndUpdate(req.user!._id, {
    username,
    passwordHash: hash,
    isFirstLogin: false,
  });

  res.json({ message: 'Account setup complete' });
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new AppError('No refresh token', 401);

  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
  const user = await User.findById(payload.userId);
  if (!user || user.refreshToken !== token) throw new AppError('Invalid refresh token', 401);

  const accessToken = signAccessToken(user._id!.toString());
  res.json({ accessToken });
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  await User.findByIdAndUpdate(req.user!._id, { refreshToken: null });
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

export default router;

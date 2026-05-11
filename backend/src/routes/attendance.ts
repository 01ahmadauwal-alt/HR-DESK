import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import Attendance from '../models/Attendance';
import AttendanceDevice from '../models/AttendanceDevice';
import Employee from '../models/Employee';

const router = Router();
const adminGuard = [authenticate, authorize('hr_manager', 'super_admin')];

// ── ATTENDANCE RECORDS ────────────────────────────────────────────────────────

router.get('/records', authenticate, async (req: AuthRequest, res: Response) => {
  const { employeeId, startDate, endDate, department, status } = req.query;
  const filter: Record<string, unknown> = {};

  if (req.user!.role === 'employee') {
    const emp = await Employee.findOne({ userId: req.user!._id });
    if (!emp) throw new AppError('Employee not found', 404);
    filter.employeeId = emp._id;
  } else if (employeeId) {
    filter.employeeId = employeeId;
  }

  if (startDate && endDate) {
    filter.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
  }
  if (status) filter.status = status;

  const records = await Attendance.find(filter)
    .populate('employeeId', 'firstName lastName employeeId department')
    .sort({ date: -1 })
    .limit(500);
  res.json(records);
});

// Manual attendance entry (HR/Admin)
router.post('/manual', ...adminGuard, async (req: AuthRequest, res: Response) => {
  const { employeeId, date, checkIn, checkOut, status, notes } = req.body;

  const hoursWorked = checkIn && checkOut
    ? Math.round(((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 3600000) * 100) / 100
    : undefined;

  const record = await Attendance.findOneAndUpdate(
    { employeeId, date: new Date(date) },
    {
      employeeId,
      date: new Date(date),
      checkIn: checkIn ? new Date(checkIn) : undefined,
      checkOut: checkOut ? new Date(checkOut) : undefined,
      hoursWorked,
      status,
      notes,
      source: 'manual',
      modifiedBy: req.user!._id,
    },
    { upsert: true, new: true }
  );
  res.json(record);
});

// ── DEVICES ───────────────────────────────────────────────────────────────────

router.get('/devices', ...adminGuard, async (_req: AuthRequest, res: Response) => {
  const devices = await AttendanceDevice.find().sort({ createdAt: -1 });
  res.json(devices);
});

router.post('/devices', ...adminGuard, async (req: AuthRequest, res: Response) => {
  const device = await AttendanceDevice.create(req.body);
  res.status(201).json(device);
});

router.put('/devices/:id', ...adminGuard, async (req: AuthRequest, res: Response) => {
  const device = await AttendanceDevice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!device) throw new AppError('Device not found', 404);
  res.json(device);
});

router.delete('/devices/:id', ...adminGuard, async (req: AuthRequest, res: Response) => {
  await AttendanceDevice.findByIdAndDelete(req.params.id);
  res.json({ message: 'Device removed' });
});

// Manual sync trigger
router.post('/devices/:id/sync', ...adminGuard, async (req: AuthRequest, res: Response) => {
  const device = await AttendanceDevice.findById(req.params.id);
  if (!device) throw new AppError('Device not found', 404);

  try {
    const response = await axios.get(device.apiEndpoint, {
      headers: { Authorization: `Bearer ${device.apiKey}`, 'X-API-Key': device.apiKey },
      timeout: 10000,
    });

    const records = response.data?.records ?? response.data ?? [];
    let imported = 0;

    for (const record of records) {
      const emp = await Employee.findOne({ thumbprintId: record.userId ?? record.employeeId });
      if (!emp) continue;

      const checkIn = record.checkIn ? new Date(record.checkIn) : undefined;
      const checkOut = record.checkOut ? new Date(record.checkOut) : undefined;
      const date = checkIn ?? new Date(record.date);
      date.setHours(0, 0, 0, 0);

      const lateThreshold = new Date(date);
      lateThreshold.setHours(9, 0, 0, 0);
      const status = checkIn && checkIn > lateThreshold ? 'late' : 'present';

      await Attendance.findOneAndUpdate(
        { employeeId: emp._id, date },
        { employeeId: emp._id, date, checkIn, checkOut, status, source: 'device', deviceId: device._id },
        { upsert: true }
      );
      imported++;
    }

    await AttendanceDevice.findByIdAndUpdate(device._id, { lastSynced: new Date(), status: 'active' });
    res.json({ synced: imported });
  } catch (err) {
    await AttendanceDevice.findByIdAndUpdate(device._id, { status: 'error' });
    throw new AppError('Failed to sync with device', 502);
  }
});

// Webhook endpoint for devices that push data
router.post('/webhook', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) return res.status(401).json({ message: 'API key required' });

  const device = await AttendanceDevice.findOne({ apiKey });
  if (!device) return res.status(401).json({ message: 'Unknown device' });

  const records = Array.isArray(req.body) ? req.body : [req.body];

  for (const record of records) {
    const emp = await Employee.findOne({ thumbprintId: record.userId ?? record.employeeId });
    if (!emp) continue;

    const checkIn = record.checkIn ? new Date(record.checkIn) : undefined;
    const checkOut = record.checkOut ? new Date(record.checkOut) : undefined;
    const date = new Date(record.date ?? checkIn ?? new Date());
    date.setHours(0, 0, 0, 0);

    await Attendance.findOneAndUpdate(
      { employeeId: emp._id, date },
      { employeeId: emp._id, date, checkIn, checkOut, status: 'present', source: 'device', deviceId: device._id },
      { upsert: true }
    );
  }

  await AttendanceDevice.findByIdAndUpdate(device._id, { lastSynced: new Date() });
  res.json({ message: 'Records processed' });
});

export default router;

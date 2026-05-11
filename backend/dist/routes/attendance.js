"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const Attendance_1 = __importDefault(require("../models/Attendance"));
const AttendanceDevice_1 = __importDefault(require("../models/AttendanceDevice"));
const Employee_1 = __importDefault(require("../models/Employee"));
const router = (0, express_1.Router)();
const adminGuard = [auth_1.authenticate, (0, auth_1.authorize)('hr_manager', 'super_admin')];
// ── ATTENDANCE RECORDS ────────────────────────────────────────────────────────
router.get('/records', auth_1.authenticate, async (req, res) => {
    const { employeeId, startDate, endDate, department, status } = req.query;
    const filter = {};
    if (req.user.role === 'employee') {
        const emp = await Employee_1.default.findOne({ userId: req.user._id });
        if (!emp)
            throw new errorHandler_1.AppError('Employee not found', 404);
        filter.employeeId = emp._id;
    }
    else if (employeeId) {
        filter.employeeId = employeeId;
    }
    if (startDate && endDate) {
        filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (status)
        filter.status = status;
    const records = await Attendance_1.default.find(filter)
        .populate('employeeId', 'firstName lastName employeeId department')
        .sort({ date: -1 })
        .limit(500);
    res.json(records);
});
// Manual attendance entry (HR/Admin)
router.post('/manual', ...adminGuard, async (req, res) => {
    const { employeeId, date, checkIn, checkOut, status, notes } = req.body;
    const hoursWorked = checkIn && checkOut
        ? Math.round(((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 3600000) * 100) / 100
        : undefined;
    const record = await Attendance_1.default.findOneAndUpdate({ employeeId, date: new Date(date) }, {
        employeeId,
        date: new Date(date),
        checkIn: checkIn ? new Date(checkIn) : undefined,
        checkOut: checkOut ? new Date(checkOut) : undefined,
        hoursWorked,
        status,
        notes,
        source: 'manual',
        modifiedBy: req.user._id,
    }, { upsert: true, new: true });
    res.json(record);
});
// ── DEVICES ───────────────────────────────────────────────────────────────────
router.get('/devices', ...adminGuard, async (_req, res) => {
    const devices = await AttendanceDevice_1.default.find().sort({ createdAt: -1 });
    res.json(devices);
});
router.post('/devices', ...adminGuard, async (req, res) => {
    const device = await AttendanceDevice_1.default.create(req.body);
    res.status(201).json(device);
});
router.put('/devices/:id', ...adminGuard, async (req, res) => {
    const device = await AttendanceDevice_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!device)
        throw new errorHandler_1.AppError('Device not found', 404);
    res.json(device);
});
router.delete('/devices/:id', ...adminGuard, async (req, res) => {
    await AttendanceDevice_1.default.findByIdAndDelete(req.params.id);
    res.json({ message: 'Device removed' });
});
// Manual sync trigger
router.post('/devices/:id/sync', ...adminGuard, async (req, res) => {
    const device = await AttendanceDevice_1.default.findById(req.params.id);
    if (!device)
        throw new errorHandler_1.AppError('Device not found', 404);
    try {
        const response = await axios_1.default.get(device.apiEndpoint, {
            headers: { Authorization: `Bearer ${device.apiKey}`, 'X-API-Key': device.apiKey },
            timeout: 10000,
        });
        const responseBody = response.data;
        const records = Array.isArray(responseBody)
            ? responseBody
            : responseBody.records ?? [];
        let imported = 0;
        for (const rawRecord of records) {
            const record = rawRecord;
            const emp = await Employee_1.default.findOne({ thumbprintId: record.userId ?? record.employeeId });
            if (!emp)
                continue;
            const checkIn = record.checkIn ? new Date(record.checkIn) : undefined;
            const checkOut = record.checkOut ? new Date(record.checkOut) : undefined;
            const date = checkIn ?? new Date(record.date ?? new Date());
            date.setHours(0, 0, 0, 0);
            const lateThreshold = new Date(date);
            lateThreshold.setHours(9, 0, 0, 0);
            const status = checkIn && checkIn > lateThreshold ? 'late' : 'present';
            await Attendance_1.default.findOneAndUpdate({ employeeId: emp._id, date }, { employeeId: emp._id, date, checkIn, checkOut, status, source: 'device', deviceId: device._id }, { upsert: true });
            imported++;
        }
        await AttendanceDevice_1.default.findByIdAndUpdate(device._id, { lastSynced: new Date(), status: 'active' });
        res.json({ synced: imported });
    }
    catch (err) {
        await AttendanceDevice_1.default.findByIdAndUpdate(device._id, { status: 'error' });
        throw new errorHandler_1.AppError('Failed to sync with device', 502);
    }
});
// Webhook endpoint for devices that push data
router.post('/webhook', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey)
        return res.status(401).json({ message: 'API key required' });
    const device = await AttendanceDevice_1.default.findOne({ apiKey });
    if (!device)
        return res.status(401).json({ message: 'Unknown device' });
    const records = Array.isArray(req.body) ? req.body : [req.body];
    for (const record of records) {
        const emp = await Employee_1.default.findOne({ thumbprintId: record.userId ?? record.employeeId });
        if (!emp)
            continue;
        const checkIn = record.checkIn ? new Date(record.checkIn) : undefined;
        const checkOut = record.checkOut ? new Date(record.checkOut) : undefined;
        const date = new Date(record.date ?? checkIn ?? new Date());
        date.setHours(0, 0, 0, 0);
        await Attendance_1.default.findOneAndUpdate({ employeeId: emp._id, date }, { employeeId: emp._id, date, checkIn, checkOut, status: 'present', source: 'device', deviceId: device._id }, { upsert: true });
    }
    await AttendanceDevice_1.default.findByIdAndUpdate(device._id, { lastSynced: new Date() });
    res.json({ message: 'Records processed' });
});
exports.default = router;
//# sourceMappingURL=attendance.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const Employee_1 = __importDefault(require("../models/Employee"));
const Department_1 = __importDefault(require("../models/Department"));
const LeaveRequest_1 = __importDefault(require("../models/LeaveRequest"));
const Attendance_1 = __importDefault(require("../models/Attendance"));
const Task_1 = __importDefault(require("../models/Task"));
const User_1 = __importDefault(require("../models/User"));
const notificationService_1 = require("../services/notificationService");
const router = (0, express_1.Router)();
const guard = [auth_1.authenticate, (0, auth_1.authorize)('manager', 'hr_manager', 'super_admin')];
// ── TEAM ──────────────────────────────────────────────────────────────────────
router.get('/team', ...guard, async (req, res) => {
    const managerEmp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!managerEmp)
        throw new errorHandler_1.AppError('Manager profile not found', 404);
    const dept = await Department_1.default.findOne({
        $or: [{ managerId: managerEmp._id }, { hodId: managerEmp._id }],
    });
    if (!dept)
        return res.json([]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const members = await Employee_1.default.find({ _id: { $in: dept.memberIds }, isActive: true })
        .populate('department', 'name code');
    const teamWithStatus = await Promise.all(members.map(async (emp) => {
        const attendance = await Attendance_1.default.findOne({ employeeId: emp._id, date: today });
        const onLeave = await LeaveRequest_1.default.exists({
            employeeId: emp._id,
            status: 'approved',
            startDate: { $lte: today },
            endDate: { $gte: today },
        });
        let status = 'absent';
        if (onLeave)
            status = 'on_leave';
        else if (attendance?.checkIn)
            status = 'on_duty';
        return { ...emp.toObject(), todayStatus: status, attendance };
    }));
    res.json(teamWithStatus);
});
router.get('/team/:id', ...guard, async (req, res) => {
    const emp = await Employee_1.default.findById(req.params.id)
        .populate('department', 'name code');
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    res.json(emp);
});
// ── LEAVE APPROVALS ───────────────────────────────────────────────────────────
router.get('/leaves/pending', ...guard, async (req, res) => {
    const managerEmp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!managerEmp)
        throw new errorHandler_1.AppError('Manager profile not found', 404);
    const dept = await Department_1.default.findOne({
        $or: [{ managerId: managerEmp._id }, { hodId: managerEmp._id }],
    });
    if (!dept)
        return res.json([]);
    const leaves = await LeaveRequest_1.default.find({
        employeeId: { $in: dept.memberIds },
        status: 'pending_manager',
    })
        .populate('employeeId', 'firstName lastName position employeeId')
        .sort({ createdAt: -1 });
    res.json(leaves);
});
router.put('/leaves/:id/approve', ...guard, async (req, res) => {
    const leave = await LeaveRequest_1.default.findById(req.params.id).populate('employeeId');
    if (!leave)
        throw new errorHandler_1.AppError('Leave request not found', 404);
    if (leave.status !== 'pending_manager')
        throw new errorHandler_1.AppError('Leave not at manager stage', 400);
    leave.status = 'pending_hr';
    leave.managerApprovalBy = req.user._id;
    leave.managerApprovalAt = new Date();
    await leave.save();
    // Notify HR
    const hrUsers = await User_1.default.find({ role: 'hr_manager', active: true });
    for (const hr of hrUsers) {
        const empDoc = leave.employeeId;
        await (0, notificationService_1.sendNotification)({
            userId: hr._id.toString(),
            type: 'leave_manager_approved',
            title: 'Leave Request Needs HR Approval',
            message: `${empDoc.firstName} ${empDoc.lastName}'s ${leave.type} leave request has been approved by the manager and requires your review.`,
            channels: ['in_app', 'email'],
            email: hr.email,
        });
    }
    // Notify employee
    const empDoc = leave.employeeId;
    await (0, notificationService_1.sendNotification)({
        userId: empDoc.userId,
        type: 'leave_manager_approved',
        title: 'Leave Request Forwarded to HR',
        message: 'Your leave request has been approved by your manager and is now awaiting HR approval.',
        channels: ['in_app'],
        email: empDoc.email,
    });
    res.json(leave);
});
router.put('/leaves/:id/reject', ...guard, async (req, res) => {
    const { reason } = req.body;
    const leave = await LeaveRequest_1.default.findById(req.params.id).populate('employeeId');
    if (!leave)
        throw new errorHandler_1.AppError('Leave request not found', 404);
    if (leave.status !== 'pending_manager')
        throw new errorHandler_1.AppError('Leave not at manager stage', 400);
    leave.status = 'rejected';
    leave.rejectedBy = req.user._id;
    leave.rejectionReason = reason;
    await leave.save();
    const empDoc = leave.employeeId;
    await (0, notificationService_1.sendNotification)({
        userId: empDoc.userId,
        type: 'leave_rejected',
        title: 'Leave Request Rejected',
        message: `Your leave request has been rejected by your manager. Reason: ${reason || 'Not specified'}`,
        channels: ['in_app', 'email', 'whatsapp'],
        email: empDoc.email,
        phone: empDoc.phone,
    });
    res.json(leave);
});
// ── TASKS ─────────────────────────────────────────────────────────────────────
router.get('/tasks', ...guard, async (req, res) => {
    const managerEmp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!managerEmp)
        throw new errorHandler_1.AppError('Manager profile not found', 404);
    const tasks = await Task_1.default.find({ assignedBy: managerEmp._id })
        .populate('assignedTo.employeeId', 'firstName lastName avatar')
        .populate('department', 'name')
        .sort({ createdAt: -1 });
    res.json(tasks);
});
router.post('/tasks', ...guard, async (req, res) => {
    const managerEmp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!managerEmp)
        throw new errorHandler_1.AppError('Manager profile not found', 404);
    const { title, description, assignedTo, department, dueDate, priority, isOpenForCollaboration } = req.body;
    const assignees = assignedTo.map((id) => ({
        employeeId: new mongoose_1.default.Types.ObjectId(id),
        status: 'pending',
    }));
    const task = await Task_1.default.create({
        title,
        description,
        assignedTo: assignees,
        assignedBy: managerEmp._id,
        department,
        dueDate: new Date(dueDate),
        priority: priority ?? 'medium',
        isOpenForCollaboration: isOpenForCollaboration ?? false,
        status: 'open',
    });
    // Notify each assignee
    for (const assignee of assignedTo) {
        const emp = await Employee_1.default.findById(assignee).populate('userId');
        if (emp) {
            const empUser = emp.userId;
            await (0, notificationService_1.sendNotification)({
                userId: empUser._id,
                type: 'task_assigned',
                title: 'New Task Assigned',
                message: `You have been assigned a new task: "${title}". Due: ${new Date(dueDate).toDateString()}`,
                channels: ['in_app', 'email', 'whatsapp'],
                email: empUser.email,
                phone: empUser.phone,
            });
        }
    }
    res.status(201).json(task);
});
router.put('/tasks/:id', ...guard, async (req, res) => {
    const task = await Task_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task)
        throw new errorHandler_1.AppError('Task not found', 404);
    res.json(task);
});
// ── ATTENDANCE ────────────────────────────────────────────────────────────────
router.get('/attendance', ...guard, async (req, res) => {
    const managerEmp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!managerEmp)
        throw new errorHandler_1.AppError('Manager profile not found', 404);
    const dept = await Department_1.default.findOne({
        $or: [{ managerId: managerEmp._id }, { hodId: managerEmp._id }],
    });
    if (!dept)
        return res.json([]);
    const { startDate, endDate } = req.query;
    const filter = { employeeId: { $in: dept.memberIds } };
    if (startDate && endDate) {
        filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const records = await Attendance_1.default.find(filter)
        .populate('employeeId', 'firstName lastName employeeId')
        .sort({ date: -1 });
    res.json(records);
});
// ── CALENDAR ──────────────────────────────────────────────────────────────────
router.get('/calendar', ...guard, async (req, res) => {
    const managerEmp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!managerEmp)
        throw new errorHandler_1.AppError('Manager profile not found', 404);
    const dept = await Department_1.default.findOne({
        $or: [{ managerId: managerEmp._id }, { hodId: managerEmp._id }],
    });
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const memberIds = dept?.memberIds ?? [];
    const [leaves, tasks] = await Promise.all([
        LeaveRequest_1.default.find({
            employeeId: { $in: memberIds },
            status: 'approved',
            startDate: { $lte: end },
            endDate: { $gte: start },
        }).populate('employeeId', 'firstName lastName'),
        Task_1.default.find({
            assignedBy: managerEmp._id,
            dueDate: { $gte: start, $lte: end },
        }).populate('assignedTo.employeeId', 'firstName lastName'),
    ]);
    const events = [
        ...leaves.map((l) => {
            const emp = l.employeeId;
            return {
                id: l._id,
                type: 'leave',
                title: `${emp.firstName} ${emp.lastName} – ${l.type} leave`,
                start: l.startDate,
                end: l.endDate,
                color: 'amber',
            };
        }),
        ...tasks.map((t) => ({
            id: t._id,
            type: 'task',
            title: t.title,
            start: t.dueDate,
            end: t.dueDate,
            priority: t.priority,
            color: 'blue',
        })),
    ];
    res.json(events);
});
exports.default = router;
//# sourceMappingURL=manager.js.map
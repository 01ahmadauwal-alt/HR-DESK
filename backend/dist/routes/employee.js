"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const Employee_1 = __importDefault(require("../models/Employee"));
const LeaveRequest_1 = __importDefault(require("../models/LeaveRequest"));
const LeaveBalance_1 = __importDefault(require("../models/LeaveBalance"));
const Payslip_1 = __importDefault(require("../models/Payslip"));
const Attendance_1 = __importDefault(require("../models/Attendance"));
const Task_1 = __importDefault(require("../models/Task"));
const LoanApplication_1 = __importDefault(require("../models/LoanApplication"));
const LoanRepayment_1 = __importDefault(require("../models/LoanRepayment"));
const SalaryAdvance_1 = __importDefault(require("../models/SalaryAdvance"));
const Notification_1 = __importDefault(require("../models/Notification"));
const PayrollConfig_1 = __importDefault(require("../models/PayrollConfig"));
const notificationService_1 = require("../services/notificationService");
const mongoose_1 = __importDefault(require("mongoose"));
const Document_1 = __importDefault(require("../models/Document"));
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const guard = [auth_1.authenticate];
// ── PROFILE ───────────────────────────────────────────────────────────────────
router.get('/profile', ...guard, async (req, res) => {
    const emp = await Employee_1.default.findOne({ userId: req.user._id })
        .populate('department', 'name code');
    if (!emp)
        throw new errorHandler_1.AppError('Employee record not found', 404);
    res.json(emp);
});
router.put('/profile', ...guard, async (req, res) => {
    const allowedFields = ['phone', 'address', 'emergencyContact', 'bankAccount', 'avatar', 'pension'];
    const update = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined)
            update[field] = req.body[field];
    }
    const emp = await Employee_1.default.findOneAndUpdate({ userId: req.user._id }, update, { new: true });
    res.json(emp);
});
// ── LEAVE ─────────────────────────────────────────────────────────────────────
router.get('/leaves', ...guard, async (req, res) => {
    const emp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    const leaves = await LeaveRequest_1.default.find({ employeeId: emp._id }).sort({ createdAt: -1 });
    res.json(leaves);
});
router.get('/leaves/balance', ...guard, async (req, res) => {
    const emp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    const year = new Date().getFullYear();
    let balance = await LeaveBalance_1.default.findOne({ employeeId: emp._id, year });
    if (!balance)
        balance = await LeaveBalance_1.default.create({ employeeId: emp._id, year });
    res.json(balance);
});
router.post('/leaves', ...guard, async (req, res) => {
    const emp = await Employee_1.default.findOne({ userId: req.user._id }).populate('department');
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    const { type, startDate, endDate, reason } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const leave = await LeaveRequest_1.default.create({
        employeeId: emp._id,
        type,
        startDate: start,
        endDate: end,
        days,
        reason,
        status: 'pending_manager',
    });
    // Find manager and notify
    const dept = emp.department;
    if (dept?.managerId) {
        const mgr = await Employee_1.default.findById(dept.managerId).populate('userId');
        if (mgr) {
            const mgrUser = mgr.userId;
            await (0, notificationService_1.sendNotification)({
                userId: mgrUser._id,
                type: 'leave_submitted',
                title: 'New Leave Request',
                message: `${emp.firstName} ${emp.lastName} has submitted a ${type} leave request for ${days} day(s) starting ${start.toDateString()}.`,
                channels: ['in_app', 'email', 'whatsapp'],
                email: mgrUser.email,
                phone: mgrUser.phone,
            });
        }
    }
    res.status(201).json(leave);
});
// ── PAYSLIPS ──────────────────────────────────────────────────────────────────
router.get('/payslips', ...guard, async (req, res) => {
    const emp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    const payslips = await Payslip_1.default.find({ employeeId: emp._id })
        .populate('payrollId', 'month year grossSalary netPay status')
        .sort({ generatedAt: -1 });
    res.json(payslips);
});
router.get('/payslips/:id/download', ...guard, async (req, res) => {
    const emp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    const payslip = await Payslip_1.default.findOne({ _id: req.params.id, employeeId: emp._id });
    if (!payslip)
        throw new errorHandler_1.AppError('Payslip not found', 404);
    await Payslip_1.default.findByIdAndUpdate(payslip._id, { $inc: { downloadCount: 1 } });
    res.download(payslip.pdfPath);
});
// ── ATTENDANCE ────────────────────────────────────────────────────────────────
router.get('/attendance', ...guard, async (req, res) => {
    const emp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    const { month, year } = req.query;
    const filter = { employeeId: emp._id };
    if (month && year) {
        const start = new Date(Number(year), Number(month) - 1, 1);
        const end = new Date(Number(year), Number(month), 0);
        filter.date = { $gte: start, $lte: end };
    }
    const records = await Attendance_1.default.find(filter).sort({ date: -1 });
    res.json(records);
});
// ── TASKS ─────────────────────────────────────────────────────────────────────
router.get('/tasks', ...guard, async (req, res) => {
    const emp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    const tasks = await Task_1.default.find({
        $or: [
            { 'assignedTo.employeeId': emp._id },
            { 'collaborators.employeeId': emp._id },
        ],
    })
        .populate('assignedBy', 'firstName lastName')
        .populate('assignedTo.employeeId', 'firstName lastName avatar')
        .sort({ createdAt: -1 });
    res.json(tasks);
});
router.post('/tasks/:id/comments', ...guard, async (req, res) => {
    const emp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    const { text } = req.body;
    if (!text?.trim())
        throw new errorHandler_1.AppError('Comment text required', 400);
    const task = await Task_1.default.findByIdAndUpdate(req.params.id, { $push: { comments: { authorId: emp._id, text, createdAt: new Date() } } }, { new: true });
    if (!task)
        throw new errorHandler_1.AppError('Task not found', 404);
    res.json(task);
});
router.post('/tasks/:id/complete', ...guard, async (req, res) => {
    const emp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    const task = await Task_1.default.findOneAndUpdate({ _id: req.params.id, 'assignedTo.employeeId': emp._id }, { status: 'done', completedAt: new Date() }, { new: true }).populate('assignedBy');
    if (!task)
        throw new errorHandler_1.AppError('Task not found or not assigned to you', 404);
    const assignedBy = task.assignedBy;
    const assignedByUser = await (await Promise.resolve().then(() => __importStar(require('../models/User')))).default.findById(assignedBy.userId);
    if (assignedByUser) {
        await (0, notificationService_1.sendNotification)({
            userId: assignedByUser._id.toString(),
            type: 'task_completed',
            title: 'Task Completed',
            message: `${emp.firstName} ${emp.lastName} has marked the task "${task.title}" as complete.`,
            channels: ['in_app', 'email'],
            email: assignedByUser.email,
        });
    }
    res.json(task);
});
// Invite colleague to collaborate
router.post('/tasks/:id/invite', ...guard, async (req, res) => {
    const emp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    const task = await Task_1.default.findById(req.params.id);
    if (!task)
        throw new errorHandler_1.AppError('Task not found', 404);
    if (!task.isOpenForCollaboration)
        throw new errorHandler_1.AppError('Task is not open for collaboration', 400);
    const { colleagueId } = req.body;
    const alreadyCollaborating = task.collaborators.some((c) => c.employeeId.toString() === colleagueId);
    if (alreadyCollaborating)
        throw new errorHandler_1.AppError('Already invited', 409);
    task.collaborators.push({ employeeId: new mongoose_1.default.Types.ObjectId(colleagueId), invitedBy: emp._id, status: 'pending' });
    await task.save();
    // Notify colleague
    const colleague = await Employee_1.default.findById(colleagueId).populate('userId');
    if (colleague) {
        const colUser = colleague.userId;
        await (0, notificationService_1.sendNotification)({
            userId: colUser._id,
            type: 'collaboration_invite',
            title: 'Collaboration Invite',
            message: `${emp.firstName} ${emp.lastName} has invited you to collaborate on the task "${task.title}".`,
            channels: ['in_app', 'email', 'whatsapp'],
            email: colUser.email,
            phone: colUser.phone,
        });
    }
    res.json(task);
});
// Accept/Decline collaboration invite
router.put('/tasks/:id/collaborate', ...guard, async (req, res) => {
    const emp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    const { action } = req.body;
    if (!['accepted', 'declined'].includes(action))
        throw new errorHandler_1.AppError('Invalid action', 400);
    const task = await Task_1.default.findOneAndUpdate({ _id: req.params.id, 'collaborators.employeeId': emp._id }, {
        $set: {
            'collaborators.$.status': action,
            'collaborators.$.respondedAt': new Date(),
        },
    }, { new: true });
    if (!task)
        throw new errorHandler_1.AppError('Invite not found', 404);
    res.json(task);
});
// ── LOANS ─────────────────────────────────────────────────────────────────────
router.get('/loans', ...guard, async (req, res) => {
    const emp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    const config = await PayrollConfig_1.default.findOne();
    const loans = await LoanApplication_1.default.find({ employeeId: emp._id }).sort({ createdAt: -1 });
    const repayments = await LoanRepayment_1.default.find({ employeeId: emp._id });
    res.json({ loanEnabled: config?.loanEnabled ?? true, loans, repayments });
});
router.post('/loans', ...guard, async (req, res) => {
    const config = await PayrollConfig_1.default.findOne();
    if (!config?.loanEnabled)
        throw new errorHandler_1.AppError('Loans are not available at this time', 403);
    const emp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    const monthsEmployed = Math.floor((Date.now() - new Date(emp.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (monthsEmployed < (config.eligibilityMonths ?? 6)) {
        throw new errorHandler_1.AppError(`You must be employed for at least ${config.eligibilityMonths} months to apply for a loan`, 403);
    }
    const { amount, purpose, repaymentMonths } = req.body;
    if (amount > config.maxLoanAmount) {
        throw new errorHandler_1.AppError(`Maximum loan amount is ₦${config.maxLoanAmount.toLocaleString()}`, 400);
    }
    const interestRate = config.loanInterestRate ?? 0;
    const totalRepayable = amount * (1 + interestRate / 100);
    const monthlyDeduction = Math.ceil(totalRepayable / repaymentMonths);
    const loan = await LoanApplication_1.default.create({
        employeeId: emp._id,
        amount,
        purpose,
        repaymentMonths,
        monthlyDeduction,
        interestRate,
        totalRepayable,
        status: 'pending',
    });
    res.status(201).json(loan);
});
// ── SALARY ADVANCE ────────────────────────────────────────────────────────────
router.get('/salary-advances', ...guard, async (req, res) => {
    const emp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    const config = await PayrollConfig_1.default.findOne();
    const advances = await SalaryAdvance_1.default.find({ employeeId: emp._id }).sort({ createdAt: -1 });
    res.json({ salaryAdvanceEnabled: config?.salaryAdvanceEnabled ?? true, advances });
});
router.post('/salary-advances', ...guard, async (req, res) => {
    const config = await PayrollConfig_1.default.findOne();
    if (!config?.salaryAdvanceEnabled)
        throw new errorHandler_1.AppError('Salary advance is not available at this time', 403);
    const emp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    // Check per-year limit
    const currentYear = new Date().getFullYear();
    const advancesThisYear = await SalaryAdvance_1.default.countDocuments({
        employeeId: emp._id,
        status: { $in: ['approved', 'pending'] },
        createdAt: { $gte: new Date(currentYear, 0, 1) },
    });
    if (advancesThisYear >= (config.maxAdvancePerYear ?? 2)) {
        throw new errorHandler_1.AppError(`You have reached the maximum number of salary advances for this year`, 403);
    }
    const gross = emp.basicSalary + emp.housingAllowance + emp.transportAllowance;
    const maxAmount = (gross * (config.maxAdvancePercent ?? 50)) / 100;
    const { amount, reason } = req.body;
    if (amount > maxAmount) {
        throw new errorHandler_1.AppError(`Maximum advance is ₦${maxAmount.toLocaleString()} (${config.maxAdvancePercent}% of gross)`, 400);
    }
    const advance = await SalaryAdvance_1.default.create({ employeeId: emp._id, amount, reason, status: 'pending' });
    res.status(201).json(advance);
});
// ── DOCUMENTS ─────────────────────────────────────────────────────────────────
const docStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path_1.default.join(process.env.UPLOAD_DIR ?? 'uploads', 'documents');
        fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const docUpload = (0, multer_1.default)({ storage: docStorage, limits: { fileSize: 10 * 1024 * 1024 } });
router.get('/documents', ...guard, async (req, res) => {
    const emp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    const docs = await Document_1.default.find({ employeeId: emp._id }).sort({ uploadedAt: -1 });
    res.json(docs);
});
router.post('/documents', ...guard, docUpload.single('file'), async (req, res) => {
    if (!req.file)
        throw new errorHandler_1.AppError('No file uploaded', 400);
    const emp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    const doc = await Document_1.default.create({
        employeeId: emp._id,
        type: req.body.type ?? 'other',
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date(),
    });
    res.status(201).json(doc);
});
router.get('/documents/:id/download', ...guard, async (req, res) => {
    const doc = await Document_1.default.findById(req.params.id);
    if (!doc)
        throw new errorHandler_1.AppError('Document not found', 404);
    const emp = await Employee_1.default.findOne({ userId: req.user._id });
    if (!emp || doc.employeeId.toString() !== emp._id.toString())
        throw new errorHandler_1.AppError('Forbidden', 403);
    if (!fs_1.default.existsSync(doc.filePath))
        throw new errorHandler_1.AppError('File not found on server', 404);
    res.download(doc.filePath, doc.fileName);
});
// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
router.get('/notifications', ...guard, async (req, res) => {
    const notifications = await Notification_1.default.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);
    res.json(notifications);
});
router.put('/notifications/read-all', ...guard, async (req, res) => {
    await Notification_1.default.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ message: 'All notifications marked read' });
});
router.put('/notifications/:id/read', ...guard, async (req, res) => {
    await Notification_1.default.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: 'Notification marked read' });
});
exports.default = router;
//# sourceMappingURL=employee.js.map
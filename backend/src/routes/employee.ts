import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import Employee from '../models/Employee';
import LeaveRequest from '../models/LeaveRequest';
import LeaveBalance from '../models/LeaveBalance';
import Payslip from '../models/Payslip';
import Attendance from '../models/Attendance';
import Task from '../models/Task';
import LoanApplication from '../models/LoanApplication';
import LoanRepayment from '../models/LoanRepayment';
import SalaryAdvance from '../models/SalaryAdvance';
import Notification from '../models/Notification';
import PayrollConfig from '../models/PayrollConfig';
import Department from '../models/Department';
import { sendNotification } from '../services/notificationService';
import mongoose from 'mongoose';
import Document from '../models/Document';
import multer from 'multer';

const router = Router();
const guard = [authenticate];

// ── PROFILE ───────────────────────────────────────────────────────────────────

router.get('/profile', ...guard, async (req: AuthRequest, res: Response) => {
  const emp = await Employee.findOne({ userId: req.user!._id })
    .populate('department', 'name code');
  if (!emp) throw new AppError('Employee record not found', 404);
  res.json(emp);
});

router.put('/profile', ...guard, async (req: AuthRequest, res: Response) => {
  const allowedFields = ['phone', 'address', 'emergencyContact', 'bankAccount', 'avatar', 'pension'];
  const update: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) update[field] = req.body[field];
  }
  const emp = await Employee.findOneAndUpdate({ userId: req.user!._id }, update, { new: true });
  res.json(emp);
});

// ── LEAVE ─────────────────────────────────────────────────────────────────────

router.get('/leaves', ...guard, async (req: AuthRequest, res: Response) => {
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) throw new AppError('Employee not found', 404);
  const leaves = await LeaveRequest.find({ employeeId: emp._id }).sort({ createdAt: -1 });
  res.json(leaves);
});

router.get('/leaves/balance', ...guard, async (req: AuthRequest, res: Response) => {
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) throw new AppError('Employee not found', 404);
  const year = new Date().getFullYear();
  let balance = await LeaveBalance.findOne({ employeeId: emp._id, year });
  if (!balance) balance = await LeaveBalance.create({ employeeId: emp._id, year });
  res.json(balance);
});

router.post('/leaves', ...guard, async (req: AuthRequest, res: Response) => {
  const emp = await Employee.findOne({ userId: req.user!._id }).populate('department');
  if (!emp) throw new AppError('Employee not found', 404);

  const { type, startDate, endDate, reason } = req.body;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const leave = await LeaveRequest.create({
    employeeId: emp._id,
    type,
    startDate: start,
    endDate: end,
    days,
    reason,
    status: 'pending_manager',
  });

  // Find manager and notify
  const dept = emp.department as unknown as { managerId?: { userId?: string; email?: string; phone?: string } };
  if (dept?.managerId) {
    const mgr = await Employee.findById(dept.managerId).populate('userId');
    if (mgr) {
      const mgrUser = mgr.userId as unknown as { _id: string; email: string; phone: string };
      await sendNotification({
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

router.get('/payslips', ...guard, async (req: AuthRequest, res: Response) => {
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) throw new AppError('Employee not found', 404);
  const payslips = await Payslip.find({ employeeId: emp._id })
    .populate('payrollId', 'month year grossSalary netPay status')
    .sort({ generatedAt: -1 });
  res.json(payslips);
});

router.get('/payslips/:id/download', ...guard, async (req: AuthRequest, res: Response) => {
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) throw new AppError('Employee not found', 404);
  const payslip = await Payslip.findOne({ _id: req.params.id, employeeId: emp._id });
  if (!payslip) throw new AppError('Payslip not found', 404);

  await Payslip.findByIdAndUpdate(payslip._id, { $inc: { downloadCount: 1 } });
  res.download(payslip.pdfPath);
});

// ── ATTENDANCE ────────────────────────────────────────────────────────────────

router.get('/attendance', ...guard, async (req: AuthRequest, res: Response) => {
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) throw new AppError('Employee not found', 404);
  const { month, year } = req.query;
  const filter: Record<string, unknown> = { employeeId: emp._id };
  if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 0);
    filter.date = { $gte: start, $lte: end };
  }
  const records = await Attendance.find(filter).sort({ date: -1 });
  res.json(records);
});

// ── TASKS ─────────────────────────────────────────────────────────────────────

router.get('/tasks', ...guard, async (req: AuthRequest, res: Response) => {
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) throw new AppError('Employee not found', 404);
  const tasks = await Task.find({
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

router.post('/tasks/:id/comments', ...guard, async (req: AuthRequest, res: Response) => {
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) throw new AppError('Employee not found', 404);
  const { text } = req.body;
  if (!text?.trim()) throw new AppError('Comment text required', 400);

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { $push: { comments: { authorId: emp._id, text, createdAt: new Date() } } },
    { new: true }
  );
  if (!task) throw new AppError('Task not found', 404);
  res.json(task);
});

router.post('/tasks/:id/complete', ...guard, async (req: AuthRequest, res: Response) => {
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) throw new AppError('Employee not found', 404);

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, 'assignedTo.employeeId': emp._id },
    { status: 'done', completedAt: new Date() },
    { new: true }
  ).populate('assignedBy');

  if (!task) throw new AppError('Task not found or not assigned to you', 404);

  const assignedBy = task.assignedBy as unknown as { userId: string; email: string };
  const assignedByUser = await (await import('../models/User')).default.findById(assignedBy.userId);
  if (assignedByUser) {
    await sendNotification({
      userId: assignedByUser._id!.toString(),
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
router.post('/tasks/:id/invite', ...guard, async (req: AuthRequest, res: Response) => {
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) throw new AppError('Employee not found', 404);

  const task = await Task.findById(req.params.id);
  if (!task) throw new AppError('Task not found', 404);
  if (!task.isOpenForCollaboration) throw new AppError('Task is not open for collaboration', 400);

  const { colleagueId } = req.body;
  const alreadyCollaborating = task.collaborators.some(
    (c) => c.employeeId.toString() === colleagueId
  );
  if (alreadyCollaborating) throw new AppError('Already invited', 409);

  task.collaborators.push({ employeeId: new mongoose.Types.ObjectId(colleagueId), invitedBy: emp._id as mongoose.Types.ObjectId, status: 'pending' });
  await task.save();

  // Notify colleague
  const colleague = await Employee.findById(colleagueId).populate('userId');
  if (colleague) {
    const colUser = colleague.userId as unknown as { _id: string; email: string; phone: string };
    await sendNotification({
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
router.put('/tasks/:id/collaborate', ...guard, async (req: AuthRequest, res: Response) => {
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) throw new AppError('Employee not found', 404);
  const { action } = req.body;
  if (!['accepted', 'declined'].includes(action)) throw new AppError('Invalid action', 400);

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, 'collaborators.employeeId': emp._id },
    {
      $set: {
        'collaborators.$.status': action,
        'collaborators.$.respondedAt': new Date(),
      },
    },
    { new: true }
  );
  if (!task) throw new AppError('Invite not found', 404);
  res.json(task);
});

// ── LOANS ─────────────────────────────────────────────────────────────────────

router.get('/loans', ...guard, async (req: AuthRequest, res: Response) => {
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) throw new AppError('Employee not found', 404);

  const config = await PayrollConfig.findOne();
  const loans = await LoanApplication.find({ employeeId: emp._id }).sort({ createdAt: -1 });
  const repayments = await LoanRepayment.find({ employeeId: emp._id });

  res.json({ loanEnabled: config?.loanEnabled ?? true, loans, repayments });
});

router.post('/loans', ...guard, async (req: AuthRequest, res: Response) => {
  const config = await PayrollConfig.findOne();
  if (!config?.loanEnabled) throw new AppError('Loans are not available at this time', 403);

  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) throw new AppError('Employee not found', 404);

  const monthsEmployed = Math.floor(
    (Date.now() - new Date(emp.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  if (monthsEmployed < (config.eligibilityMonths ?? 6)) {
    throw new AppError(`You must be employed for at least ${config.eligibilityMonths} months to apply for a loan`, 403);
  }

  const { amount, purpose, repaymentMonths } = req.body;
  if (amount > config.maxLoanAmount) {
    throw new AppError(`Maximum loan amount is ₦${config.maxLoanAmount.toLocaleString()}`, 400);
  }

  const interestRate = config.loanInterestRate ?? 0;
  const totalRepayable = amount * (1 + interestRate / 100);
  const monthlyDeduction = Math.ceil(totalRepayable / repaymentMonths);

  const loan = await LoanApplication.create({
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

router.get('/salary-advances', ...guard, async (req: AuthRequest, res: Response) => {
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) throw new AppError('Employee not found', 404);

  const config = await PayrollConfig.findOne();
  const advances = await SalaryAdvance.find({ employeeId: emp._id }).sort({ createdAt: -1 });

  res.json({ salaryAdvanceEnabled: config?.salaryAdvanceEnabled ?? true, advances });
});

router.post('/salary-advances', ...guard, async (req: AuthRequest, res: Response) => {
  const config = await PayrollConfig.findOne();
  if (!config?.salaryAdvanceEnabled) throw new AppError('Salary advance is not available at this time', 403);

  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) throw new AppError('Employee not found', 404);

  // Check per-year limit
  const currentYear = new Date().getFullYear();
  const advancesThisYear = await SalaryAdvance.countDocuments({
    employeeId: emp._id,
    status: { $in: ['approved', 'pending'] },
    createdAt: { $gte: new Date(currentYear, 0, 1) },
  });

  if (advancesThisYear >= (config.maxAdvancePerYear ?? 2)) {
    throw new AppError(`You have reached the maximum number of salary advances for this year`, 403);
  }

  const gross = emp.basicSalary + emp.housingAllowance + emp.transportAllowance;
  const maxAmount = (gross * (config.maxAdvancePercent ?? 50)) / 100;

  const { amount, reason } = req.body;
  if (amount > maxAmount) {
    throw new AppError(`Maximum advance is ₦${maxAmount.toLocaleString()} (${config.maxAdvancePercent}% of gross)`, 400);
  }

  const advance = await SalaryAdvance.create({ employeeId: emp._id, amount, reason, status: 'pending' });
  res.status(201).json(advance);
});

// ── DOCUMENTS ─────────────────────────────────────────────────────────────────

const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.env.UPLOAD_DIR ?? 'uploads', 'documents');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const docUpload = multer({ storage: docStorage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/documents', ...guard, async (req: AuthRequest, res: Response) => {
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) throw new AppError('Employee not found', 404);
  const docs = await Document.find({ employeeId: emp._id }).sort({ uploadedAt: -1 });
  res.json(docs);
});

router.post('/documents', ...guard, docUpload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) throw new AppError('Employee not found', 404);
  const doc = await Document.create({
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

router.get('/documents/:id/download', ...guard, async (req: AuthRequest, res: Response) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) throw new AppError('Document not found', 404);
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp || doc.employeeId.toString() !== emp._id!.toString()) throw new AppError('Forbidden', 403);
  if (!fs.existsSync(doc.filePath)) throw new AppError('File not found on server', 404);
  res.download(doc.filePath, doc.fileName);
});

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

router.get('/notifications', ...guard, async (req: AuthRequest, res: Response) => {
  const notifications = await Notification.find({ userId: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(notifications);
});

router.put('/notifications/read-all', ...guard, async (req: AuthRequest, res: Response) => {
  await Notification.updateMany({ userId: req.user!._id, read: false }, { read: true });
  res.json({ message: 'All notifications marked read' });
});

router.put('/notifications/:id/read', ...guard, async (req: AuthRequest, res: Response) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ message: 'Notification marked read' });
});

export default router;

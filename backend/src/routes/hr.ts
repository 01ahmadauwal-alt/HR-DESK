import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import User from '../models/User';
import Employee from '../models/Employee';
import Department from '../models/Department';
import LeaveRequest from '../models/LeaveRequest';
import LeaveBalance from '../models/LeaveBalance';
import Payroll from '../models/Payroll';
import PayrollConfig from '../models/PayrollConfig';
import Payslip from '../models/Payslip';
import EmployeeDeductionOverride from '../models/EmployeeDeductionOverride';
import LoanApplication from '../models/LoanApplication';
import LoanRepayment from '../models/LoanRepayment';
import SalaryAdvance from '../models/SalaryAdvance';
import Notification from '../models/Notification';
import { calculatePayroll } from '../services/payrollEngine';
import { generatePayslipPdf } from '../services/pdfService';
import { sendNotification } from '../services/notificationService';
import Job from '../models/Job';
import Applicant from '../models/Applicant';
import Document from '../models/Document';
import path from 'path';
import fs from 'fs';

const router = Router();
const guard = [authenticate, authorize('hr_manager', 'super_admin')];

// ── EMPLOYEES ─────────────────────────────────────────────────────────────────

router.get('/employees', ...guard, async (_req: AuthRequest, res: Response) => {
  const employees = await Employee.find()
    .populate('department', 'name code')
    .sort({ createdAt: -1 });
  res.json(employees);
});

router.get('/employees/:id', ...guard, async (req: AuthRequest, res: Response) => {
  const emp = await Employee.findById(req.params.id).populate('department', 'name code');
  if (!emp) throw new AppError('Employee not found', 404);
  res.json(emp);
});

router.post('/employees', ...guard, async (req: AuthRequest, res: Response) => {
  const {
    firstName, lastName, middleName, email, phone, position, department,
    hireDate, employmentType, basicSalary, housingAllowance, transportAllowance,
    role = 'employee',
  } = req.body;

  if (!firstName || !lastName || !email || !phone || !position || !basicSalary) {
    throw new AppError('Required fields missing', 400);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new AppError('Email already registered', 409);

  // Auto-generate employee ID
  const count = await Employee.countDocuments();
  const employeeId = `EMP${String(count + 1).padStart(4, '0')}`;

  // Hash phone as default password
  const passwordHash = await bcrypt.hash(phone, 12);

  const user = await User.create({
    email: email.toLowerCase(),
    phone,
    username: email.toLowerCase(),
    passwordHash,
    role,
    isFirstLogin: true,
    active: true,
  });

  const employee = await Employee.create({
    userId: user._id,
    employeeId,
    firstName,
    lastName,
    middleName,
    phone,
    email: email.toLowerCase(),
    department,
    position,
    hireDate: new Date(hireDate),
    employmentType: employmentType ?? 'full_time',
    basicSalary: Number(basicSalary),
    housingAllowance: Number(housingAllowance ?? 0),
    transportAllowance: Number(transportAllowance ?? 0),
  });

  await User.findByIdAndUpdate(user._id, { employeeId: employee._id });

  // Create leave balance for current year
  await LeaveBalance.create({ employeeId: employee._id, year: new Date().getFullYear() });

  // Add to department
  if (department) {
    await Department.findByIdAndUpdate(department, { $addToSet: { memberIds: employee._id } });
  }

  res.status(201).json({ employee, credentials: { username: email, password: phone } });
});

router.put('/employees/:id', ...guard, async (req: AuthRequest, res: Response) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('department', 'name code');
  if (!employee) throw new AppError('Employee not found', 404);
  res.json(employee);
});

router.patch('/employees/:id/deactivate', ...guard, async (req: AuthRequest, res: Response) => {
  await Employee.findByIdAndUpdate(req.params.id, { isActive: false });
  const emp = await Employee.findById(req.params.id);
  if (emp) await User.findByIdAndUpdate(emp.userId, { active: false });
  res.json({ message: 'Employee deactivated' });
});

// ── LEAVE MANAGEMENT ──────────────────────────────────────────────────────────

router.get('/leaves', ...guard, async (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  const leaves = await LeaveRequest.find(filter)
    .populate('employeeId', 'firstName lastName employeeId position')
    .sort({ createdAt: -1 });
  res.json(leaves);
});

router.put('/leaves/:id/approve', ...guard, async (req: AuthRequest, res: Response) => {
  const leave = await LeaveRequest.findById(req.params.id).populate('employeeId');
  if (!leave) throw new AppError('Leave request not found', 404);
  if (leave.status !== 'pending_hr') throw new AppError('Leave not at HR stage', 400);

  leave.status = 'approved';
  leave.hrApprovalBy = req.user!._id as mongoose.Types.ObjectId;
  leave.hrApprovalAt = new Date();
  await leave.save();

  // Deduct from leave balance
  const emp = leave.employeeId as unknown as { _id: string };
  const balance = await LeaveBalance.findOne({ employeeId: emp._id, year: new Date().getFullYear() });
  if (balance) {
    const field = `used${leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}` as keyof typeof balance;
    if (typeof balance[field] === 'number') {
      (balance as Record<string, unknown>)[field as string] = (balance[field] as number) + leave.days;
      await balance.save();
    }
  }

  const empDoc = leave.employeeId as unknown as { userId: string; email: string; phone: string; firstName: string };
  await sendNotification({
    userId: empDoc.userId,
    type: 'leave_hr_approved',
    title: 'Leave Request Approved',
    message: `Your ${leave.type} leave request from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()} has been approved by HR.`,
    channels: ['in_app', 'email', 'whatsapp'],
    email: empDoc.email,
    phone: empDoc.phone,
  });

  res.json(leave);
});

router.put('/leaves/:id/reject', ...guard, async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;
  const leave = await LeaveRequest.findById(req.params.id).populate('employeeId');
  if (!leave) throw new AppError('Leave request not found', 404);
  if (!['pending_hr', 'pending_manager'].includes(leave.status)) throw new AppError('Cannot reject at this stage', 400);

  leave.status = 'rejected';
  leave.rejectedBy = req.user!._id as mongoose.Types.ObjectId;
  leave.rejectionReason = reason;
  await leave.save();

  const empDoc = leave.employeeId as unknown as { userId: string; email: string; phone: string };
  await sendNotification({
    userId: empDoc.userId,
    type: 'leave_rejected',
    title: 'Leave Request Rejected',
    message: `Your leave request has been rejected. Reason: ${reason || 'Not specified'}`,
    channels: ['in_app', 'email'],
    email: empDoc.email,
  });

  res.json(leave);
});

// ── PAYROLL CONFIG ────────────────────────────────────────────────────────────

router.get('/payroll/config', ...guard, async (_req: AuthRequest, res: Response) => {
  let config = await PayrollConfig.findOne();
  if (!config) config = await PayrollConfig.create({});
  res.json(config);
});

router.put('/payroll/config', ...guard, async (req: AuthRequest, res: Response) => {
  let config = await PayrollConfig.findOne();
  if (!config) {
    config = await PayrollConfig.create(req.body);
  } else {
    Object.assign(config, req.body);
    await config.save();
  }
  res.json(config);
});

// ── PAYROLL PROCESSING ────────────────────────────────────────────────────────

router.get('/payroll', ...guard, async (req: AuthRequest, res: Response) => {
  const { month, year, status } = req.query;
  const filter: Record<string, unknown> = {};
  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);
  if (status) filter.status = status;

  const payrolls = await Payroll.find(filter)
    .populate('employeeId', 'firstName lastName employeeId position department')
    .sort({ createdAt: -1 });
  res.json(payrolls);
});

router.post('/payroll/process', ...guard, async (req: AuthRequest, res: Response) => {
  const { month, year } = req.body;
  if (!month || !year) throw new AppError('Month and year required', 400);

  const config = await PayrollConfig.findOne() ?? await PayrollConfig.create({});
  const employees = await Employee.find({ isActive: true });

  const results = [];

  for (const emp of employees) {
    const existingPayroll = await Payroll.findOne({ employeeId: emp._id, month, year });
    if (existingPayroll) continue;

    // Fetch active loan repayment
    const loanRep = await LoanRepayment.findOne({
      employeeId: emp._id, month, year, status: 'pending',
    });

    // Fetch salary advance recovery
    const advance = await SalaryAdvance.findOne({
      employeeId: emp._id, deductMonth: month, deductYear: year, status: 'approved',
    });

    // Fetch overrides
    const today = new Date();
    const overrides = await EmployeeDeductionOverride.find({
      employeeId: emp._id,
      activeFrom: { $lte: today },
      $or: [{ activeTo: null }, { activeTo: { $gte: today } }],
    });

    const result = calculatePayroll(
      emp,
      config,
      loanRep ? loanRep.amount : 0,
      advance ? advance.amount / (advance.splitMonths ?? 1) : 0,
      overrides
    );

    const payroll = await Payroll.create({
      employeeId: emp._id,
      month,
      year,
      ...result,
    });

    results.push(payroll);
  }

  res.status(201).json({ processed: results.length, payrolls: results });
});

router.put('/payroll/:id/approve', ...guard, async (req: AuthRequest, res: Response) => {
  const payroll = await Payroll.findById(req.params.id).populate('employeeId');
  if (!payroll) throw new AppError('Payroll not found', 404);

  payroll.status = 'approved';
  payroll.approvedBy = req.user!._id as mongoose.Types.ObjectId;
  payroll.approvedAt = new Date();
  await payroll.save();

  // Generate payslip PDF
  const emp = payroll.employeeId as unknown as { _id: string };
  const employee = await Employee.findById(emp._id);
  if (employee) {
    const uploadDir = path.join(process.env.UPLOAD_DIR ?? 'uploads', 'payslips', (employee._id as string).toString());
    const pdfPath = await generatePayslipPdf(payroll, employee, uploadDir);

    await Payslip.create({
      payrollId: payroll._id,
      employeeId: employee._id,
      pdfPath,
    });

    const empUser = await User.findById(employee.userId);
    if (empUser) {
      await sendNotification({
        userId: (empUser._id as string).toString(),
        type: 'payslip_ready',
        title: 'Your Payslip is Ready',
        message: `Your payslip for ${new Date(payroll.year, payroll.month - 1).toLocaleString('en-NG', { month: 'long', year: 'numeric' })} is now available for download.`,
        channels: ['in_app', 'email'],
        email: empUser.email,
      });
    }
  }

  // Mark loan repayment deducted
  await LoanRepayment.updateOne(
    { employeeId: payroll.employeeId, month: payroll.month, year: payroll.year, status: 'pending' },
    { status: 'deducted', payrollId: payroll._id }
  );

  res.json(payroll);
});

// ── DEDUCTION OVERRIDES ───────────────────────────────────────────────────────

router.get('/employees/:id/overrides', ...guard, async (req: AuthRequest, res: Response) => {
  const overrides = await EmployeeDeductionOverride.find({ employeeId: req.params.id });
  res.json(overrides);
});

router.post('/employees/:id/overrides', ...guard, async (req: AuthRequest, res: Response) => {
  const override = await EmployeeDeductionOverride.create({
    ...req.body,
    employeeId: req.params.id,
    createdBy: req.user!._id,
  });
  res.status(201).json(override);
});

router.delete('/employees/:id/overrides/:oid', ...guard, async (_req: AuthRequest, res: Response) => {
  await EmployeeDeductionOverride.findByIdAndDelete(_req.params.oid);
  res.json({ message: 'Override deleted' });
});

// ── LOANS ─────────────────────────────────────────────────────────────────────

router.get('/loans', ...guard, async (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  const loans = await LoanApplication.find(filter)
    .populate('employeeId', 'firstName lastName employeeId')
    .sort({ createdAt: -1 });
  res.json(loans);
});

router.put('/loans/:id/approve', ...guard, async (req: AuthRequest, res: Response) => {
  const { disbursedAt } = req.body;
  const loan = await LoanApplication.findById(req.params.id).populate('employeeId');
  if (!loan) throw new AppError('Loan not found', 404);
  if (loan.status !== 'pending') throw new AppError('Loan already processed', 400);

  loan.status = 'active';
  loan.hrApprovedBy = req.user!._id as mongoose.Types.ObjectId;
  loan.hrApprovedAt = new Date();
  loan.disbursedAt = disbursedAt ? new Date(disbursedAt) : new Date();
  await loan.save();

  // Auto-generate repayment schedule
  const startDate = new Date(loan.disbursedAt ?? new Date());
  let month = startDate.getMonth() + 2;
  let year = startDate.getFullYear();
  if (month > 12) { month = 1; year++; }

  for (let i = 0; i < loan.repaymentMonths; i++) {
    await LoanRepayment.create({
      loanId: loan._id,
      employeeId: loan.employeeId,
      month,
      year,
      amount: loan.monthlyDeduction,
      status: 'pending',
    });
    month++;
    if (month > 12) { month = 1; year++; }
  }

  const empDoc = loan.employeeId as unknown as { userId: string; email: string; phone: string };
  await sendNotification({
    userId: empDoc.userId,
    type: 'loan_approved',
    title: 'Loan Request Approved',
    message: `Your loan request of ₦${loan.amount.toLocaleString()} has been approved and will be disbursed shortly.`,
    channels: ['in_app', 'email', 'whatsapp'],
    email: empDoc.email,
    phone: empDoc.phone,
  });

  res.json(loan);
});

router.put('/loans/:id/reject', ...guard, async (req: AuthRequest, res: Response) => {
  const loan = await LoanApplication.findById(req.params.id).populate('employeeId');
  if (!loan) throw new AppError('Loan not found', 404);

  loan.status = 'rejected';
  loan.rejectionReason = req.body.reason;
  await loan.save();

  const empDoc = loan.employeeId as unknown as { userId: string; email: string };
  await sendNotification({
    userId: empDoc.userId,
    type: 'loan_rejected',
    title: 'Loan Request Rejected',
    message: `Your loan request has been rejected. Reason: ${req.body.reason || 'Not specified'}`,
    channels: ['in_app', 'email'],
    email: empDoc.email,
  });

  res.json(loan);
});

// ── SALARY ADVANCE ────────────────────────────────────────────────────────────

router.get('/salary-advances', ...guard, async (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  const advances = await SalaryAdvance.find(filter)
    .populate('employeeId', 'firstName lastName employeeId basicSalary grossSalary')
    .sort({ createdAt: -1 });
  res.json(advances);
});

router.put('/salary-advances/:id/approve', ...guard, async (req: AuthRequest, res: Response) => {
  const { deductMonth, deductYear, splitMonths = 1 } = req.body;
  const advance = await SalaryAdvance.findById(req.params.id).populate('employeeId');
  if (!advance) throw new AppError('Advance not found', 404);
  if (advance.status !== 'pending') throw new AppError('Already processed', 400);

  advance.status = 'approved';
  advance.hrApprovedBy = req.user!._id as mongoose.Types.ObjectId;
  advance.hrApprovedAt = new Date();
  advance.deductMonth = deductMonth;
  advance.deductYear = deductYear;
  advance.splitMonths = splitMonths;
  await advance.save();

  const empDoc = advance.employeeId as unknown as { userId: string; email: string; phone: string };
  await sendNotification({
    userId: empDoc.userId,
    type: 'advance_approved',
    title: 'Salary Advance Approved',
    message: `Your salary advance of ₦${advance.amount.toLocaleString()} has been approved and will be deducted from your ${new Date(deductYear, deductMonth - 1).toLocaleString('en-NG', { month: 'long' })} payslip.`,
    channels: ['in_app', 'email', 'whatsapp'],
    email: empDoc.email,
    phone: empDoc.phone,
  });

  res.json(advance);
});

router.put('/salary-advances/:id/reject', ...guard, async (req: AuthRequest, res: Response) => {
  const advance = await SalaryAdvance.findById(req.params.id).populate('employeeId');
  if (!advance) throw new AppError('Advance not found', 404);

  advance.status = 'rejected';
  advance.rejectionReason = req.body.reason;
  await advance.save();

  const empDoc = advance.employeeId as unknown as { userId: string; email: string };
  await sendNotification({
    userId: empDoc.userId,
    type: 'advance_rejected',
    title: 'Salary Advance Rejected',
    message: `Your salary advance request has been rejected. Reason: ${req.body.reason || 'Not specified'}`,
    channels: ['in_app', 'email'],
    email: empDoc.email,
  });

  res.json(advance);
});

// ── EMPLOYEE PAYROLL HISTORY ──────────────────────────────────────────────────

router.get('/employees/:id/payrolls', ...guard, async (req: AuthRequest, res: Response) => {
  const payrolls = await Payroll.find({ employeeId: req.params.id }).sort({ year: -1, month: -1 });
  res.json(payrolls);
});

// ── BATCH PAYROLL APPROVE ─────────────────────────────────────────────────────

router.post('/payroll/approve', ...guard, async (req: AuthRequest, res: Response) => {
  const { month, year } = req.body;
  if (!month || !year) throw new AppError('Month and year required', 400);

  const drafts = await Payroll.find({ month, year, status: 'draft' }).populate('employeeId');
  if (drafts.length === 0) throw new AppError('No draft payrolls found for this period', 400);

  const generated = [];
  for (const payroll of drafts) {
    payroll.status = 'approved';
    (payroll as unknown as Record<string, unknown>).approvedBy = req.user!._id;
    (payroll as unknown as Record<string, unknown>).approvedAt = new Date();
    await payroll.save();

    const emp = await Employee.findById((payroll.employeeId as unknown as { _id: string })._id);
    if (emp) {
      const uploadDir = path.join(process.env.UPLOAD_DIR ?? 'uploads', 'payslips', (emp._id as unknown as string).toString());
      const pdfPath = await generatePayslipPdf(payroll, emp, uploadDir);
      const slip = await Payslip.create({ payrollId: payroll._id, employeeId: emp._id, pdfPath });

      await LoanRepayment.updateOne(
        { employeeId: emp._id, month, year, status: 'pending' },
        { status: 'deducted', payrollId: payroll._id }
      );

      const empUser = await User.findById(emp.userId);
      if (empUser) {
        await sendNotification({
          userId: (empUser._id as unknown as string).toString(),
          type: 'payslip_ready',
          title: 'Your Payslip is Ready',
          message: `Your payslip for ${new Date(year, month - 1).toLocaleString('en-NG', { month: 'long', year: 'numeric' })} is now available.`,
          channels: ['in_app', 'email'],
          email: empUser.email,
        });
      }
      generated.push(slip);
    }
  }

  res.json({ approved: drafts.length, payslips: generated.length });
});

// ── JOBS (HR VIEW) ────────────────────────────────────────────────────────────

router.get('/jobs', ...guard, async (_req: AuthRequest, res: Response) => {
  const jobs = await Job.find().populate('department', 'name').sort({ createdAt: -1 });
  res.json(jobs);
});

router.post('/jobs', ...guard, async (req: AuthRequest, res: Response) => {
  const job = await Job.create({ ...req.body, createdBy: req.user!._id });
  res.status(201).json(job);
});

router.put('/jobs/:id', ...guard, async (req: AuthRequest, res: Response) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!job) throw new AppError('Job not found', 404);
  res.json(job);
});

router.get('/jobs/:id/applicants', ...guard, async (req: AuthRequest, res: Response) => {
  const applicants = await Applicant.find({ jobId: req.params.id }).sort({ createdAt: -1 });
  res.json(applicants);
});

router.put('/applicants/:id/stage', ...guard, async (req: AuthRequest, res: Response) => {
  const applicant = await Applicant.findByIdAndUpdate(req.params.id, { stage: req.body.stage }, { new: true });
  if (!applicant) throw new AppError('Applicant not found', 404);

  // If hired, increment job count
  if (req.body.stage === 'hired') {
    await Job.findByIdAndUpdate(applicant.jobId, { $inc: { applicantCount: 0 } });
  }

  res.json(applicant);
});

// ── DOCUMENTS (HR VIEW) ───────────────────────────────────────────────────────

router.get('/documents', ...guard, async (_req: AuthRequest, res: Response) => {
  const docs = await Document.find()
    .populate('employeeId', 'firstName lastName employeeId')
    .sort({ uploadedAt: -1 });
  res.json(docs);
});

router.get('/documents/:id/download', ...guard, async (req: AuthRequest, res: Response) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) throw new AppError('Document not found', 404);
  if (!fs.existsSync(doc.filePath)) throw new AppError('File not found on server', 404);
  res.download(doc.filePath, doc.fileName);
});

router.put('/documents/:id/verify', ...guard, async (req: AuthRequest, res: Response) => {
  const doc = await Document.findByIdAndUpdate(
    req.params.id,
    { verifiedBy: req.user!._id, verifiedAt: new Date() },
    { new: true }
  );
  if (!doc) throw new AppError('Document not found', 404);
  res.json(doc);
});

// ── INTEGRATIONS ──────────────────────────────────────────────────────────────

const integrationStore: Map<string, Record<string, string>> = new Map();

router.get('/integrations', ...guard, async (_req: AuthRequest, res: Response) => {
  res.json({ connected: Array.from(integrationStore.keys()) });
});

router.post('/integrations/:id/connect', ...guard, async (req: AuthRequest, res: Response) => {
  integrationStore.set(req.params.id, req.body);
  res.json({ message: `${req.params.id} connected successfully` });
});

router.post('/integrations/:id/disconnect', ...guard, async (req: AuthRequest, res: Response) => {
  integrationStore.delete(req.params.id);
  res.json({ message: `${req.params.id} disconnected` });
});

router.post('/integrations/:id/test', ...guard, async (req: AuthRequest, res: Response) => {
  if (!integrationStore.has(req.params.id)) throw new AppError('Integration not connected', 400);
  res.json({ message: 'Connection test passed' });
});

// ── HR METRICS ────────────────────────────────────────────────────────────────

router.get('/metrics', ...guard, async (_req: AuthRequest, res: Response) => {
  const [totalEmployees, activeEmployees, departments, pendingLeaves, openJobs] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ isActive: true }),
    Department.countDocuments({ active: true }),
    LeaveRequest.countDocuments({ status: { $in: ['pending_manager', 'pending_hr'] } }),
    (await import('../models/Job')).default.countDocuments({ status: 'active' }),
  ]);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const payrollAgg = await Payroll.aggregate([
    { $match: { month: currentMonth, year: currentYear, status: { $in: ['approved', 'paid'] } } },
    { $group: { _id: null, totalNetPay: { $sum: '$netPay' }, totalGross: { $sum: '$grossSalary' }, count: { $sum: 1 } } },
  ]);

  const payrollSummary = payrollAgg[0] ?? { totalNetPay: 0, totalGross: 0, count: 0 };

  res.json({
    totalEmployees,
    activeEmployees,
    departments,
    pendingLeaves,
    openJobs,
    payroll: {
      month: currentMonth,
      year: currentYear,
      totalNetPay: payrollSummary.totalNetPay,
      totalGross: payrollSummary.totalGross,
      processedCount: payrollSummary.count,
    },
  });
});

router.get('/metrics/departments', ...guard, async (_req: AuthRequest, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const depts = await Department.find({ active: true }).lean();
  const result = await Promise.all(depts.map(async dept => {
    const members = await Employee.find({ department: dept._id, isActive: true }, '_id');
    const memberIds = members.map(m => m._id);
    const onLeave = await (await import('../models/LeaveRequest')).default.countDocuments({
      employeeId: { $in: memberIds },
      status: 'approved',
      startDate: { $lte: today },
      endDate: { $gte: today },
    });
    const Attendance = (await import('../models/Attendance')).default;
    const onDuty = await Attendance.countDocuments({
      employeeId: { $in: memberIds },
      date: today,
      status: { $in: ['present', 'late'] },
    });
    return {
      _id: dept._id,
      name: dept.name,
      code: dept.code,
      count: memberIds.length,
      onDuty,
      onLeave,
      absent: Math.max(0, memberIds.length - onDuty - onLeave),
    };
  }));
  res.json(result);
});

router.get('/metrics/gender', ...guard, async (_req: AuthRequest, res: Response) => {
  const agg = await Employee.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$gender', value: { $sum: 1 } } },
  ]);
  const data = agg.map(a => ({ name: a._id ? (a._id.charAt(0).toUpperCase() + a._id.slice(1)) : 'Unknown', value: a.value }));
  res.json(data);
});

router.get('/metrics/leave-trend', ...guard, async (_req: AuthRequest, res: Response) => {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.getMonth() + 1, year: d.getFullYear(), label: d.toLocaleString('en', { month: 'short' }) });
  }
  const LeaveRequest = (await import('../models/LeaveRequest')).default;
  const data = await Promise.all(months.map(async m => {
    const count = await LeaveRequest.countDocuments({
      createdAt: {
        $gte: new Date(m.year, m.month - 1, 1),
        $lt: new Date(m.year, m.month, 1),
      },
    });
    return { month: m.label, count };
  }));
  res.json(data);
});

// ── ROLE MANAGEMENT ──────────────────────────────────────────────────────────

router.get('/roles', ...guard, async (_req: AuthRequest, res: Response) => {
  const users = await User.find({}, 'email username role active isFirstLogin employeeId createdAt')
    .populate({
      path: 'employeeId',
      select: 'firstName lastName employeeId position department',
      populate: { path: 'department', select: 'name' },
    })
    .sort({ createdAt: -1 });
  res.json(users);
});

router.put('/roles/:userId', ...guard, async (req: AuthRequest, res: Response) => {
  const { role, active } = req.body;
  const allowedRoles = ['employee', 'manager', 'hr_manager', 'super_admin'];
  if (role && !allowedRoles.includes(role)) throw new AppError('Invalid role', 400);

  const update: Record<string, unknown> = {};
  if (role !== undefined) update.role = role;
  if (active !== undefined) update.active = active;

  const user = await User.findByIdAndUpdate(req.params.userId, update, { new: true })
    .populate({ path: 'employeeId', select: 'firstName lastName employeeId position' });
  if (!user) throw new AppError('User not found', 404);
  res.json(user);
});

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

router.get('/notifications', ...guard, async (req: AuthRequest, res: Response) => {
  const notifications = await Notification.find({ userId: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(notifications);
});

export default router;

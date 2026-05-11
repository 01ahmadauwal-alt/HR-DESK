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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const User_1 = __importDefault(require("../models/User"));
const Employee_1 = __importDefault(require("../models/Employee"));
const Department_1 = __importDefault(require("../models/Department"));
const LeaveRequest_1 = __importDefault(require("../models/LeaveRequest"));
const LeaveBalance_1 = __importDefault(require("../models/LeaveBalance"));
const Payroll_1 = __importDefault(require("../models/Payroll"));
const PayrollConfig_1 = __importDefault(require("../models/PayrollConfig"));
const Payslip_1 = __importDefault(require("../models/Payslip"));
const EmployeeDeductionOverride_1 = __importDefault(require("../models/EmployeeDeductionOverride"));
const LoanApplication_1 = __importDefault(require("../models/LoanApplication"));
const LoanRepayment_1 = __importDefault(require("../models/LoanRepayment"));
const SalaryAdvance_1 = __importDefault(require("../models/SalaryAdvance"));
const Notification_1 = __importDefault(require("../models/Notification"));
const payrollEngine_1 = require("../services/payrollEngine");
const pdfService_1 = require("../services/pdfService");
const notificationService_1 = require("../services/notificationService");
const Job_1 = __importDefault(require("../models/Job"));
const Applicant_1 = __importDefault(require("../models/Applicant"));
const Document_1 = __importDefault(require("../models/Document"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const guard = [auth_1.authenticate, (0, auth_1.authorize)('hr_manager', 'super_admin')];
// ── EMPLOYEES ─────────────────────────────────────────────────────────────────
router.get('/employees', ...guard, async (_req, res) => {
    const employees = await Employee_1.default.find()
        .populate('department', 'name code')
        .sort({ createdAt: -1 });
    res.json(employees);
});
router.get('/employees/:id', ...guard, async (req, res) => {
    const emp = await Employee_1.default.findById(req.params.id).populate('department', 'name code');
    if (!emp)
        throw new errorHandler_1.AppError('Employee not found', 404);
    res.json(emp);
});
router.post('/employees', ...guard, async (req, res) => {
    const { firstName, lastName, middleName, email, phone, position, department, hireDate, employmentType, basicSalary, housingAllowance, transportAllowance, role = 'employee', } = req.body;
    if (!firstName || !lastName || !email || !phone || !position || !basicSalary) {
        throw new errorHandler_1.AppError('Required fields missing', 400);
    }
    const existingUser = await User_1.default.findOne({ email: email.toLowerCase() });
    if (existingUser)
        throw new errorHandler_1.AppError('Email already registered', 409);
    // Auto-generate employee ID
    const count = await Employee_1.default.countDocuments();
    const employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
    // Hash phone as default password
    const passwordHash = await bcryptjs_1.default.hash(phone, 12);
    const user = await User_1.default.create({
        email: email.toLowerCase(),
        phone,
        username: email.toLowerCase(),
        passwordHash,
        role,
        isFirstLogin: true,
        active: true,
    });
    const employee = await Employee_1.default.create({
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
    await User_1.default.findByIdAndUpdate(user._id, { employeeId: employee._id });
    // Create leave balance for current year
    await LeaveBalance_1.default.create({ employeeId: employee._id, year: new Date().getFullYear() });
    // Add to department
    if (department) {
        await Department_1.default.findByIdAndUpdate(department, { $addToSet: { memberIds: employee._id } });
    }
    res.status(201).json({ employee, credentials: { username: email, password: phone } });
});
router.put('/employees/:id', ...guard, async (req, res) => {
    const employee = await Employee_1.default.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    }).populate('department', 'name code');
    if (!employee)
        throw new errorHandler_1.AppError('Employee not found', 404);
    res.json(employee);
});
router.patch('/employees/:id/deactivate', ...guard, async (req, res) => {
    await Employee_1.default.findByIdAndUpdate(req.params.id, { isActive: false });
    const emp = await Employee_1.default.findById(req.params.id);
    if (emp)
        await User_1.default.findByIdAndUpdate(emp.userId, { active: false });
    res.json({ message: 'Employee deactivated' });
});
// ── LEAVE MANAGEMENT ──────────────────────────────────────────────────────────
router.get('/leaves', ...guard, async (req, res) => {
    const { status } = req.query;
    const filter = {};
    if (status)
        filter.status = status;
    const leaves = await LeaveRequest_1.default.find(filter)
        .populate('employeeId', 'firstName lastName employeeId position')
        .sort({ createdAt: -1 });
    res.json(leaves);
});
router.put('/leaves/:id/approve', ...guard, async (req, res) => {
    const leave = await LeaveRequest_1.default.findById(req.params.id).populate('employeeId');
    if (!leave)
        throw new errorHandler_1.AppError('Leave request not found', 404);
    if (leave.status !== 'pending_hr')
        throw new errorHandler_1.AppError('Leave not at HR stage', 400);
    leave.status = 'approved';
    leave.hrApprovalBy = req.user._id;
    leave.hrApprovalAt = new Date();
    await leave.save();
    // Deduct from leave balance
    const emp = leave.employeeId;
    const balance = await LeaveBalance_1.default.findOne({ employeeId: emp._id, year: new Date().getFullYear() });
    if (balance) {
        const field = `used${leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}`;
        if (typeof balance[field] === 'number') {
            balance[field] = balance[field] + leave.days;
            await balance.save();
        }
    }
    const empDoc = leave.employeeId;
    await (0, notificationService_1.sendNotification)({
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
router.put('/leaves/:id/reject', ...guard, async (req, res) => {
    const { reason } = req.body;
    const leave = await LeaveRequest_1.default.findById(req.params.id).populate('employeeId');
    if (!leave)
        throw new errorHandler_1.AppError('Leave request not found', 404);
    if (!['pending_hr', 'pending_manager'].includes(leave.status))
        throw new errorHandler_1.AppError('Cannot reject at this stage', 400);
    leave.status = 'rejected';
    leave.rejectedBy = req.user._id;
    leave.rejectionReason = reason;
    await leave.save();
    const empDoc = leave.employeeId;
    await (0, notificationService_1.sendNotification)({
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
router.get('/payroll/config', ...guard, async (_req, res) => {
    let config = await PayrollConfig_1.default.findOne();
    if (!config)
        config = await PayrollConfig_1.default.create({});
    res.json(config);
});
router.put('/payroll/config', ...guard, async (req, res) => {
    let config = await PayrollConfig_1.default.findOne();
    if (!config) {
        config = await PayrollConfig_1.default.create(req.body);
    }
    else {
        Object.assign(config, req.body);
        await config.save();
    }
    res.json(config);
});
// ── PAYROLL PROCESSING ────────────────────────────────────────────────────────
router.get('/payroll', ...guard, async (req, res) => {
    const { month, year, status } = req.query;
    const filter = {};
    if (month)
        filter.month = Number(month);
    if (year)
        filter.year = Number(year);
    if (status)
        filter.status = status;
    const payrolls = await Payroll_1.default.find(filter)
        .populate('employeeId', 'firstName lastName employeeId position department')
        .sort({ createdAt: -1 });
    res.json(payrolls);
});
router.post('/payroll/process', ...guard, async (req, res) => {
    const { month, year } = req.body;
    if (!month || !year)
        throw new errorHandler_1.AppError('Month and year required', 400);
    const config = await PayrollConfig_1.default.findOne() ?? await PayrollConfig_1.default.create({});
    const employees = await Employee_1.default.find({ isActive: true });
    const results = [];
    for (const emp of employees) {
        const existingPayroll = await Payroll_1.default.findOne({ employeeId: emp._id, month, year });
        if (existingPayroll)
            continue;
        // Fetch active loan repayment
        const loanRep = await LoanRepayment_1.default.findOne({
            employeeId: emp._id, month, year, status: 'pending',
        });
        // Fetch salary advance recovery
        const advance = await SalaryAdvance_1.default.findOne({
            employeeId: emp._id, deductMonth: month, deductYear: year, status: 'approved',
        });
        // Fetch overrides
        const today = new Date();
        const overrides = await EmployeeDeductionOverride_1.default.find({
            employeeId: emp._id,
            activeFrom: { $lte: today },
            $or: [{ activeTo: null }, { activeTo: { $gte: today } }],
        });
        const result = (0, payrollEngine_1.calculatePayroll)(emp, config, loanRep ? loanRep.amount : 0, advance ? advance.amount / (advance.splitMonths ?? 1) : 0, overrides);
        const payroll = await Payroll_1.default.create({
            month,
            year,
            ...result,
        });
        results.push(payroll);
    }
    res.status(201).json({ processed: results.length, payrolls: results });
});
router.put('/payroll/:id/approve', ...guard, async (req, res) => {
    const payroll = await Payroll_1.default.findById(req.params.id).populate('employeeId');
    if (!payroll)
        throw new errorHandler_1.AppError('Payroll not found', 404);
    payroll.status = 'approved';
    payroll.approvedBy = req.user._id;
    payroll.approvedAt = new Date();
    await payroll.save();
    // Generate payslip PDF
    const emp = payroll.employeeId;
    const employee = await Employee_1.default.findById(emp._id);
    if (employee) {
        const uploadDir = path_1.default.join(process.env.UPLOAD_DIR ?? 'uploads', 'payslips', employee._id.toString());
        const pdfPath = await (0, pdfService_1.generatePayslipPdf)(payroll, employee, uploadDir);
        await Payslip_1.default.create({
            payrollId: payroll._id,
            employeeId: employee._id,
            pdfPath,
        });
        const empUser = await User_1.default.findById(employee.userId);
        if (empUser) {
            await (0, notificationService_1.sendNotification)({
                userId: empUser._id.toString(),
                type: 'payslip_ready',
                title: 'Your Payslip is Ready',
                message: `Your payslip for ${new Date(payroll.year, payroll.month - 1).toLocaleString('en-NG', { month: 'long', year: 'numeric' })} is now available for download.`,
                channels: ['in_app', 'email'],
                email: empUser.email,
            });
        }
    }
    // Mark loan repayment deducted
    await LoanRepayment_1.default.updateOne({ employeeId: payroll.employeeId, month: payroll.month, year: payroll.year, status: 'pending' }, { status: 'deducted', payrollId: payroll._id });
    res.json(payroll);
});
// ── DEDUCTION OVERRIDES ───────────────────────────────────────────────────────
router.get('/employees/:id/overrides', ...guard, async (req, res) => {
    const overrides = await EmployeeDeductionOverride_1.default.find({ employeeId: req.params.id });
    res.json(overrides);
});
router.post('/employees/:id/overrides', ...guard, async (req, res) => {
    const override = await EmployeeDeductionOverride_1.default.create({
        ...req.body,
        employeeId: req.params.id,
        createdBy: req.user._id,
    });
    res.status(201).json(override);
});
router.delete('/employees/:id/overrides/:oid', ...guard, async (_req, res) => {
    await EmployeeDeductionOverride_1.default.findByIdAndDelete(_req.params.oid);
    res.json({ message: 'Override deleted' });
});
// ── LOANS ─────────────────────────────────────────────────────────────────────
router.get('/loans', ...guard, async (req, res) => {
    const { status } = req.query;
    const filter = {};
    if (status)
        filter.status = status;
    const loans = await LoanApplication_1.default.find(filter)
        .populate('employeeId', 'firstName lastName employeeId')
        .sort({ createdAt: -1 });
    res.json(loans);
});
router.put('/loans/:id/approve', ...guard, async (req, res) => {
    const { disbursedAt } = req.body;
    const loan = await LoanApplication_1.default.findById(req.params.id).populate('employeeId');
    if (!loan)
        throw new errorHandler_1.AppError('Loan not found', 404);
    if (loan.status !== 'pending')
        throw new errorHandler_1.AppError('Loan already processed', 400);
    loan.status = 'active';
    loan.hrApprovedBy = req.user._id;
    loan.hrApprovedAt = new Date();
    loan.disbursedAt = disbursedAt ? new Date(disbursedAt) : new Date();
    await loan.save();
    // Auto-generate repayment schedule
    const startDate = new Date(loan.disbursedAt ?? new Date());
    let month = startDate.getMonth() + 2;
    let year = startDate.getFullYear();
    if (month > 12) {
        month = 1;
        year++;
    }
    for (let i = 0; i < loan.repaymentMonths; i++) {
        await LoanRepayment_1.default.create({
            loanId: loan._id,
            employeeId: loan.employeeId,
            month,
            year,
            amount: loan.monthlyDeduction,
            status: 'pending',
        });
        month++;
        if (month > 12) {
            month = 1;
            year++;
        }
    }
    const empDoc = loan.employeeId;
    await (0, notificationService_1.sendNotification)({
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
router.put('/loans/:id/reject', ...guard, async (req, res) => {
    const loan = await LoanApplication_1.default.findById(req.params.id).populate('employeeId');
    if (!loan)
        throw new errorHandler_1.AppError('Loan not found', 404);
    loan.status = 'rejected';
    loan.rejectionReason = req.body.reason;
    await loan.save();
    const empDoc = loan.employeeId;
    await (0, notificationService_1.sendNotification)({
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
router.get('/salary-advances', ...guard, async (req, res) => {
    const { status } = req.query;
    const filter = {};
    if (status)
        filter.status = status;
    const advances = await SalaryAdvance_1.default.find(filter)
        .populate('employeeId', 'firstName lastName employeeId basicSalary grossSalary')
        .sort({ createdAt: -1 });
    res.json(advances);
});
router.put('/salary-advances/:id/approve', ...guard, async (req, res) => {
    const { deductMonth, deductYear, splitMonths = 1 } = req.body;
    const advance = await SalaryAdvance_1.default.findById(req.params.id).populate('employeeId');
    if (!advance)
        throw new errorHandler_1.AppError('Advance not found', 404);
    if (advance.status !== 'pending')
        throw new errorHandler_1.AppError('Already processed', 400);
    advance.status = 'approved';
    advance.hrApprovedBy = req.user._id;
    advance.hrApprovedAt = new Date();
    advance.deductMonth = deductMonth;
    advance.deductYear = deductYear;
    advance.splitMonths = splitMonths;
    await advance.save();
    const empDoc = advance.employeeId;
    await (0, notificationService_1.sendNotification)({
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
router.put('/salary-advances/:id/reject', ...guard, async (req, res) => {
    const advance = await SalaryAdvance_1.default.findById(req.params.id).populate('employeeId');
    if (!advance)
        throw new errorHandler_1.AppError('Advance not found', 404);
    advance.status = 'rejected';
    advance.rejectionReason = req.body.reason;
    await advance.save();
    const empDoc = advance.employeeId;
    await (0, notificationService_1.sendNotification)({
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
router.get('/employees/:id/payrolls', ...guard, async (req, res) => {
    const payrolls = await Payroll_1.default.find({ employeeId: req.params.id }).sort({ year: -1, month: -1 });
    res.json(payrolls);
});
// ── BATCH PAYROLL APPROVE ─────────────────────────────────────────────────────
router.post('/payroll/approve', ...guard, async (req, res) => {
    const { month, year } = req.body;
    if (!month || !year)
        throw new errorHandler_1.AppError('Month and year required', 400);
    const drafts = await Payroll_1.default.find({ month, year, status: 'draft' }).populate('employeeId');
    if (drafts.length === 0)
        throw new errorHandler_1.AppError('No draft payrolls found for this period', 400);
    const generated = [];
    for (const payroll of drafts) {
        payroll.status = 'approved';
        payroll.approvedBy = req.user._id;
        payroll.approvedAt = new Date();
        await payroll.save();
        const emp = await Employee_1.default.findById(payroll.employeeId._id);
        if (emp) {
            const uploadDir = path_1.default.join(process.env.UPLOAD_DIR ?? 'uploads', 'payslips', emp._id.toString());
            const pdfPath = await (0, pdfService_1.generatePayslipPdf)(payroll, emp, uploadDir);
            const slip = await Payslip_1.default.create({ payrollId: payroll._id, employeeId: emp._id, pdfPath });
            await LoanRepayment_1.default.updateOne({ employeeId: emp._id, month, year, status: 'pending' }, { status: 'deducted', payrollId: payroll._id });
            const empUser = await User_1.default.findById(emp.userId);
            if (empUser) {
                await (0, notificationService_1.sendNotification)({
                    userId: empUser._id.toString(),
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
router.get('/jobs', ...guard, async (_req, res) => {
    const jobs = await Job_1.default.find().populate('department', 'name').sort({ createdAt: -1 });
    res.json(jobs);
});
router.post('/jobs', ...guard, async (req, res) => {
    const job = await Job_1.default.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(job);
});
router.put('/jobs/:id', ...guard, async (req, res) => {
    const job = await Job_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job)
        throw new errorHandler_1.AppError('Job not found', 404);
    res.json(job);
});
router.get('/jobs/:id/applicants', ...guard, async (req, res) => {
    const applicants = await Applicant_1.default.find({ jobId: req.params.id }).sort({ createdAt: -1 });
    res.json(applicants);
});
router.put('/applicants/:id/stage', ...guard, async (req, res) => {
    const applicant = await Applicant_1.default.findByIdAndUpdate(req.params.id, { stage: req.body.stage }, { new: true });
    if (!applicant)
        throw new errorHandler_1.AppError('Applicant not found', 404);
    // If hired, increment job count
    if (req.body.stage === 'hired') {
        await Job_1.default.findByIdAndUpdate(applicant.jobId, { $inc: { applicantCount: 0 } });
    }
    res.json(applicant);
});
// ── DOCUMENTS (HR VIEW) ───────────────────────────────────────────────────────
router.get('/documents', ...guard, async (_req, res) => {
    const docs = await Document_1.default.find()
        .populate('employeeId', 'firstName lastName employeeId')
        .sort({ uploadedAt: -1 });
    res.json(docs);
});
router.get('/documents/:id/download', ...guard, async (req, res) => {
    const doc = await Document_1.default.findById(req.params.id);
    if (!doc)
        throw new errorHandler_1.AppError('Document not found', 404);
    if (!fs_1.default.existsSync(doc.filePath))
        throw new errorHandler_1.AppError('File not found on server', 404);
    res.download(doc.filePath, doc.fileName);
});
router.put('/documents/:id/verify', ...guard, async (req, res) => {
    const doc = await Document_1.default.findByIdAndUpdate(req.params.id, { verifiedBy: req.user._id, verifiedAt: new Date() }, { new: true });
    if (!doc)
        throw new errorHandler_1.AppError('Document not found', 404);
    res.json(doc);
});
// ── INTEGRATIONS ──────────────────────────────────────────────────────────────
const integrationStore = new Map();
router.get('/integrations', ...guard, async (_req, res) => {
    res.json({ connected: Array.from(integrationStore.keys()) });
});
router.post('/integrations/:id/connect', ...guard, async (req, res) => {
    integrationStore.set(req.params.id, req.body);
    res.json({ message: `${req.params.id} connected successfully` });
});
router.post('/integrations/:id/disconnect', ...guard, async (req, res) => {
    integrationStore.delete(req.params.id);
    res.json({ message: `${req.params.id} disconnected` });
});
router.post('/integrations/:id/test', ...guard, async (req, res) => {
    if (!integrationStore.has(req.params.id))
        throw new errorHandler_1.AppError('Integration not connected', 400);
    res.json({ message: 'Connection test passed' });
});
// ── HR METRICS ────────────────────────────────────────────────────────────────
router.get('/metrics', ...guard, async (_req, res) => {
    const [totalEmployees, activeEmployees, departments, pendingLeaves, openJobs] = await Promise.all([
        Employee_1.default.countDocuments(),
        Employee_1.default.countDocuments({ isActive: true }),
        Department_1.default.countDocuments({ active: true }),
        LeaveRequest_1.default.countDocuments({ status: { $in: ['pending_manager', 'pending_hr'] } }),
        (await Promise.resolve().then(() => __importStar(require('../models/Job')))).default.countDocuments({ status: 'active' }),
    ]);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const payrollAgg = await Payroll_1.default.aggregate([
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
router.get('/metrics/departments', ...guard, async (_req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const depts = await Department_1.default.find({ active: true }).lean();
    const result = await Promise.all(depts.map(async (dept) => {
        const members = await Employee_1.default.find({ department: dept._id, isActive: true }, '_id');
        const memberIds = members.map(m => m._id);
        const onLeave = await (await Promise.resolve().then(() => __importStar(require('../models/LeaveRequest')))).default.countDocuments({
            employeeId: { $in: memberIds },
            status: 'approved',
            startDate: { $lte: today },
            endDate: { $gte: today },
        });
        const Attendance = (await Promise.resolve().then(() => __importStar(require('../models/Attendance')))).default;
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
router.get('/metrics/gender', ...guard, async (_req, res) => {
    const agg = await Employee_1.default.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$gender', value: { $sum: 1 } } },
    ]);
    const data = agg.map(a => ({ name: a._id ? (a._id.charAt(0).toUpperCase() + a._id.slice(1)) : 'Unknown', value: a.value }));
    res.json(data);
});
router.get('/metrics/leave-trend', ...guard, async (_req, res) => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ month: d.getMonth() + 1, year: d.getFullYear(), label: d.toLocaleString('en', { month: 'short' }) });
    }
    const LeaveRequest = (await Promise.resolve().then(() => __importStar(require('../models/LeaveRequest')))).default;
    const data = await Promise.all(months.map(async (m) => {
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
router.get('/roles', ...guard, async (_req, res) => {
    const users = await User_1.default.find({}, 'email username role active isFirstLogin employeeId createdAt')
        .populate({
        path: 'employeeId',
        select: 'firstName lastName employeeId position department',
        populate: { path: 'department', select: 'name' },
    })
        .sort({ createdAt: -1 });
    res.json(users);
});
router.put('/roles/:userId', ...guard, async (req, res) => {
    const { role, active } = req.body;
    const allowedRoles = ['employee', 'manager', 'hr_manager', 'super_admin'];
    if (role && !allowedRoles.includes(role))
        throw new errorHandler_1.AppError('Invalid role', 400);
    const update = {};
    if (role !== undefined)
        update.role = role;
    if (active !== undefined)
        update.active = active;
    const user = await User_1.default.findByIdAndUpdate(req.params.userId, update, { new: true })
        .populate({ path: 'employeeId', select: 'firstName lastName employeeId position' });
    if (!user)
        throw new errorHandler_1.AppError('User not found', 404);
    res.json(user);
});
// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
router.get('/notifications', ...guard, async (req, res) => {
    const notifications = await Notification_1.default.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);
    res.json(notifications);
});
exports.default = router;
//# sourceMappingURL=hr.js.map
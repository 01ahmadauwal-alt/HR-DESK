import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import Employee from '../models/Employee';
import Department from '../models/Department';
import LeaveRequest from '../models/LeaveRequest';
import Attendance from '../models/Attendance';
import Task from '../models/Task';
import User from '../models/User';
import { sendNotification } from '../services/notificationService';

const router = Router();
const guard = [authenticate, authorize('manager', 'hr_manager', 'super_admin')];

// ── TEAM ──────────────────────────────────────────────────────────────────────

router.get('/team', ...guard, async (req: AuthRequest, res: Response) => {
  const managerEmp = await Employee.findOne({ userId: req.user!._id });
  if (!managerEmp) throw new AppError('Manager profile not found', 404);

  const dept = await Department.findOne({
    $or: [{ managerId: managerEmp._id }, { hodId: managerEmp._id }],
  });
  if (!dept) return res.json([]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const members = await Employee.find({ _id: { $in: dept.memberIds }, isActive: true })
    .populate('department', 'name code');

  const teamWithStatus = await Promise.all(
    members.map(async (emp) => {
      const attendance = await Attendance.findOne({ employeeId: emp._id, date: today });
      const onLeave = await LeaveRequest.exists({
        employeeId: emp._id,
        status: 'approved',
        startDate: { $lte: today },
        endDate: { $gte: today },
      });

      let status: 'on_duty' | 'on_leave' | 'absent' = 'absent';
      if (onLeave) status = 'on_leave';
      else if (attendance?.checkIn) status = 'on_duty';

      return { ...emp.toObject(), todayStatus: status, attendance };
    })
  );

  res.json(teamWithStatus);
});

router.get('/team/:id', ...guard, async (req: AuthRequest, res: Response) => {
  const emp = await Employee.findById(req.params.id)
    .populate('department', 'name code');
  if (!emp) throw new AppError('Employee not found', 404);
  res.json(emp);
});

// ── LEAVE APPROVALS ───────────────────────────────────────────────────────────

router.get('/leaves/pending', ...guard, async (req: AuthRequest, res: Response) => {
  const managerEmp = await Employee.findOne({ userId: req.user!._id });
  if (!managerEmp) throw new AppError('Manager profile not found', 404);

  const dept = await Department.findOne({
    $or: [{ managerId: managerEmp._id }, { hodId: managerEmp._id }],
  });
  if (!dept) return res.json([]);

  const leaves = await LeaveRequest.find({
    employeeId: { $in: dept.memberIds },
    status: 'pending_manager',
  })
    .populate('employeeId', 'firstName lastName position employeeId')
    .sort({ createdAt: -1 });

  res.json(leaves);
});

router.put('/leaves/:id/approve', ...guard, async (req: AuthRequest, res: Response) => {
  const leave = await LeaveRequest.findById(req.params.id).populate('employeeId');
  if (!leave) throw new AppError('Leave request not found', 404);
  if (leave.status !== 'pending_manager') throw new AppError('Leave not at manager stage', 400);

  leave.status = 'pending_hr';
  leave.managerApprovalBy = req.user!._id as mongoose.Types.ObjectId;
  leave.managerApprovalAt = new Date();
  await leave.save();

  // Notify HR
  const hrUsers = await User.find({ role: 'hr_manager', active: true });
  for (const hr of hrUsers) {
    const empDoc = leave.employeeId as unknown as { firstName: string; lastName: string };
    await sendNotification({
      userId: hr._id!.toString(),
      type: 'leave_manager_approved',
      title: 'Leave Request Needs HR Approval',
      message: `${empDoc.firstName} ${empDoc.lastName}'s ${leave.type} leave request has been approved by the manager and requires your review.`,
      channels: ['in_app', 'email'],
      email: hr.email,
    });
  }

  // Notify employee
  const empDoc = leave.employeeId as unknown as { userId: string; email: string };
  await sendNotification({
    userId: empDoc.userId,
    type: 'leave_manager_approved',
    title: 'Leave Request Forwarded to HR',
    message: 'Your leave request has been approved by your manager and is now awaiting HR approval.',
    channels: ['in_app'],
    email: empDoc.email,
  });

  res.json(leave);
});

router.put('/leaves/:id/reject', ...guard, async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;
  const leave = await LeaveRequest.findById(req.params.id).populate('employeeId');
  if (!leave) throw new AppError('Leave request not found', 404);
  if (leave.status !== 'pending_manager') throw new AppError('Leave not at manager stage', 400);

  leave.status = 'rejected';
  leave.rejectedBy = req.user!._id as mongoose.Types.ObjectId;
  leave.rejectionReason = reason;
  await leave.save();

  const empDoc = leave.employeeId as unknown as { userId: string; email: string; phone: string };
  await sendNotification({
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

router.get('/tasks', ...guard, async (req: AuthRequest, res: Response) => {
  const managerEmp = await Employee.findOne({ userId: req.user!._id });
  if (!managerEmp) throw new AppError('Manager profile not found', 404);
  const tasks = await Task.find({ assignedBy: managerEmp._id })
    .populate('assignedTo.employeeId', 'firstName lastName avatar')
    .populate('department', 'name')
    .sort({ createdAt: -1 });
  res.json(tasks);
});

router.post('/tasks', ...guard, async (req: AuthRequest, res: Response) => {
  const managerEmp = await Employee.findOne({ userId: req.user!._id });
  if (!managerEmp) throw new AppError('Manager profile not found', 404);

  const { title, description, assignedTo, department, dueDate, priority, isOpenForCollaboration } = req.body;

  const assignees = (assignedTo as string[]).map((id) => ({
    employeeId: new mongoose.Types.ObjectId(id),
    status: 'pending' as const,
  }));

  const task = await Task.create({
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
  for (const assignee of assignedTo as string[]) {
    const emp = await Employee.findById(assignee).populate('userId');
    if (emp) {
      const empUser = emp.userId as unknown as { _id: string; email: string; phone: string };
      await sendNotification({
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

router.put('/tasks/:id', ...guard, async (req: AuthRequest, res: Response) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!task) throw new AppError('Task not found', 404);
  res.json(task);
});

// ── ATTENDANCE ────────────────────────────────────────────────────────────────

router.get('/attendance', ...guard, async (req: AuthRequest, res: Response) => {
  const managerEmp = await Employee.findOne({ userId: req.user!._id });
  if (!managerEmp) throw new AppError('Manager profile not found', 404);

  const dept = await Department.findOne({
    $or: [{ managerId: managerEmp._id }, { hodId: managerEmp._id }],
  });
  if (!dept) return res.json([]);

  const { startDate, endDate } = req.query;
  const filter: Record<string, unknown> = { employeeId: { $in: dept.memberIds } };
  if (startDate && endDate) {
    filter.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
  }

  const records = await Attendance.find(filter)
    .populate('employeeId', 'firstName lastName employeeId')
    .sort({ date: -1 });
  res.json(records);
});

// ── CALENDAR ──────────────────────────────────────────────────────────────────

router.get('/calendar', ...guard, async (req: AuthRequest, res: Response) => {
  const managerEmp = await Employee.findOne({ userId: req.user!._id });
  if (!managerEmp) throw new AppError('Manager profile not found', 404);

  const dept = await Department.findOne({
    $or: [{ managerId: managerEmp._id }, { hodId: managerEmp._id }],
  });

  const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
  const year  = parseInt(req.query.year  as string) || new Date().getFullYear();
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0, 23, 59, 59);

  const memberIds = dept?.memberIds ?? [];

  const [leaves, tasks] = await Promise.all([
    LeaveRequest.find({
      employeeId: { $in: memberIds },
      status: 'approved',
      startDate: { $lte: end },
      endDate:   { $gte: start },
    }).populate('employeeId', 'firstName lastName'),

    Task.find({
      assignedBy: managerEmp._id,
      dueDate: { $gte: start, $lte: end },
    }).populate('assignedTo.employeeId', 'firstName lastName'),
  ]);

  const events = [
    ...leaves.map((l) => {
      const emp = l.employeeId as unknown as { firstName: string; lastName: string };
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

export default router;

import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import Employee from '../models/Employee';
import Department from '../models/Department';
import LeaveRequest from '../models/LeaveRequest';
import Attendance from '../models/Attendance';

const router = Router();
const guard = [authenticate, authorize('super_admin')];

router.get('/departments', ...guard, async (_req: AuthRequest, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const depts = await Department.find({ active: true })
    .populate('hodId', 'firstName lastName position')
    .populate('managerId', 'firstName lastName position')
    .lean();

  const result = await Promise.all(depts.map(async (dept) => {
    const members = await Employee.find({ department: dept._id, isActive: true }, '_id');
    const memberIds = members.map(m => m._id);

    const [onLeave, onDutyRecords] = await Promise.all([
      LeaveRequest.countDocuments({
        employeeId: { $in: memberIds },
        status: 'approved',
        startDate: { $lte: today },
        endDate: { $gte: today },
      }),
      Attendance.countDocuments({
        employeeId: { $in: memberIds },
        date: today,
        status: { $in: ['present', 'late'] },
      }),
    ]);

    return {
      _id: dept._id,
      name: dept.name,
      code: dept.code,
      headcount: memberIds.length,
      onDuty: onDutyRecords,
      onLeave,
      absent: Math.max(0, memberIds.length - onDutyRecords - onLeave),
      hod: dept.hodId,
      manager: dept.managerId,
    };
  }));

  res.json(result);
});

router.get('/overview', ...guard, async (_req: AuthRequest, res: Response) => {
  const [totalEmployees, activeEmployees, departments] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ isActive: true }),
    Department.countDocuments({ active: true }),
  ]);
  res.json({ totalEmployees, activeEmployees, departments });
});

export default router;

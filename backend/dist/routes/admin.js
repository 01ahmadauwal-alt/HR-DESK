"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const Employee_1 = __importDefault(require("../models/Employee"));
const Department_1 = __importDefault(require("../models/Department"));
const LeaveRequest_1 = __importDefault(require("../models/LeaveRequest"));
const Attendance_1 = __importDefault(require("../models/Attendance"));
const router = (0, express_1.Router)();
const guard = [auth_1.authenticate, (0, auth_1.authorize)('super_admin')];
router.get('/departments', ...guard, async (_req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const depts = await Department_1.default.find({ active: true })
        .populate('hodId', 'firstName lastName position')
        .populate('managerId', 'firstName lastName position')
        .lean();
    const result = await Promise.all(depts.map(async (dept) => {
        const members = await Employee_1.default.find({ department: dept._id, isActive: true }, '_id');
        const memberIds = members.map(m => m._id);
        const [onLeave, onDutyRecords] = await Promise.all([
            LeaveRequest_1.default.countDocuments({
                employeeId: { $in: memberIds },
                status: 'approved',
                startDate: { $lte: today },
                endDate: { $gte: today },
            }),
            Attendance_1.default.countDocuments({
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
router.get('/overview', ...guard, async (_req, res) => {
    const [totalEmployees, activeEmployees, departments] = await Promise.all([
        Employee_1.default.countDocuments(),
        Employee_1.default.countDocuments({ isActive: true }),
        Department_1.default.countDocuments({ active: true }),
    ]);
    res.json({ totalEmployees, activeEmployees, departments });
});
exports.default = router;
//# sourceMappingURL=admin.js.map
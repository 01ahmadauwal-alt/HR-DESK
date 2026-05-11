import mongoose, { Document } from 'mongoose';
export type LeaveStatus = 'pending_manager' | 'pending_hr' | 'approved' | 'rejected';
export type LeaveType = 'annual' | 'sick' | 'casual' | 'maternity' | 'paternity' | 'study' | 'unpaid';
export interface ILeaveRequest extends Document {
    employeeId: mongoose.Types.ObjectId;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    days: number;
    reason: string;
    status: LeaveStatus;
    managerApprovalBy?: mongoose.Types.ObjectId;
    managerApprovalAt?: Date;
    hrApprovalBy?: mongoose.Types.ObjectId;
    hrApprovalAt?: Date;
    rejectionReason?: string;
    rejectedBy?: mongoose.Types.ObjectId;
    attachments?: string[];
}
declare const _default: mongoose.Model<ILeaveRequest, {}, {}, {}, mongoose.Document<unknown, {}, ILeaveRequest, {}, {}> & ILeaveRequest & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=LeaveRequest.d.ts.map
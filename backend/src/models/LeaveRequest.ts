import mongoose, { Document, Schema } from 'mongoose';

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

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    type: {
      type: String,
      enum: ['annual', 'sick', 'casual', 'maternity', 'paternity', 'study', 'unpaid'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending_manager', 'pending_hr', 'approved', 'rejected'],
      default: 'pending_manager',
    },
    managerApprovalBy: { type: Schema.Types.ObjectId, ref: 'User' },
    managerApprovalAt: { type: Date },
    hrApprovalBy: { type: Schema.Types.ObjectId, ref: 'User' },
    hrApprovalAt: { type: Date },
    rejectionReason: { type: String },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

LeaveRequestSchema.index({ employeeId: 1, status: 1 });

export default mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);

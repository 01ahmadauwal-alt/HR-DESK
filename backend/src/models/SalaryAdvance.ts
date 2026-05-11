import mongoose, { Document, Schema } from 'mongoose';

export interface ISalaryAdvance extends Document {
  employeeId: mongoose.Types.ObjectId;
  amount: number;
  reason: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  hrApprovedBy?: mongoose.Types.ObjectId;
  hrApprovedAt?: Date;
  deductMonth?: number;
  deductYear?: number;
  splitMonths?: number;
  payrollId?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  amountRecovered: number;
}

const SalaryAdvanceSchema = new Schema<ISalaryAdvance>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    amount: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true },
    requestedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    hrApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    hrApprovedAt: { type: Date },
    deductMonth: { type: Number, min: 1, max: 12 },
    deductYear: { type: Number },
    splitMonths: { type: Number, default: 1 },
    payrollId: { type: Schema.Types.ObjectId, ref: 'Payroll' },
    rejectionReason: { type: String },
    amountRecovered: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ISalaryAdvance>('SalaryAdvance', SalaryAdvanceSchema);

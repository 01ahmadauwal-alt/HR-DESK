import mongoose, { Document, Schema } from 'mongoose';

export type LoanStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'completed';

export interface ILoanApplication extends Document {
  employeeId: mongoose.Types.ObjectId;
  amount: number;
  purpose: string;
  repaymentMonths: number;
  monthlyDeduction: number;
  interestRate: number;
  totalRepayable: number;
  amountRepaid: number;
  status: LoanStatus;
  hrApprovedBy?: mongoose.Types.ObjectId;
  hrApprovedAt?: Date;
  disbursedAt?: Date;
  rejectionReason?: string;
}

const LoanApplicationSchema = new Schema<ILoanApplication>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    amount: { type: Number, required: true, min: 1 },
    purpose: { type: String, required: true },
    repaymentMonths: { type: Number, required: true, min: 1 },
    monthlyDeduction: { type: Number, required: true },
    interestRate: { type: Number, default: 0 },
    totalRepayable: { type: Number, required: true },
    amountRepaid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'active', 'completed'],
      default: 'pending',
    },
    hrApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    hrApprovedAt: { type: Date },
    disbursedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ILoanApplication>('LoanApplication', LoanApplicationSchema);

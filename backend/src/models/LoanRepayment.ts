import mongoose, { Document, Schema } from 'mongoose';

export interface ILoanRepayment extends Document {
  loanId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  amount: number;
  payrollId?: mongoose.Types.ObjectId;
  status: 'pending' | 'deducted';
}

const LoanRepaymentSchema = new Schema<ILoanRepayment>(
  {
    loanId: { type: Schema.Types.ObjectId, ref: 'LoanApplication', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    amount: { type: Number, required: true },
    payrollId: { type: Schema.Types.ObjectId, ref: 'Payroll' },
    status: { type: String, enum: ['pending', 'deducted'], default: 'pending' },
  },
  { timestamps: true }
);

LoanRepaymentSchema.index({ loanId: 1, month: 1, year: 1 });
LoanRepaymentSchema.index({ employeeId: 1, status: 1 });

export default mongoose.model<ILoanRepayment>('LoanRepayment', LoanRepaymentSchema);

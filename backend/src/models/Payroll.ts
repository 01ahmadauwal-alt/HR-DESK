import mongoose, { Document, Schema } from 'mongoose';

export interface IPayroll extends Document {
  employeeId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: { name: string; amount: number }[];
  grossSalary: number;
  pensionEmployee: number;
  pensionEmployer: number;
  taxableIncome: number;
  paye: number;
  nhf: number;
  lifeInsurance: number;
  healthInsurance: number;
  groupLifeAssurance: number;
  unionDue: number;
  cooperative: number;
  staffWelfareLevy: number;
  loanRepayment: number;
  salaryAdvanceRecovery: number;
  customDeductions: { name: string; amount: number }[];
  totalDeductions: number;
  netPay: number;
  status: 'draft' | 'approved' | 'paid';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  paidAt?: Date;
}

const PayrollSchema = new Schema<IPayroll>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    basicSalary: { type: Number, required: true },
    housingAllowance: { type: Number, default: 0 },
    transportAllowance: { type: Number, default: 0 },
    otherAllowances: [{ name: String, amount: Number }],
    grossSalary: { type: Number, required: true },
    pensionEmployee: { type: Number, default: 0 },
    pensionEmployer: { type: Number, default: 0 },
    taxableIncome: { type: Number, default: 0 },
    paye: { type: Number, default: 0 },
    nhf: { type: Number, default: 0 },
    lifeInsurance: { type: Number, default: 0 },
    healthInsurance: { type: Number, default: 0 },
    groupLifeAssurance: { type: Number, default: 0 },
    unionDue: { type: Number, default: 0 },
    cooperative: { type: Number, default: 0 },
    staffWelfareLevy: { type: Number, default: 0 },
    loanRepayment: { type: Number, default: 0 },
    salaryAdvanceRecovery: { type: Number, default: 0 },
    customDeductions: [{ name: String, amount: Number }],
    totalDeductions: { type: Number, default: 0 },
    netPay: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'approved', 'paid'], default: 'draft' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

PayrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model<IPayroll>('Payroll', PayrollSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IPayslip extends Document {
  payrollId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  generatedAt: Date;
  pdfPath: string;
  downloadCount: number;
}

const PayslipSchema = new Schema<IPayslip>(
  {
    payrollId: { type: Schema.Types.ObjectId, ref: 'Payroll', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    generatedAt: { type: Date, default: Date.now },
    pdfPath: { type: String, required: true },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IPayslip>('Payslip', PayslipSchema);

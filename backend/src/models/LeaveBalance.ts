import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaveBalance extends Document {
  employeeId: mongoose.Types.ObjectId;
  year: number;
  annual: number;
  sick: number;
  casual: number;
  maternity: number;
  paternity: number;
  study: number;
  usedAnnual: number;
  usedSick: number;
  usedCasual: number;
  usedMaternity: number;
  usedPaternity: number;
  usedStudy: number;
}

const LeaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    year: { type: Number, required: true },
    annual: { type: Number, default: 21 },
    sick: { type: Number, default: 10 },
    casual: { type: Number, default: 5 },
    maternity: { type: Number, default: 84 },
    paternity: { type: Number, default: 5 },
    study: { type: Number, default: 0 },
    usedAnnual: { type: Number, default: 0 },
    usedSick: { type: Number, default: 0 },
    usedCasual: { type: Number, default: 0 },
    usedMaternity: { type: Number, default: 0 },
    usedPaternity: { type: Number, default: 0 },
    usedStudy: { type: Number, default: 0 },
  },
  { timestamps: true }
);

LeaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

export default mongoose.model<ILeaveBalance>('LeaveBalance', LeaveBalanceSchema);

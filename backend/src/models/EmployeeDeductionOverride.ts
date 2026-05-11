import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployeeDeductionOverride extends Document {
  employeeId: mongoose.Types.ObjectId;
  deductionCode: string;
  deductionName: string;
  overrideValue: number;
  reason: string;
  activeFrom: Date;
  activeTo?: Date;
  createdBy: mongoose.Types.ObjectId;
}

const EmployeeDeductionOverrideSchema = new Schema<IEmployeeDeductionOverride>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    deductionCode: { type: String, required: true, uppercase: true },
    deductionName: { type: String, required: true },
    overrideValue: { type: Number, required: true },
    reason: { type: String, required: true },
    activeFrom: { type: Date, required: true },
    activeTo: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

EmployeeDeductionOverrideSchema.index({ employeeId: 1, deductionCode: 1 });

export default mongoose.model<IEmployeeDeductionOverride>(
  'EmployeeDeductionOverride',
  EmployeeDeductionOverrideSchema
);

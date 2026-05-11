import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  managerId?: mongoose.Types.ObjectId;
  hodId?: mongoose.Types.ObjectId;
  memberIds: mongoose.Types.ObjectId[];
  company?: mongoose.Types.ObjectId;
  description?: string;
  active: boolean;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    hodId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    memberIds: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
    description: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDepartment>('Department', DepartmentSchema);

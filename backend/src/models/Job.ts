import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  title: string;
  department?: mongoose.Types.ObjectId;
  description: string;
  requirements: string[];
  responsibilities: string[];
  type: 'full_time' | 'part_time' | 'contract' | 'intern';
  level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  location: string;
  salaryRange: { min: number; max: number };
  deadline?: Date;
  status: 'draft' | 'active' | 'closed';
  applicantCount: number;
  createdBy: mongoose.Types.ObjectId;
  company?: mongoose.Types.ObjectId;
}

const JobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    responsibilities: [{ type: String }],
    type: { type: String, enum: ['full_time', 'part_time', 'contract', 'intern'], default: 'full_time' },
    level: { type: String, enum: ['entry', 'mid', 'senior', 'lead', 'executive'], default: 'mid' },
    location: { type: String, default: 'Lagos, Nigeria' },
    salaryRange: { min: { type: Number, default: 0 }, max: { type: Number, default: 0 } },
    deadline: { type: Date },
    status: { type: String, enum: ['draft', 'active', 'closed'], default: 'draft' },
    applicantCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
  },
  { timestamps: true }
);

export default mongoose.model<IJob>('Job', JobSchema);

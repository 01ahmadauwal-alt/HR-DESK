import mongoose, { Document, Schema } from 'mongoose';

export type ApplicantStage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface IInterview {
  scheduledAt: Date;
  interviewer?: mongoose.Types.ObjectId;
  type: 'phone' | 'video' | 'onsite';
  status: 'scheduled' | 'completed' | 'cancelled';
  feedback?: string;
  rating?: number;
}

export interface IApplicant extends Document {
  jobId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resume?: string;
  coverLetter?: string;
  stage: ApplicantStage;
  interviews: IInterview[];
  notes?: string;
  source?: string;
  linkedIn?: string;
}

const InterviewSchema = new Schema<IInterview>(
  {
    scheduledAt: Date,
    interviewer: { type: Schema.Types.ObjectId, ref: 'Employee' },
    type: { type: String, enum: ['phone', 'video', 'onsite'], default: 'video' },
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
    feedback: String,
    rating: { type: Number, min: 1, max: 5 },
  },
  { _id: true, timestamps: true }
);

const ApplicantSchema = new Schema<IApplicant>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    resume: { type: String },
    coverLetter: { type: String },
    stage: {
      type: String,
      enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'],
      default: 'applied',
    },
    interviews: [InterviewSchema],
    notes: { type: String },
    source: { type: String },
    linkedIn: { type: String },
  },
  { timestamps: true }
);

ApplicantSchema.index({ jobId: 1, stage: 1 });

export default mongoose.model<IApplicant>('Applicant', ApplicantSchema);

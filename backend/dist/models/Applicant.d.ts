import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IApplicant, {}, {}, {}, mongoose.Document<unknown, {}, IApplicant, {}, {}> & IApplicant & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Applicant.d.ts.map
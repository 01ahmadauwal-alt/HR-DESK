import mongoose, { Document } from 'mongoose';
export interface IJob extends Document {
    title: string;
    department?: mongoose.Types.ObjectId;
    description: string;
    requirements: string[];
    responsibilities: string[];
    type: 'full_time' | 'part_time' | 'contract' | 'intern';
    level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
    location: string;
    salaryRange: {
        min: number;
        max: number;
    };
    deadline?: Date;
    status: 'draft' | 'active' | 'closed';
    applicantCount: number;
    createdBy: mongoose.Types.ObjectId;
    company?: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<IJob, {}, {}, {}, mongoose.Document<unknown, {}, IJob, {}, {}> & IJob & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Job.d.ts.map
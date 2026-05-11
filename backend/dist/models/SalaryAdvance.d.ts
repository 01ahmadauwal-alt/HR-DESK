import mongoose, { Document } from 'mongoose';
export interface ISalaryAdvance extends Document {
    employeeId: mongoose.Types.ObjectId;
    amount: number;
    reason: string;
    requestedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
    hrApprovedBy?: mongoose.Types.ObjectId;
    hrApprovedAt?: Date;
    deductMonth?: number;
    deductYear?: number;
    splitMonths?: number;
    payrollId?: mongoose.Types.ObjectId;
    rejectionReason?: string;
    amountRecovered: number;
}
declare const _default: mongoose.Model<ISalaryAdvance, {}, {}, {}, mongoose.Document<unknown, {}, ISalaryAdvance, {}, {}> & ISalaryAdvance & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=SalaryAdvance.d.ts.map
import mongoose, { Document } from 'mongoose';
export type LoanStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
export interface ILoanApplication extends Document {
    employeeId: mongoose.Types.ObjectId;
    amount: number;
    purpose: string;
    repaymentMonths: number;
    monthlyDeduction: number;
    interestRate: number;
    totalRepayable: number;
    amountRepaid: number;
    status: LoanStatus;
    hrApprovedBy?: mongoose.Types.ObjectId;
    hrApprovedAt?: Date;
    disbursedAt?: Date;
    rejectionReason?: string;
}
declare const _default: mongoose.Model<ILoanApplication, {}, {}, {}, mongoose.Document<unknown, {}, ILoanApplication, {}, {}> & ILoanApplication & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=LoanApplication.d.ts.map
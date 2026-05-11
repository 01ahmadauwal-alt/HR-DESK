import mongoose, { Document } from 'mongoose';
export interface ILoanRepayment extends Document {
    loanId: mongoose.Types.ObjectId;
    employeeId: mongoose.Types.ObjectId;
    month: number;
    year: number;
    amount: number;
    payrollId?: mongoose.Types.ObjectId;
    status: 'pending' | 'deducted';
}
declare const _default: mongoose.Model<ILoanRepayment, {}, {}, {}, mongoose.Document<unknown, {}, ILoanRepayment, {}, {}> & ILoanRepayment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=LoanRepayment.d.ts.map
import mongoose, { Document } from 'mongoose';
export interface IPayroll extends Document {
    employeeId: mongoose.Types.ObjectId;
    month: number;
    year: number;
    basicSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    otherAllowances: {
        name: string;
        amount: number;
    }[];
    grossSalary: number;
    pensionEmployee: number;
    pensionEmployer: number;
    taxableIncome: number;
    paye: number;
    nhf: number;
    lifeInsurance: number;
    healthInsurance: number;
    groupLifeAssurance: number;
    unionDue: number;
    cooperative: number;
    staffWelfareLevy: number;
    loanRepayment: number;
    salaryAdvanceRecovery: number;
    customDeductions: {
        name: string;
        amount: number;
    }[];
    totalDeductions: number;
    netPay: number;
    status: 'draft' | 'approved' | 'paid';
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    paidAt?: Date;
}
declare const _default: mongoose.Model<IPayroll, {}, {}, {}, mongoose.Document<unknown, {}, IPayroll, {}, {}> & IPayroll & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Payroll.d.ts.map
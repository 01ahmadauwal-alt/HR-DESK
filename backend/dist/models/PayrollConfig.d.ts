import mongoose, { Document } from 'mongoose';
export interface ITaxBracket {
    min: number;
    max: number | null;
    rate: number;
}
export interface IDeductionConfig {
    name: string;
    code: string;
    type: 'fixed' | 'percentage';
    value: number;
    appliesTo: 'all' | 'specific';
    taxRelief: boolean;
    active: boolean;
}
export interface IAllowanceConfig {
    name: string;
    type: 'fixed' | 'percentage';
    value: number;
    taxable: boolean;
    active: boolean;
}
export interface IPayrollConfig extends Document {
    company?: mongoose.Types.ObjectId;
    taxBrackets: ITaxBracket[];
    pensionEmployeeRate: number;
    pensionEmployerRate: number;
    nhfRate: number;
    nhfEnabled: boolean;
    lifeInsuranceRate: number;
    lifeInsuranceEnabled: boolean;
    healthInsuranceEnabled: boolean;
    healthInsuranceAmount: number;
    groupLifeAssuranceRate: number;
    groupLifeAssuranceEnabled: boolean;
    unionDueEnabled: boolean;
    unionDueAmount: number;
    cooperativeEnabled: boolean;
    staffWelfareLevyEnabled: boolean;
    staffWelfareLevyAmount: number;
    loanEnabled: boolean;
    maxLoanAmount: number;
    maxRepaymentMonths: number;
    loanInterestRate: number;
    eligibilityMonths: number;
    salaryAdvanceEnabled: boolean;
    maxAdvancePercent: number;
    maxAdvancePerYear: number;
    allowances: IAllowanceConfig[];
    deductions: IDeductionConfig[];
}
declare const _default: mongoose.Model<IPayrollConfig, {}, {}, {}, mongoose.Document<unknown, {}, IPayrollConfig, {}, {}> & IPayrollConfig & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=PayrollConfig.d.ts.map
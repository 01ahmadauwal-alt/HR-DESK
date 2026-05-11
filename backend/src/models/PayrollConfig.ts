import mongoose, { Document, Schema } from 'mongoose';

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

const TaxBracketSchema = new Schema<ITaxBracket>(
  { min: Number, max: { type: Number, default: null }, rate: Number },
  { _id: false }
);

const DeductionConfigSchema = new Schema<IDeductionConfig>(
  {
    name: String,
    code: { type: String, uppercase: true },
    type: { type: String, enum: ['fixed', 'percentage'] },
    value: Number,
    appliesTo: { type: String, enum: ['all', 'specific'], default: 'all' },
    taxRelief: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

const AllowanceConfigSchema = new Schema<IAllowanceConfig>(
  {
    name: String,
    type: { type: String, enum: ['fixed', 'percentage'] },
    value: Number,
    taxable: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

const PayrollConfigSchema = new Schema<IPayrollConfig>(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
    taxBrackets: {
      type: [TaxBracketSchema],
      default: [
        { min: 0, max: 300000, rate: 7 },
        { min: 300001, max: 600000, rate: 11 },
        { min: 600001, max: 1100000, rate: 15 },
        { min: 1100001, max: 1600000, rate: 19 },
        { min: 1600001, max: 3200000, rate: 21 },
        { min: 3200001, max: null, rate: 24 },
      ],
    },
    pensionEmployeeRate: { type: Number, default: 8 },
    pensionEmployerRate: { type: Number, default: 10 },
    nhfRate: { type: Number, default: 2.5 },
    nhfEnabled: { type: Boolean, default: true },
    lifeInsuranceRate: { type: Number, default: 0 },
    lifeInsuranceEnabled: { type: Boolean, default: false },
    healthInsuranceEnabled: { type: Boolean, default: false },
    healthInsuranceAmount: { type: Number, default: 0 },
    groupLifeAssuranceRate: { type: Number, default: 0 },
    groupLifeAssuranceEnabled: { type: Boolean, default: false },
    unionDueEnabled: { type: Boolean, default: false },
    unionDueAmount: { type: Number, default: 0 },
    cooperativeEnabled: { type: Boolean, default: false },
    staffWelfareLevyEnabled: { type: Boolean, default: false },
    staffWelfareLevyAmount: { type: Number, default: 0 },
    loanEnabled: { type: Boolean, default: true },
    maxLoanAmount: { type: Number, default: 500000 },
    maxRepaymentMonths: { type: Number, default: 12 },
    loanInterestRate: { type: Number, default: 0 },
    eligibilityMonths: { type: Number, default: 6 },
    salaryAdvanceEnabled: { type: Boolean, default: true },
    maxAdvancePercent: { type: Number, default: 50 },
    maxAdvancePerYear: { type: Number, default: 2 },
    allowances: { type: [AllowanceConfigSchema], default: [] },
    deductions: { type: [DeductionConfigSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IPayrollConfig>('PayrollConfig', PayrollConfigSchema);

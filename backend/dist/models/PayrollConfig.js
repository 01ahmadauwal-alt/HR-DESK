"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const TaxBracketSchema = new mongoose_1.Schema({ min: Number, max: { type: Number, default: null }, rate: Number }, { _id: false });
const DeductionConfigSchema = new mongoose_1.Schema({
    name: String,
    code: { type: String, uppercase: true },
    type: { type: String, enum: ['fixed', 'percentage'] },
    value: Number,
    appliesTo: { type: String, enum: ['all', 'specific'], default: 'all' },
    taxRelief: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
}, { _id: false });
const AllowanceConfigSchema = new mongoose_1.Schema({
    name: String,
    type: { type: String, enum: ['fixed', 'percentage'] },
    value: Number,
    taxable: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
}, { _id: false });
const PayrollConfigSchema = new mongoose_1.Schema({
    company: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company' },
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
}, { timestamps: true });
exports.default = mongoose_1.default.model('PayrollConfig', PayrollConfigSchema);
//# sourceMappingURL=PayrollConfig.js.map
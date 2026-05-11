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
const LoanApplicationSchema = new mongoose_1.Schema({
    employeeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Employee', required: true },
    amount: { type: Number, required: true, min: 1 },
    purpose: { type: String, required: true },
    repaymentMonths: { type: Number, required: true, min: 1 },
    monthlyDeduction: { type: Number, required: true },
    interestRate: { type: Number, default: 0 },
    totalRepayable: { type: Number, required: true },
    amountRepaid: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'active', 'completed'],
        default: 'pending',
    },
    hrApprovedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    hrApprovedAt: { type: Date },
    disbursedAt: { type: Date },
    rejectionReason: { type: String },
}, { timestamps: true });
exports.default = mongoose_1.default.model('LoanApplication', LoanApplicationSchema);
//# sourceMappingURL=LoanApplication.js.map
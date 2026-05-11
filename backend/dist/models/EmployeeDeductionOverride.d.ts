import mongoose, { Document } from 'mongoose';
export interface IEmployeeDeductionOverride extends Document {
    employeeId: mongoose.Types.ObjectId;
    deductionCode: string;
    deductionName: string;
    overrideValue: number;
    reason: string;
    activeFrom: Date;
    activeTo?: Date;
    createdBy: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<IEmployeeDeductionOverride, {}, {}, {}, mongoose.Document<unknown, {}, IEmployeeDeductionOverride, {}, {}> & IEmployeeDeductionOverride & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=EmployeeDeductionOverride.d.ts.map
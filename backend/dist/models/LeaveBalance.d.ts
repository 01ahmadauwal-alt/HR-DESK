import mongoose, { Document } from 'mongoose';
export interface ILeaveBalance extends Document {
    employeeId: mongoose.Types.ObjectId;
    year: number;
    annual: number;
    sick: number;
    casual: number;
    maternity: number;
    paternity: number;
    study: number;
    usedAnnual: number;
    usedSick: number;
    usedCasual: number;
    usedMaternity: number;
    usedPaternity: number;
    usedStudy: number;
}
declare const _default: mongoose.Model<ILeaveBalance, {}, {}, {}, mongoose.Document<unknown, {}, ILeaveBalance, {}, {}> & ILeaveBalance & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=LeaveBalance.d.ts.map
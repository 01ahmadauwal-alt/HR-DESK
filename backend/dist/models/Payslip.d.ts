import mongoose, { Document } from 'mongoose';
export interface IPayslip extends Document {
    payrollId: mongoose.Types.ObjectId;
    employeeId: mongoose.Types.ObjectId;
    generatedAt: Date;
    pdfPath: string;
    downloadCount: number;
}
declare const _default: mongoose.Model<IPayslip, {}, {}, {}, mongoose.Document<unknown, {}, IPayslip, {}, {}> & IPayslip & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Payslip.d.ts.map
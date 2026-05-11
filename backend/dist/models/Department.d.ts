import mongoose, { Document } from 'mongoose';
export interface IDepartment extends Document {
    name: string;
    code: string;
    managerId?: mongoose.Types.ObjectId;
    hodId?: mongoose.Types.ObjectId;
    memberIds: mongoose.Types.ObjectId[];
    company?: mongoose.Types.ObjectId;
    description?: string;
    active: boolean;
}
declare const _default: mongoose.Model<IDepartment, {}, {}, {}, mongoose.Document<unknown, {}, IDepartment, {}, {}> & IDepartment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Department.d.ts.map
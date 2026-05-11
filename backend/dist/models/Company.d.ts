import mongoose, { Document } from 'mongoose';
export interface ICompany extends Document {
    name: string;
    logo?: string;
    address?: string;
    industry?: string;
    taxId?: string;
    phone?: string;
    email?: string;
    website?: string;
    createdAt: Date;
}
declare const _default: mongoose.Model<ICompany, {}, {}, {}, mongoose.Document<unknown, {}, ICompany, {}, {}> & ICompany & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Company.d.ts.map
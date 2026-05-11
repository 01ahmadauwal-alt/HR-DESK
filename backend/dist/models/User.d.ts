import mongoose, { Document } from 'mongoose';
export type UserRole = 'super_admin' | 'hr_manager' | 'manager' | 'employee';
export interface IUser extends Document {
    email: string;
    phone: string;
    username: string;
    passwordHash: string;
    role: UserRole;
    employeeId?: mongoose.Types.ObjectId;
    company?: mongoose.Types.ObjectId;
    isFirstLogin: boolean;
    refreshToken?: string;
    active: boolean;
    avatar?: string;
    comparePassword(candidate: string): Promise<boolean>;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map
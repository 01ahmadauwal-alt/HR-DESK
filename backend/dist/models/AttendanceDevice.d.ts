import mongoose, { Document } from 'mongoose';
export interface IAttendanceDevice extends Document {
    name: string;
    deviceType: string;
    apiEndpoint: string;
    apiKey: string;
    secret?: string;
    syncFrequency: number;
    status: 'active' | 'inactive' | 'error';
    lastSynced?: Date;
    company?: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<IAttendanceDevice, {}, {}, {}, mongoose.Document<unknown, {}, IAttendanceDevice, {}, {}> & IAttendanceDevice & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=AttendanceDevice.d.ts.map
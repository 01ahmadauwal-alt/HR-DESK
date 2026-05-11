import mongoose, { Document } from 'mongoose';
export interface IAttendance extends Document {
    employeeId: mongoose.Types.ObjectId;
    date: Date;
    checkIn?: Date;
    checkOut?: Date;
    hoursWorked?: number;
    status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
    source: 'device' | 'manual';
    deviceId?: mongoose.Types.ObjectId;
    notes?: string;
    modifiedBy?: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<IAttendance, {}, {}, {}, mongoose.Document<unknown, {}, IAttendance, {}, {}> & IAttendance & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Attendance.d.ts.map
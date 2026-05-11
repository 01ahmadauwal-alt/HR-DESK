import mongoose, { Document, Schema } from 'mongoose';

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

const AttendanceSchema = new Schema<IAttendance>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    hoursWorked: { type: Number },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half_day', 'on_leave'],
      default: 'absent',
    },
    source: { type: String, enum: ['device', 'manual'], default: 'manual' },
    deviceId: { type: Schema.Types.ObjectId, ref: 'AttendanceDevice' },
    notes: { type: String },
    modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1 });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);

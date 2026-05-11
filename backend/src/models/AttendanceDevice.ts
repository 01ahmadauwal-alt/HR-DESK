import mongoose, { Document, Schema } from 'mongoose';

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

const AttendanceDeviceSchema = new Schema<IAttendanceDevice>(
  {
    name: { type: String, required: true, trim: true },
    deviceType: { type: String, required: true },
    apiEndpoint: { type: String, required: true },
    apiKey: { type: String, required: true },
    secret: { type: String },
    syncFrequency: { type: Number, default: 30 },
    status: { type: String, enum: ['active', 'inactive', 'error'], default: 'active' },
    lastSynced: { type: Date },
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
  },
  { timestamps: true }
);

export default mongoose.model<IAttendanceDevice>('AttendanceDevice', AttendanceDeviceSchema);

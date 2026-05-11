import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'leave_submitted' | 'leave_manager_approved' | 'leave_hr_approved'
  | 'leave_rejected' | 'task_assigned' | 'task_completed' | 'collaboration_invite'
  | 'collaboration_response' | 'loan_approved' | 'loan_rejected'
  | 'advance_approved' | 'advance_rejected' | 'payslip_ready' | 'general';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  channels: ('in_app' | 'email' | 'whatsapp')[];
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    channels: [{ type: String, enum: ['in_app', 'email', 'whatsapp'] }],
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);

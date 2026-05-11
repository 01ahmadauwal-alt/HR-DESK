import mongoose, { Document } from 'mongoose';
export type NotificationType = 'leave_submitted' | 'leave_manager_approved' | 'leave_hr_approved' | 'leave_rejected' | 'task_assigned' | 'task_completed' | 'collaboration_invite' | 'collaboration_response' | 'loan_approved' | 'loan_rejected' | 'advance_approved' | 'advance_rejected' | 'payslip_ready' | 'general';
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
declare const _default: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, {}> & INotification & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Notification.d.ts.map
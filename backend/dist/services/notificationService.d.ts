import { NotificationType } from '../models/Notification';
interface NotifyOptions {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    channels?: ('in_app' | 'email' | 'whatsapp')[];
    email?: string;
    phone?: string;
}
export declare function sendNotification(opts: NotifyOptions): Promise<void>;
export {};
//# sourceMappingURL=notificationService.d.ts.map
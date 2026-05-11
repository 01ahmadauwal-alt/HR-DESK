"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
const nodemailer_1 = __importDefault(require("nodemailer"));
const twilio_1 = __importDefault(require("twilio"));
const Notification_1 = __importDefault(require("../models/Notification"));
const logger_1 = __importDefault(require("../utils/logger"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;
async function sendNotification(opts) {
    const channels = opts.channels ?? ['in_app'];
    if (channels.includes('in_app')) {
        await Notification_1.default.create({
            userId: opts.userId,
            type: opts.type,
            title: opts.title,
            message: opts.message,
            data: opts.data,
            read: false,
            channels,
        });
    }
    if (channels.includes('email') && opts.email) {
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: opts.email,
                subject: opts.title,
                html: buildEmailHtml(opts.title, opts.message),
            });
        }
        catch (err) {
            logger_1.default.error('Email send failed', err);
        }
    }
    if (channels.includes('whatsapp') && opts.phone && twilioClient) {
        try {
            const formattedPhone = opts.phone.startsWith('+') ? opts.phone : `+234${opts.phone.replace(/^0/, '')}`;
            await twilioClient.messages.create({
                from: process.env.TWILIO_WHATSAPP_FROM,
                to: `whatsapp:${formattedPhone}`,
                body: `*${opts.title}*\n\n${opts.message}`,
            });
        }
        catch (err) {
            logger_1.default.error('WhatsApp send failed', err);
        }
    }
}
function buildEmailHtml(title, message) {
    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: Inter, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
      .card { background: #fff; border-radius: 12px; padding: 32px; max-width: 560px; margin: 0 auto; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      h2 { color: #1e293b; margin-top: 0; }
      p { color: #475569; line-height: 1.6; }
      .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 24px; }
      .badge { display: inline-block; background: #2563eb; color: #fff; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
    </style></head>
    <body>
      <div class="card">
        <span class="badge">HR-DESK</span>
        <h2>${title}</h2>
        <p>${message}</p>
        <div class="footer">This is an automated message from HR-DESK. Please do not reply to this email.</div>
      </div>
    </body>
    </html>
  `;
}
//# sourceMappingURL=notificationService.js.map
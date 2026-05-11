"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const db_1 = require("./utils/db");
const logger_1 = __importDefault(require("./utils/logger"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = __importDefault(require("./routes/auth"));
const employee_1 = __importDefault(require("./routes/employee"));
const manager_1 = __importDefault(require("./routes/manager"));
const hr_1 = __importDefault(require("./routes/hr"));
const recruitment_1 = __importDefault(require("./routes/recruitment"));
const attendance_1 = __importDefault(require("./routes/attendance"));
const documents_1 = __importDefault(require("./routes/documents"));
const admin_1 = __importDefault(require("./routes/admin"));
const careers_1 = __importDefault(require("./routes/careers"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 5000;
// Ensure upload directories exist
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads';
['payslips', 'documents', 'resumes'].forEach((d) => fs_1.default.mkdirSync(path_1.default.join(UPLOAD_DIR, d), { recursive: true }));
// ── Security & Parsing ────────────────────────────────────────────────────────
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('dev'));
// Static file serving for uploads
app.use('/uploads', express_1.default.static(path_1.default.resolve(UPLOAD_DIR)));
// Rate limiting
app.use('/api/auth', (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true }));
app.use('/api', (0, express_rate_limit_1.default)({ windowMs: 1 * 60 * 1000, max: 300 }));
// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', auth_1.default);
app.use('/api/employee', employee_1.default);
app.use('/api/manager', manager_1.default);
app.use('/api/hr', hr_1.default);
app.use('/api/recruitment', recruitment_1.default);
app.use('/api/attendance', attendance_1.default);
app.use('/api/documents', documents_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/careers', careers_1.default);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));
// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler_1.errorHandler);
// ── Start ─────────────────────────────────────────────────────────────────────
(0, db_1.connectDB)().then(() => {
    app.listen(PORT, () => logger_1.default.info(`HR-DESK API running on port ${PORT}`));
});
exports.default = app;
//# sourceMappingURL=index.js.map
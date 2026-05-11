"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const Document_1 = __importDefault(require("../models/Document"));
const Employee_1 = __importDefault(require("../models/Employee"));
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path_1.default.join(process.env.UPLOAD_DIR ?? 'uploads', 'documents');
        fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = (0, multer_1.default)({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
router.post('/upload', auth_1.authenticate, upload.single('file'), async (req, res) => {
    if (!req.file)
        throw new errorHandler_1.AppError('No file uploaded', 400);
    const { type, employeeId: bodyEmpId } = req.body;
    let empId = bodyEmpId;
    if (req.user.role === 'employee') {
        const emp = await Employee_1.default.findOne({ userId: req.user._id });
        if (!emp)
            throw new errorHandler_1.AppError('Employee not found', 404);
        empId = emp._id.toString();
    }
    const doc = await Document_1.default.create({
        employeeId: empId,
        type: type ?? 'other',
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date(),
    });
    res.status(201).json(doc);
});
router.get('/', auth_1.authenticate, async (req, res) => {
    let filter = {};
    if (req.user.role === 'employee') {
        const emp = await Employee_1.default.findOne({ userId: req.user._id });
        if (!emp)
            throw new errorHandler_1.AppError('Employee not found', 404);
        filter.employeeId = emp._id;
    }
    else if (req.query.employeeId) {
        filter.employeeId = req.query.employeeId;
    }
    const docs = await Document_1.default.find(filter).sort({ uploadedAt: -1 });
    res.json(docs);
});
router.get('/:id/download', auth_1.authenticate, async (req, res) => {
    const doc = await Document_1.default.findById(req.params.id);
    if (!doc)
        throw new errorHandler_1.AppError('Document not found', 404);
    if (!fs_1.default.existsSync(doc.filePath))
        throw new errorHandler_1.AppError('File not found on server', 404);
    res.download(doc.filePath, doc.fileName);
});
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    const doc = await Document_1.default.findById(req.params.id);
    if (!doc)
        throw new errorHandler_1.AppError('Document not found', 404);
    if (req.user.role === 'employee') {
        const emp = await Employee_1.default.findOne({ userId: req.user._id });
        if (!emp || doc.employeeId.toString() !== emp._id.toString()) {
            throw new errorHandler_1.AppError('Forbidden', 403);
        }
    }
    if (fs_1.default.existsSync(doc.filePath))
        fs_1.default.unlinkSync(doc.filePath);
    await Document_1.default.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted' });
});
router.put('/:id/verify', auth_1.authenticate, (0, auth_1.authorize)('hr_manager', 'super_admin'), async (req, res) => {
    const doc = await Document_1.default.findByIdAndUpdate(req.params.id, { verifiedBy: req.user._id, verifiedAt: new Date() }, { new: true });
    if (!doc)
        throw new errorHandler_1.AppError('Document not found', 404);
    res.json(doc);
});
exports.default = router;
//# sourceMappingURL=documents.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const Job_1 = __importDefault(require("../models/Job"));
const Applicant_1 = __importDefault(require("../models/Applicant"));
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, path_1.default.join(process.env.UPLOAD_DIR ?? 'uploads', 'resumes')),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = (0, multer_1.default)({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
// Public job listing
router.get('/', async (_req, res) => {
    const jobs = await Job_1.default.find({ status: 'active' })
        .populate('department', 'name')
        .sort({ createdAt: -1 });
    res.json(jobs);
});
router.get('/:id', async (req, res) => {
    const job = await Job_1.default.findOne({ _id: req.params.id, status: 'active' }).populate('department', 'name');
    if (!job) {
        res.status(404).json({ message: 'Job not found' });
        return;
    }
    res.json(job);
});
// Public apply
router.post('/apply', upload.single('resume'), async (req, res) => {
    const { jobId, firstName, lastName, email, phone, coverLetter } = req.body;
    if (!jobId || !firstName || !lastName || !email || !phone) {
        res.status(400).json({ message: 'Required fields missing' });
        return;
    }
    const job = await Job_1.default.findOne({ _id: jobId, status: 'active' });
    if (!job) {
        res.status(404).json({ message: 'Job not found or closed' });
        return;
    }
    const existing = await Applicant_1.default.findOne({ jobId, email: email.toLowerCase() });
    if (existing) {
        res.status(409).json({ message: 'You have already applied for this position' });
        return;
    }
    const applicant = await Applicant_1.default.create({
        jobId,
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        coverLetter,
        resume: req.file?.path,
        stage: 'applied',
        source: 'career_page',
    });
    await Job_1.default.findByIdAndUpdate(jobId, { $inc: { applicantCount: 1 } });
    res.status(201).json({ message: 'Application submitted successfully', applicant });
});
exports.default = router;
//# sourceMappingURL=careers.js.map
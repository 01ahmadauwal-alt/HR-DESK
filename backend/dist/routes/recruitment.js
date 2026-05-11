"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const Job_1 = __importDefault(require("../models/Job"));
const Applicant_1 = __importDefault(require("../models/Applicant"));
const router = (0, express_1.Router)();
const hrGuard = [auth_1.authenticate, (0, auth_1.authorize)('hr_manager', 'super_admin')];
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, path_1.default.join(process.env.UPLOAD_DIR ?? 'uploads', 'resumes')),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = (0, multer_1.default)({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
// ── JOBS ──────────────────────────────────────────────────────────────────────
router.get('/jobs', async (_req, res) => {
    const jobs = await Job_1.default.find({ status: { $ne: 'draft' } })
        .populate('department', 'name')
        .sort({ createdAt: -1 });
    res.json(jobs);
});
router.get('/jobs/all', ...hrGuard, async (_req, res) => {
    const jobs = await Job_1.default.find()
        .populate('department', 'name')
        .sort({ createdAt: -1 });
    res.json(jobs);
});
router.get('/jobs/:id', async (req, res) => {
    const job = await Job_1.default.findById(req.params.id).populate('department', 'name');
    if (!job)
        throw new errorHandler_1.AppError('Job not found', 404);
    res.json(job);
});
router.post('/jobs', ...hrGuard, async (req, res) => {
    const job = await Job_1.default.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(job);
});
router.put('/jobs/:id', ...hrGuard, async (req, res) => {
    const job = await Job_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job)
        throw new errorHandler_1.AppError('Job not found', 404);
    res.json(job);
});
router.delete('/jobs/:id', ...hrGuard, async (req, res) => {
    await Job_1.default.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
});
// ── APPLICANTS ────────────────────────────────────────────────────────────────
// Public apply (no auth)
router.post('/jobs/:id/apply', upload.single('resume'), async (req, res) => {
    const job = await Job_1.default.findById(req.params.id);
    if (!job || job.status !== 'active')
        throw new errorHandler_1.AppError('Job not available', 404);
    const { firstName, lastName, email, phone, coverLetter, source, linkedIn } = req.body;
    if (!firstName || !lastName || !email || !phone)
        throw new errorHandler_1.AppError('Required fields missing', 400);
    const applicant = await Applicant_1.default.create({
        jobId: job._id,
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        resume: req.file?.path,
        coverLetter,
        source,
        linkedIn,
        stage: 'applied',
    });
    await Job_1.default.findByIdAndUpdate(job._id, { $inc: { applicantCount: 1 } });
    res.status(201).json({ message: 'Application submitted', applicant });
});
router.get('/jobs/:id/applicants', ...hrGuard, async (req, res) => {
    const applicants = await Applicant_1.default.find({ jobId: req.params.id }).sort({ createdAt: -1 });
    res.json(applicants);
});
router.get('/applicants', ...hrGuard, async (_req, res) => {
    const applicants = await Applicant_1.default.find()
        .populate('jobId', 'title department')
        .sort({ createdAt: -1 });
    res.json(applicants);
});
router.put('/applicants/:id/stage', ...hrGuard, async (req, res) => {
    const { stage } = req.body;
    const validStages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
    if (!validStages.includes(stage))
        throw new errorHandler_1.AppError('Invalid stage', 400);
    const applicant = await Applicant_1.default.findByIdAndUpdate(req.params.id, { stage }, { new: true });
    if (!applicant)
        throw new errorHandler_1.AppError('Applicant not found', 404);
    res.json(applicant);
});
router.post('/applicants/:id/interviews', ...hrGuard, async (req, res) => {
    const { scheduledAt, interviewer, type } = req.body;
    const applicant = await Applicant_1.default.findByIdAndUpdate(req.params.id, { $push: { interviews: { scheduledAt, interviewer, type, status: 'scheduled' } } }, { new: true });
    if (!applicant)
        throw new errorHandler_1.AppError('Applicant not found', 404);
    res.json(applicant);
});
router.put('/applicants/:id/notes', ...hrGuard, async (req, res) => {
    const applicant = await Applicant_1.default.findByIdAndUpdate(req.params.id, { notes: req.body.notes }, { new: true });
    if (!applicant)
        throw new errorHandler_1.AppError('Applicant not found', 404);
    res.json(applicant);
});
// ── STATS ─────────────────────────────────────────────────────────────────────
router.get('/stats', ...hrGuard, async (_req, res) => {
    const [totalJobs, activeJobs, totalApplicants] = await Promise.all([
        Job_1.default.countDocuments(),
        Job_1.default.countDocuments({ status: 'active' }),
        Applicant_1.default.countDocuments(),
    ]);
    const stageBreakdown = await Applicant_1.default.aggregate([
        { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]);
    res.json({ totalJobs, activeJobs, totalApplicants, stageBreakdown });
});
exports.default = router;
//# sourceMappingURL=recruitment.js.map
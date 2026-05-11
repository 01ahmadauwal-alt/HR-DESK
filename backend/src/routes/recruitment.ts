import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import Job from '../models/Job';
import Applicant from '../models/Applicant';

const router = Router();
const hrGuard = [authenticate, authorize('hr_manager', 'super_admin')];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(process.env.UPLOAD_DIR ?? 'uploads', 'resumes')),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── JOBS ──────────────────────────────────────────────────────────────────────

router.get('/jobs', async (_req: Request, res: Response) => {
  const jobs = await Job.find({ status: { $ne: 'draft' } })
    .populate('department', 'name')
    .sort({ createdAt: -1 });
  res.json(jobs);
});

router.get('/jobs/all', ...hrGuard, async (_req: AuthRequest, res: Response) => {
  const jobs = await Job.find()
    .populate('department', 'name')
    .sort({ createdAt: -1 });
  res.json(jobs);
});

router.get('/jobs/:id', async (req: Request, res: Response) => {
  const job = await Job.findById(req.params.id).populate('department', 'name');
  if (!job) throw new AppError('Job not found', 404);
  res.json(job);
});

router.post('/jobs', ...hrGuard, async (req: AuthRequest, res: Response) => {
  const job = await Job.create({ ...req.body, createdBy: req.user!._id });
  res.status(201).json(job);
});

router.put('/jobs/:id', ...hrGuard, async (req: AuthRequest, res: Response) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!job) throw new AppError('Job not found', 404);
  res.json(job);
});

router.delete('/jobs/:id', ...hrGuard, async (req: AuthRequest, res: Response) => {
  await Job.findByIdAndDelete(req.params.id);
  res.json({ message: 'Job deleted' });
});

// ── APPLICANTS ────────────────────────────────────────────────────────────────

// Public apply (no auth)
router.post('/jobs/:id/apply', upload.single('resume'), async (req: Request, res: Response) => {
  const job = await Job.findById(req.params.id);
  if (!job || job.status !== 'active') throw new AppError('Job not available', 404);

  const { firstName, lastName, email, phone, coverLetter, source, linkedIn } = req.body;
  if (!firstName || !lastName || !email || !phone) throw new AppError('Required fields missing', 400);

  const applicant = await Applicant.create({
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

  await Job.findByIdAndUpdate(job._id, { $inc: { applicantCount: 1 } });
  res.status(201).json({ message: 'Application submitted', applicant });
});

router.get('/jobs/:id/applicants', ...hrGuard, async (req: AuthRequest, res: Response) => {
  const applicants = await Applicant.find({ jobId: req.params.id }).sort({ createdAt: -1 });
  res.json(applicants);
});

router.get('/applicants', ...hrGuard, async (_req: AuthRequest, res: Response) => {
  const applicants = await Applicant.find()
    .populate('jobId', 'title department')
    .sort({ createdAt: -1 });
  res.json(applicants);
});

router.put('/applicants/:id/stage', ...hrGuard, async (req: AuthRequest, res: Response) => {
  const { stage } = req.body;
  const validStages = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
  if (!validStages.includes(stage)) throw new AppError('Invalid stage', 400);
  const applicant = await Applicant.findByIdAndUpdate(req.params.id, { stage }, { new: true });
  if (!applicant) throw new AppError('Applicant not found', 404);
  res.json(applicant);
});

router.post('/applicants/:id/interviews', ...hrGuard, async (req: AuthRequest, res: Response) => {
  const { scheduledAt, interviewer, type } = req.body;
  const applicant = await Applicant.findByIdAndUpdate(
    req.params.id,
    { $push: { interviews: { scheduledAt, interviewer, type, status: 'scheduled' } } },
    { new: true }
  );
  if (!applicant) throw new AppError('Applicant not found', 404);
  res.json(applicant);
});

router.put('/applicants/:id/notes', ...hrGuard, async (req: AuthRequest, res: Response) => {
  const applicant = await Applicant.findByIdAndUpdate(req.params.id, { notes: req.body.notes }, { new: true });
  if (!applicant) throw new AppError('Applicant not found', 404);
  res.json(applicant);
});

// ── STATS ─────────────────────────────────────────────────────────────────────

router.get('/stats', ...hrGuard, async (_req: AuthRequest, res: Response) => {
  const [totalJobs, activeJobs, totalApplicants] = await Promise.all([
    Job.countDocuments(),
    Job.countDocuments({ status: 'active' }),
    Applicant.countDocuments(),
  ]);

  const stageBreakdown = await Applicant.aggregate([
    { $group: { _id: '$stage', count: { $sum: 1 } } },
  ]);

  res.json({ totalJobs, activeJobs, totalApplicants, stageBreakdown });
});

export default router;

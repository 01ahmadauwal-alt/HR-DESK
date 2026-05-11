import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import Job from '../models/Job';
import Applicant from '../models/Applicant';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(process.env.UPLOAD_DIR ?? 'uploads', 'resumes')),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Public job listing
router.get('/', async (_req: Request, res: Response) => {
  const jobs = await Job.find({ status: 'active' })
    .populate('department', 'name')
    .sort({ createdAt: -1 });
  res.json(jobs);
});

router.get('/:id', async (req: Request, res: Response) => {
  const job = await Job.findOne({ _id: req.params.id, status: 'active' }).populate('department', 'name');
  if (!job) { res.status(404).json({ message: 'Job not found' }); return; }
  res.json(job);
});

// Public apply
router.post('/apply', upload.single('resume'), async (req: Request, res: Response) => {
  const { jobId, firstName, lastName, email, phone, coverLetter } = req.body;
  if (!jobId || !firstName || !lastName || !email || !phone) {
    res.status(400).json({ message: 'Required fields missing' });
    return;
  }

  const job = await Job.findOne({ _id: jobId, status: 'active' });
  if (!job) { res.status(404).json({ message: 'Job not found or closed' }); return; }

  const existing = await Applicant.findOne({ jobId, email: email.toLowerCase() });
  if (existing) {
    res.status(409).json({ message: 'You have already applied for this position' });
    return;
  }

  const applicant = await Applicant.create({
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

  await Job.findByIdAndUpdate(jobId, { $inc: { applicantCount: 1 } });

  res.status(201).json({ message: 'Application submitted successfully', applicant });
});

export default router;

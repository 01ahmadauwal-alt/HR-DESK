import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import Document from '../models/Document';
import Employee from '../models/Employee';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.env.UPLOAD_DIR ?? 'uploads', 'documents');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/upload', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const { type, employeeId: bodyEmpId } = req.body;
  let empId = bodyEmpId;

  if (req.user!.role === 'employee') {
    const emp = await Employee.findOne({ userId: req.user!._id });
    if (!emp) throw new AppError('Employee not found', 404);
    empId = (emp._id as string).toString();
  }

  const doc = await Document.create({
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

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  let filter: Record<string, unknown> = {};

  if (req.user!.role === 'employee') {
    const emp = await Employee.findOne({ userId: req.user!._id });
    if (!emp) throw new AppError('Employee not found', 404);
    filter.employeeId = emp._id;
  } else if (req.query.employeeId) {
    filter.employeeId = req.query.employeeId;
  }

  const docs = await Document.find(filter).sort({ uploadedAt: -1 });
  res.json(docs);
});

router.get('/:id/download', authenticate, async (req: AuthRequest, res: Response) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) throw new AppError('Document not found', 404);
  if (!fs.existsSync(doc.filePath)) throw new AppError('File not found on server', 404);
  res.download(doc.filePath, doc.fileName);
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) throw new AppError('Document not found', 404);

  if (req.user!.role === 'employee') {
    const emp = await Employee.findOne({ userId: req.user!._id });
    if (!emp || doc.employeeId.toString() !== (emp._id as string).toString()) {
      throw new AppError('Forbidden', 403);
    }
  }

  if (fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath);
  await Document.findByIdAndDelete(req.params.id);
  res.json({ message: 'Document deleted' });
});

router.put('/:id/verify', authenticate, authorize('hr_manager', 'super_admin'), async (req: AuthRequest, res: Response) => {
  const doc = await Document.findByIdAndUpdate(
    req.params.id,
    { verifiedBy: req.user!._id, verifiedAt: new Date() },
    { new: true }
  );
  if (!doc) throw new AppError('Document not found', 404);
  res.json(doc);
});

export default router;

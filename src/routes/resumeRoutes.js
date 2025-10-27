import { Router } from 'express';
import multer from 'multer';
import { analyzeResume, getAllJobs, getJobById } from '../controllers/resumeController.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });
router.post(
  '/resume/analyze',
  upload.single('resume'),
  analyzeResume
);
router.get(
  '/jobs',
  getAllJobs
);

router.get(
  '/jobs/:id',
  getJobById
);

export default router;


import { Router } from 'express';
import studentRoutes from './student.routes';
import teacherRoutes from './teacher.routes';
import adminRoutes from './admin.routes';
import moodleRoutes from './moodle.routes';

const router = Router();

router.use('/student', studentRoutes);
router.use('/teacher', teacherRoutes);
router.use('/admin', adminRoutes);
router.use('/moodle', moodleRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'error-pattern-analysis',
  });
});

export default router;

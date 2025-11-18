import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initializeDatabase } from './database';
import {
  calculateAndStoreScores,
  getStudentScoreTrend,
  getAllStudentsLatestScores,
  getStudent,
  getAllStudents,
} from './consistency';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database on startup
initializeDatabase();

// API Routes

/**
 * GET /api/students
 * Get all students
 */
app.get('/api/students', (req: Request, res: Response) => {
  try {
    const students = getAllStudents();
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

/**
 * GET /api/students/:id
 * Get a specific student
 */
app.get('/api/students/:id', (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.id);
    const student = getStudent(studentId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

/**
 * GET /api/students/:id/scores
 * Get consistency score trend for a student
 */
app.get('/api/students/:id/scores', (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.id);
    const days = parseInt(req.query.days as string) || 30;

    const student = getStudent(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const scores = getStudentScoreTrend(studentId, days);
    res.json({
      student,
      scores: scores.reverse(), // Return oldest to newest
    });
  } catch (error) {
    console.error('Error fetching student scores:', error);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

/**
 * GET /api/scores/latest
 * Get latest consistency scores for all students
 */
app.get('/api/scores/latest', (req: Request, res: Response) => {
  try {
    const scores = getAllStudentsLatestScores();
    res.json(scores);
  } catch (error) {
    console.error('Error fetching latest scores:', error);
    res.status(500).json({ error: 'Failed to fetch latest scores' });
  }
});

/**
 * POST /api/scores/calculate
 * Recalculate and store consistency scores
 */
app.post('/api/scores/calculate', (req: Request, res: Response) => {
  try {
    calculateAndStoreScores();
    res.json({ message: 'Scores calculated successfully' });
  } catch (error) {
    console.error('Error calculating scores:', error);
    res.status(500).json({ error: 'Failed to calculate scores' });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LMS Consistency Score API server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET  /api/students - Get all students`);
  console.log(`   GET  /api/students/:id - Get student details`);
  console.log(`   GET  /api/students/:id/scores - Get student score trend`);
  console.log(`   GET  /api/scores/latest - Get latest scores for all students`);
  console.log(`   POST /api/scores/calculate - Recalculate scores`);
  console.log(`   GET  /api/health - Health check`);
});

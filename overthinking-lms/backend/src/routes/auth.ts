import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

const router = express.Router();

// Student login
router.post('/student/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const student = await prisma.student.findUnique({ where: { email } });

    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, student.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: student.id, type: 'student' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        gradeLevel: student.gradeLevel,
      },
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Student register
router.post('/student/register', async (req, res) => {
  try {
    const { name, email, password, gradeLevel } = req.body;

    const existingStudent = await prisma.student.findUnique({ where: { email } });

    if (existingStudent) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const student = await prisma.student.create({
      data: {
        name,
        email,
        passwordHash,
        gradeLevel,
      },
    });

    const token = jwt.sign(
      { id: student.id, type: 'student' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        gradeLevel: student.gradeLevel,
      },
    });
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Teacher login
router.post('/teacher/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const teacher = await prisma.teacher.findUnique({ where: { email } });

    if (!teacher) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, teacher.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: teacher.id, type: 'teacher' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
      },
    });
  } catch (error) {
    console.error('Teacher login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Teacher register
router.post('/teacher/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingTeacher = await prisma.teacher.findUnique({ where: { email } });

    if (existingTeacher) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const teacher = await prisma.teacher.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    const token = jwt.sign(
      { id: teacher.id, type: 'teacher' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
      },
    });
  } catch (error) {
    console.error('Teacher registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

export default router;

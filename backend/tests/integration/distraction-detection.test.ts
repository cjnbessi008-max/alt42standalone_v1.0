/**
 * Integration Tests - Distraction Detection Workflow
 *
 * Tests the complete distraction detection workflow:
 * 1. Event emission from frontend
 * 2. API ingestion
 * 3. Database persistence
 * 4. Session aggregation
 * 5. Teacher marking
 * 6. Analytics aggregation
 * 7. Dashboard display
 */

import request from 'supertest';
import { Pool } from 'pg';
import app from '../../src/app'; // Express app
import { v4 as uuidv4 } from 'uuid';

describe('Distraction Detection - Complete Workflow', () => {
  let db: Pool;
  let authToken: string;
  let teacherToken: string;
  let studentId: string;
  let moduleId: string;
  let sessionId: string;
  let eventId: string;

  // ============================================================================
  // Setup & Teardown
  // ============================================================================

  beforeAll(async () => {
    // Setup database connection
    db = new Pool({
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      database: process.env.TEST_DB_NAME || 'ai_education_test',
      user: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || '',
    });

    // Create test data
    studentId = uuidv4();
    moduleId = uuidv4();
    sessionId = uuidv4();

    await setupTestData();
    authToken = await getAuthToken('student');
    teacherToken = await getAuthToken('teacher');
  });

  afterAll(async () => {
    await cleanupTestData();
    await db.end();
  });

  // ============================================================================
  // Test 1: Event Emission and Ingestion
  // ============================================================================

  describe('1. Event Emission and Ingestion', () => {
    it('should accept a single distraction event', async () => {
      const eventData = {
        studentId,
        sessionId,
        eventType: 'page_blur',
        durationSeconds: 15,
        metadata: {
          browser: 'Chrome',
          userAgent: 'Mozilla/5.0...',
        },
        problemContext: {
          problemId: 'problem-1',
          difficulty: 'medium',
        },
      };

      const response = await request(app)
        .post(`/api/modules/${moduleId}/distraction-events`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.eventType).toBe('page_blur');
      expect(response.body.data.severityLevel).toBe('moderate'); // 15 seconds = moderate

      eventId = response.body.data.id;
    });

    it('should accept batch distraction events', async () => {
      const events = [
        {
          studentId,
          sessionId,
          eventType: 'tab_switch',
          durationSeconds: 5,
        },
        {
          studentId,
          sessionId,
          eventType: 'mouse_idle',
          durationSeconds: 45,
        },
        {
          studentId,
          sessionId,
          eventType: 'inactivity',
          durationSeconds: 120,
        },
      ];

      const response = await request(app)
        .post(`/api/modules/${moduleId}/distraction-events/batch`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ events })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(3);
      expect(response.body.data.events).toHaveLength(3);
    });

    it('should validate event data', async () => {
      const invalidEvent = {
        studentId: 'not-a-uuid',
        sessionId,
        eventType: 'invalid_type',
        durationSeconds: -5,
      };

      await request(app)
        .post(`/api/modules/${moduleId}/distraction-events`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEvent)
        .expect(400);
    });
  });

  // ============================================================================
  // Test 2: Database Persistence
  // ============================================================================

  describe('2. Database Persistence', () => {
    it('should persist event to database', async () => {
      const result = await db.query('SELECT * FROM distraction_events WHERE id = $1', [eventId]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].event_type).toBe('page_blur');
      expect(result.rows[0].student_id).toBe(studentId);
      expect(result.rows[0].module_id).toBe(moduleId);
    });

    it('should automatically update session aggregates', async () => {
      const result = await db.query(
        'SELECT * FROM distraction_sessions WHERE session_id = $1',
        [sessionId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].total_events).toBeGreaterThan(0);
      expect(parseFloat(result.rows[0].distraction_percentage)).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Test 3: Event Retrieval and Filtering
  // ============================================================================

  describe('3. Event Retrieval and Filtering', () => {
    it('should retrieve unmarked events for teacher', async () => {
      const response = await request(app)
        .get(`/api/modules/${moduleId}/distraction-events`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ unmarkedOnly: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter events by student', async () => {
      const response = await request(app)
        .get(`/api/modules/${moduleId}/distraction-events`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ studentId })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      response.body.data.forEach((event: any) => {
        expect(event.studentId).toBe(studentId);
      });
    });

    it('should filter events by event type', async () => {
      const response = await request(app)
        .get(`/api/modules/${moduleId}/distraction-events`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ eventType: 'page_blur' })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      response.body.data.forEach((event: any) => {
        expect(event.eventType).toBe('page_blur');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/modules/${moduleId}/distraction-events`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ limit: 2, offset: 0 })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('offset');
    });
  });

  // ============================================================================
  // Test 4: Teacher Marking
  // ============================================================================

  describe('4. Teacher Marking', () => {
    it('should create a distraction mark', async () => {
      const markData = {
        distractionEventId: eventId,
        studentId,
        category: 'off_task',
        severity: 'moderate',
        contextNotes: 'Student was browsing social media',
        rootCauseAnalysis: 'Lack of focus, possibly due to difficult problem',
        actionTaken: 'Sent reminder to student',
        interventionRecommended: true,
        interventionType: '1:1 counseling',
      };

      const response = await request(app)
        .post(`/api/modules/${moduleId}/distraction-marks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(markData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.category).toBe('off_task');
    });

    it('should prevent duplicate marks for same event', async () => {
      const markData = {
        distractionEventId: eventId,
        studentId,
        category: 'legitimate_break',
        severity: 'minor',
      };

      await request(app)
        .post(`/api/modules/${moduleId}/distraction-marks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(markData)
        .expect(400); // Should fail due to unique constraint
    });

    it('should retrieve distraction marks', async () => {
      const response = await request(app)
        .get(`/api/modules/${moduleId}/distraction-marks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should update a distraction mark', async () => {
      const marks = await db.query(
        'SELECT id FROM distraction_marks WHERE distraction_event_id = $1',
        [eventId]
      );

      const markId = marks.rows[0].id;

      const updateData = {
        category: 'confusion',
        severity: 'major',
        contextNotes: 'Updated: Student was confused about the problem statement',
      };

      const response = await request(app)
        .put(`/api/modules/${moduleId}/distraction-marks/${markId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('confusion');
      expect(response.body.data.severity).toBe('major');
    });
  });

  // ============================================================================
  // Test 5: Analytics and Aggregation
  // ============================================================================

  describe('5. Analytics and Aggregation', () => {
    it('should get student distraction summary', async () => {
      const response = await request(app)
        .get(`/api/modules/${moduleId}/student/${studentId}/distraction-summary`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_sessions');
      expect(response.body.data).toHaveProperty('avg_distraction_percentage');
      expect(response.body.data).toHaveProperty('total_distraction_events');
    });

    it('should get module analytics', async () => {
      const response = await request(app)
        .get(`/api/modules/${moduleId}/distraction-analytics`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ groupBy: 'day' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should get distraction thresholds', async () => {
      const response = await request(app)
        .get(`/api/modules/${moduleId}/distraction-thresholds`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('criticalPercentage');
      expect(response.body.data).toHaveProperty('warningPercentage');
    });

    it('should update distraction thresholds', async () => {
      const thresholdData = {
        criticalPercentage: 60,
        warningPercentage: 40,
        minorPercentage: 15,
        autoPauseOnCritical: true,
        sendTeacherAlerts: true,
      };

      const response = await request(app)
        .put(`/api/modules/${moduleId}/distraction-thresholds`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(thresholdData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.critical_percentage).toBe(60);
    });
  });

  // ============================================================================
  // Test 6: Authorization and Access Control
  // ============================================================================

  describe('6. Authorization and Access Control', () => {
    it('should allow students to create events', async () => {
      const eventData = {
        studentId,
        sessionId,
        eventType: 'page_blur',
        durationSeconds: 10,
      };

      await request(app)
        .post(`/api/modules/${moduleId}/distraction-events`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData)
        .expect(201);
    });

    it('should prevent students from accessing teacher endpoints', async () => {
      await request(app)
        .get(`/api/modules/${moduleId}/distraction-marks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403); // Forbidden
    });

    it('should prevent students from creating marks', async () => {
      const markData = {
        distractionEventId: eventId,
        studentId,
        category: 'off_task',
        severity: 'moderate',
      };

      await request(app)
        .post(`/api/modules/${moduleId}/distraction-marks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(markData)
        .expect(403);
    });

    it('should allow teachers to access all endpoints', async () => {
      await request(app)
        .get(`/api/modules/${moduleId}/distraction-events`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      await request(app)
        .get(`/api/modules/${moduleId}/distraction-marks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      await request(app)
        .get(`/api/modules/${moduleId}/distraction-analytics`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
    });
  });

  // ============================================================================
  // Helper Functions
  // ============================================================================

  async function setupTestData() {
    // Create test student
    await db.query(
      `
      INSERT INTO students (id, email, grade_level)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO NOTHING
    `,
      [studentId, 'test-student@test.com', 5]
    );

    // Create test module
    await db.query(
      `
      INSERT INTO modules (id, name, status)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO NOTHING
    `,
      [moduleId, 'Test Module', 'active']
    );

    // Create test session
    await db.query(
      `
      INSERT INTO distraction_sessions (
        id, student_id, module_id, session_id, session_start
      )
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (session_id) DO NOTHING
    `,
      [uuidv4(), studentId, moduleId, sessionId]
    );
  }

  async function cleanupTestData() {
    // Delete in reverse order of foreign keys
    await db.query('DELETE FROM distraction_marks WHERE student_id = $1', [studentId]);
    await db.query('DELETE FROM distraction_events WHERE student_id = $1', [studentId]);
    await db.query('DELETE FROM distraction_sessions WHERE student_id = $1', [studentId]);
    await db.query('DELETE FROM daily_distraction_analytics WHERE student_id = $1', [studentId]);
    await db.query('DELETE FROM students WHERE id = $1', [studentId]);
    await db.query('DELETE FROM modules WHERE id = $1', [moduleId]);
  }

  async function getAuthToken(role: 'student' | 'teacher'): Promise<string> {
    // Mock auth token generation
    // In real implementation, this would call your auth service
    return `mock-${role}-token`;
  }
});

import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3001;

app.use(express.json());

// Moodle MySQL 연결 설정 (환경변수로 관리 권장)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'moodle',
  password: process.env.DB_PASSWORD || 'moodle',
  database: process.env.DB_NAME || 'moodle',
};

// 데이터베이스 연결 풀 생성
let pool;
try {
  pool = mysql.createPool(dbConfig);
  console.log('📊 Moodle MySQL connection pool created');
} catch (error) {
  console.error('❌ Failed to create MySQL pool:', error.message);
}

// Health check 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '3D Area Space API Server',
    timestamp: new Date().toISOString()
  });
});

// 문제 목록 가져오기
app.get('/api/problems', async (req, res) => {
  try {
    if (!pool) {
      // DB 연결이 없을 경우 목업 데이터 반환
      return res.json({
        problems: [
          {
            id: 1,
            title: '직사각형의 넓이',
            description: '가로 5cm, 세로 3cm인 직사각형의 넓이를 구하세요',
            shape: 'rectangle',
            params: { width: 5, height: 3 },
            answer: 15,
            unit: 'cm²'
          },
          {
            id: 2,
            title: '정사각형의 넓이',
            description: '한 변의 길이가 4cm인 정사각형의 넓이를 구하세요',
            shape: 'square',
            params: { side: 4 },
            answer: 16,
            unit: 'cm²'
          },
          {
            id: 3,
            title: '원의 넓이',
            description: '반지름이 3cm인 원의 넓이를 구하세요',
            shape: 'circle',
            params: { radius: 3 },
            answer: Math.round(Math.PI * 9 * 100) / 100,
            unit: 'cm²'
          }
        ]
      });
    }

    // 실제 Moodle DB에서 문제 가져오기 (테이블 구조에 맞게 수정 필요)
    const [rows] = await pool.query(`
      SELECT
        q.id,
        q.name as title,
        q.questiontext as description
      FROM mdl_question q
      WHERE q.qtype = 'numerical'
      AND q.category IN (
        SELECT id FROM mdl_question_categories
        WHERE name LIKE '%넓이%' OR name LIKE '%area%'
      )
      LIMIT 10
    `);

    res.json({ problems: rows });
  } catch (error) {
    console.error('❌ Error fetching problems:', error);
    res.status(500).json({
      error: 'Failed to fetch problems',
      message: error.message
    });
  }
});

// 특정 문제 가져오기
app.get('/api/problems/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!pool) {
      // 목업 데이터
      const mockProblems = {
        '1': {
          id: 1,
          title: '직사각형의 넓이',
          description: '가로 5cm, 세로 3cm인 직사각형의 넓이를 구하세요',
          shape: 'rectangle',
          params: { width: 5, height: 3 },
          answer: 15,
          unit: 'cm²'
        }
      };
      return res.json(mockProblems[id] || { error: 'Problem not found' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM mdl_question WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('❌ Error fetching problem:', error);
    res.status(500).json({
      error: 'Failed to fetch problem',
      message: error.message
    });
  }
});

// 학생 답안 제출
app.post('/api/submit', async (req, res) => {
  const { problemId, studentId, answer } = req.body;

  try {
    // 여기서 Moodle DB에 답안 저장 또는 검증
    console.log('📝 Answer submitted:', { problemId, studentId, answer });

    res.json({
      success: true,
      message: 'Answer submitted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error submitting answer:', error);
    res.status(500).json({
      error: 'Failed to submit answer',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 3D Area Space API Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/problems`);
  console.log(`   GET  /api/problems/:id`);
  console.log(`   POST /api/submit`);
});

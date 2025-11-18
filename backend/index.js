const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock LMS/Moodle data - Vector problems
const vectorProblems = [
  {
    id: 1,
    title: '벡터의 탄생',
    description: '벡터가 무엇인지 스토리로 배워봅시다',
    type: 'introduction',
    storyMode: {
      scenes: [
        {
          id: 1,
          narration: '어느 날, 작은 마을에 화살이 날아들었습니다.',
          vector: { x: 0, y: 0, toX: 3, toY: 4 },
          highlight: 'direction',
          duration: 3000
        },
        {
          id: 2,
          narration: '화살은 방향과 크기를 가지고 있었죠. 이것이 바로 벡터입니다!',
          vector: { x: 0, y: 0, toX: 3, toY: 4 },
          highlight: 'magnitude',
          duration: 4000
        },
        {
          id: 3,
          narration: '벡터는 시작점에서 끝점까지의 이동을 나타냅니다.',
          vector: { x: 1, y: 1, toX: 4, toY: 5 },
          highlight: 'both',
          duration: 4000
        }
      ]
    },
    difficulty: 1,
    gradeLevel: '중학교 1학년'
  },
  {
    id: 2,
    title: '벡터의 덧셈 여행',
    description: '두 벡터를 더하면 어떻게 될까요?',
    type: 'addition',
    storyMode: {
      scenes: [
        {
          id: 1,
          narration: '빨간 벡터가 먼저 이동합니다.',
          vectors: [
            { id: 'v1', x: 0, y: 0, toX: 3, toY: 2, color: '#ff6b6b', label: 'a' }
          ],
          highlight: 'v1',
          duration: 3000
        },
        {
          id: 2,
          narration: '그 다음, 파란 벡터가 빨간 벡터의 끝에서 시작합니다.',
          vectors: [
            { id: 'v1', x: 0, y: 0, toX: 3, toY: 2, color: '#ff6b6b', label: 'a' },
            { id: 'v2', x: 3, y: 2, toX: 5, toY: 5, color: '#4dabf7', label: 'b' }
          ],
          highlight: 'v2',
          duration: 3000
        },
        {
          id: 3,
          narration: '최종 결과는 처음 시작점에서 마지막 끝점까지의 벡터입니다!',
          vectors: [
            { id: 'v1', x: 0, y: 0, toX: 3, toY: 2, color: '#ff6b6b', label: 'a', opacity: 0.3 },
            { id: 'v2', x: 3, y: 2, toX: 5, toY: 5, color: '#4dabf7', label: 'b', opacity: 0.3 },
            { id: 'result', x: 0, y: 0, toX: 5, toY: 5, color: '#51cf66', label: 'a + b', thickness: 3 }
          ],
          highlight: 'result',
          duration: 4000
        }
      ]
    },
    difficulty: 2,
    gradeLevel: '중학교 2학년'
  },
  {
    id: 3,
    title: '벡터의 스칼라 곱',
    description: '벡터에 숫자를 곱하면 어떻게 될까요?',
    type: 'scalar',
    storyMode: {
      scenes: [
        {
          id: 1,
          narration: '원래 벡터가 있습니다.',
          vectors: [
            { id: 'original', x: 0, y: 0, toX: 2, toY: 3, color: '#ff6b6b', label: 'v' }
          ],
          highlight: 'original',
          duration: 2500
        },
        {
          id: 2,
          narration: '2를 곱하면 벡터의 길이가 2배가 됩니다!',
          vectors: [
            { id: 'original', x: 0, y: 0, toX: 2, toY: 3, color: '#ff6b6b', label: 'v', opacity: 0.3 },
            { id: 'scaled', x: 0, y: 0, toX: 4, toY: 6, color: '#4dabf7', label: '2v', thickness: 3 }
          ],
          highlight: 'scaled',
          duration: 3500
        },
        {
          id: 3,
          narration: '-1을 곱하면 방향이 반대가 됩니다!',
          vectors: [
            { id: 'original', x: 0, y: 0, toX: 2, toY: 3, color: '#ff6b6b', label: 'v', opacity: 0.3 },
            { id: 'negative', x: 0, y: 0, toX: -2, toY: -3, color: '#f06595', label: '-v', thickness: 3 }
          ],
          highlight: 'negative',
          duration: 3500
        }
      ]
    },
    difficulty: 2,
    gradeLevel: '중학교 2학년'
  },
  {
    id: 4,
    title: '벡터의 내적',
    description: '두 벡터가 얼마나 같은 방향을 향하고 있을까요?',
    type: 'dot_product',
    storyMode: {
      scenes: [
        {
          id: 1,
          narration: '두 벡터가 있습니다.',
          vectors: [
            { id: 'a', x: 0, y: 0, toX: 4, toY: 2, color: '#ff6b6b', label: 'a' },
            { id: 'b', x: 0, y: 0, toX: 3, toY: 4, color: '#4dabf7', label: 'b' }
          ],
          highlight: 'both',
          duration: 3000
        },
        {
          id: 2,
          narration: '두 벡터 사이의 각도를 확인할 수 있습니다.',
          vectors: [
            { id: 'a', x: 0, y: 0, toX: 4, toY: 2, color: '#ff6b6b', label: 'a' },
            { id: 'b', x: 0, y: 0, toX: 3, toY: 4, color: '#4dabf7', label: 'b' }
          ],
          showAngle: true,
          highlight: 'angle',
          duration: 4000
        },
        {
          id: 3,
          narration: '내적은 두 벡터가 같은 방향을 향할수록 큽니다!',
          vectors: [
            { id: 'a', x: 0, y: 0, toX: 4, toY: 2, color: '#ff6b6b', label: 'a' },
            { id: 'b', x: 0, y: 0, toX: 3, toY: 4, color: '#4dabf7', label: 'b' }
          ],
          calculation: 'a · b = 4×3 + 2×4 = 20',
          duration: 5000
        }
      ]
    },
    difficulty: 3,
    gradeLevel: '중학교 3학년'
  }
];

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Vector Story Mode API is running' });
});

app.get('/api/problems', (req, res) => {
  const { difficulty, type, gradeLevel } = req.query;

  let filtered = vectorProblems;

  if (difficulty) {
    filtered = filtered.filter(p => p.difficulty === parseInt(difficulty));
  }

  if (type) {
    filtered = filtered.filter(p => p.type === type);
  }

  if (gradeLevel) {
    filtered = filtered.filter(p => p.gradeLevel === gradeLevel);
  }

  res.json({
    success: true,
    count: filtered.length,
    problems: filtered
  });
});

app.get('/api/problems/:id', (req, res) => {
  const problem = vectorProblems.find(p => p.id === parseInt(req.params.id));

  if (!problem) {
    return res.status(404).json({
      success: false,
      message: '문제를 찾을 수 없습니다.'
    });
  }

  res.json({
    success: true,
    problem
  });
});

// Mock student progress endpoint
app.post('/api/progress', (req, res) => {
  const { studentId, problemId, completed, score } = req.body;

  // In production, this would save to MySQL/Moodle database
  res.json({
    success: true,
    message: '진행 상황이 저장되었습니다.',
    data: {
      studentId,
      problemId,
      completed,
      score,
      timestamp: new Date().toISOString()
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Vector Story Mode API server running on port ${PORT}`);
  console.log(`📚 API endpoints:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - GET  /api/problems`);
  console.log(`   - GET  /api/problems/:id`);
  console.log(`   - POST /api/progress`);
});

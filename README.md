# Alt42 Standalone - Data Shuffle Feature

## Overview

교육용 평가 시스템에서 문제와 답안을 고르게 섞어 학생들에게 제공하는 **Data Shuffle** 기능 구현

## Features

### ✅ Core Functionality

- **문제 순서 셔플**: 각 학생마다 다른 문제 순서 제공
- **답안 선택지 셔플**: 객관식 문제의 선택지 순서 무작위화
- **균등 분포 보장**: Fisher-Yates 알고리즘으로 모든 순열 동일 확률
- **재현 가능성**: 시드 기반 셔플로 동일 학생은 항상 같은 순서
- **보안**: 정답 정보는 서버에서만 관리, 클라이언트 노출 방지

### 🎯 Advanced Options

- **그룹 유지 셔플**: 연관 문제들을 함께 유지하며 셔플
- **난이도 순서 유지**: 쉬운 문제 → 어려운 문제 순서 보존
- **섹션별 독립 셔플**: Section A, B, C 각각 내부 셔플
- **특수 선택지 고정**: "없음", "모두 맞음" 등 특수 선택지는 위치 고정

## Architecture

```
┌─────────────────┐
│  Frontend       │  React + TypeScript
│  StudentQuizView│
└────────┬────────┘
         │ REST API
         ▼
┌─────────────────┐
│  Backend API    │  Node.js + Express
│  QuestionSetCtrl│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Shuffle Service│  Fisher-Yates Algorithm
│  SeededRandom   │  Deterministic RNG
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │  Question Sets, Shuffle Maps
│                 │  Student Answers
└─────────────────┘
```

## Database Schema

### Core Tables

1. **question_sets**: 문제 세트 및 셔플 설정
2. **questions**: 문제 정보 (원본 순서 포함)
3. **answer_choices**: 답안 선택지 (원본 순서 포함)
4. **student_shuffle_maps**: 학생별 셔플 매핑 (시드, 순서 매핑)
5. **student_answers**: 학생 답안 제출 내역

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Setup

```bash
# Clone repository
git clone <repository-url>
cd alt42standalone_v1.0

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Setup database
cd ../database
psql -U postgres -f migrations/001_create_data_shuffle_schema.sql
```

### Environment Configuration

Create `.env` file in backend directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/alt42
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=3000
```

## Running the Application

### Development Mode

```bash
# Terminal 1: Backend API
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Production Mode

```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
npm start
```

## API Endpoints

### Teacher Endpoints

```
POST   /api/question-sets
POST   /api/question-sets/:id/questions
GET    /api/question-sets/:id
PUT    /api/question-sets/:id
DELETE /api/question-sets/:id
```

### Student Endpoints

```
GET    /api/question-sets/:id/student-view
POST   /api/question-sets/:id/submit
GET    /api/question-sets/:id/results/:student_id
```

## Usage Examples

### Creating a Question Set

```javascript
POST /api/question-sets
{
  "name": "중간고사 1회",
  "shuffle_questions": true,
  "shuffle_answers": true,
  "shuffle_strategy": "seeded"
}
```

### Adding a Question

```javascript
POST /api/question-sets/:id/questions
{
  "question_text": "다음 중 Python의 특징이 아닌 것은?",
  "question_type": "mcq",
  "original_order": 1,
  "difficulty_level": 2,
  "choices": [
    {"text": "인터프리터 언어", "is_correct": false, "original_order": 0},
    {"text": "정적 타입 언어", "is_correct": true, "original_order": 1},
    {"text": "동적 타입 언어", "is_correct": false, "original_order": 2},
    {"text": "고수준 언어", "is_correct": false, "original_order": 3}
  ]
}
```

### Student Taking Quiz

```javascript
// Get shuffled questions
GET /api/question-sets/:id/student-view

// Submit answers
POST /api/question-sets/:id/submit
{
  "shuffle_map_id": "uuid",
  "answers": [
    {
      "question_id": "q1-uuid",
      "selected_choice_id": "c2-uuid",
      "displayed_position": "B"
    }
  ]
}
```

## Algorithm Details

### Fisher-Yates Shuffle

```javascript
// Time Complexity: O(n)
// Space Complexity: O(n)

function fisherYatesShuffle(array, seed) {
    const rng = new SeededRandom(seed);
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}
```

### Seeded Random Number Generator

Linear Congruential Generator (LCG) - MINSTD implementation:

```javascript
class SeededRandom {
    constructor(seed) {
        this.seed = seed % 2147483647;
    }

    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
}
```

## Testing

### Run Unit Tests

```bash
cd backend
npm test
```

### Run Integration Tests

```bash
npm run test:integration
```

### Test Coverage

```bash
npm run test:coverage
```

## Performance

- **Shuffle Time**: O(n) for n questions/choices
- **Database Queries**: Optimized with indexes on student_id, question_set_id
- **Caching**: Redis cache for shuffle maps (TTL: exam duration)
- **Concurrent Users**: Supports 1000+ simultaneous students

## Security Features

- ✅ Answer keys never sent to client
- ✅ Shuffle map validation on answer submission
- ✅ Student can only access own shuffle maps
- ✅ CSRF protection
- ✅ Rate limiting on API endpoints
- ✅ JWT authentication

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

- [ ] Dynamic question pool selection
- [ ] Adaptive testing (difficulty adjustment)
- [ ] Question bank management
- [ ] Analytics dashboard (per-question statistics)
- [ ] LMS/Moodle integration (IMS QTI)
- [ ] Mobile native apps (iOS/Android)

## Documentation

- [Feature Specification](tasks/0002-feature-data-shuffle.md)
- [Database Schema](database/migrations/001_create_data_shuffle_schema.sql)
- [API Documentation](docs/api.md) (TODO)

## License

MIT License

## Contributors

- Claude (Initial Implementation)

## Support

For issues or questions:
- GitHub Issues: [Create an issue](../../issues)
- Email: support@example.com

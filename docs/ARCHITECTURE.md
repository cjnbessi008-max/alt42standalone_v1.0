# LMS Roleplay Conversion System - Architecture

## Overview
독립형 웹 애플리케이션으로, 교육 문제를 AI 기반 상황극 스토리로 변환하여 학생들에게 인터랙티브한 학습 경험을 제공합니다.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TS)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Teacher    │  │   Student    │  │    Admin     │      │
│  │  Dashboard   │  │    Player    │  │   Dashboard  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API + WebSocket
┌────────────────────────▼────────────────────────────────────┐
│              API Server (Node.js + Express)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     Auth     │  │   Problem    │  │   Student    │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │    Story     │  │   Progress   │                         │
│  │   Service    │  │   Service    │                         │
│  └──────────────┘  └──────────────┘                         │
└────────────┬────────────────────┬───────────────────────────┘
             │                    │
┌────────────▼───────┐   ┌────────▼──────────┐
│  Claude API        │   │   PostgreSQL      │
│  (Story Generator) │   │   + Prisma ORM    │
└────────────────────┘   └───────────────────┘
```

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Real-time**: Socket.io-client

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express + TypeScript
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: JWT + bcrypt
- **API Documentation**: Swagger/OpenAPI
- **Real-time**: Socket.io

### Database
- **Primary DB**: PostgreSQL 15+
- **Schema Management**: Prisma Migrations

### AI Integration
- **Provider**: Anthropic Claude API
- **Model**: Claude Sonnet 4
- **SDK**: @anthropic-ai/sdk

### DevOps
- **Containerization**: Docker + Docker Compose
- **Process Manager**: PM2
- **Environment**: dotenv

## Core Features

### 1. Problem Management
- **Upload Methods**:
  - CSV/JSON file upload
  - Manual form input
  - Copy-paste text parsing
- **Problem Types**:
  - Multiple choice
  - True/False
  - Short answer
  - Math problems

### 2. AI Story Generation
- **Input**: Educational problem + metadata
- **Processing**:
  1. Analyze problem content and learning objectives
  2. Generate real-life scenario context
  3. Create character dialogue and situations
  4. Design choice branches based on problem options
  5. Generate educational feedback for each choice
- **Output**: Interactive roleplay story JSON

### 3. Story Structure
```json
{
  "id": "uuid",
  "title": "스토리 제목",
  "context": "상황 설정 (배경 스토리)",
  "character": {
    "name": "캐릭터 이름",
    "role": "캐릭터 역할",
    "avatar": "아바타 이미지 URL"
  },
  "scenes": [
    {
      "id": "scene-1",
      "dialogue": "캐릭터 대사",
      "narration": "상황 설명",
      "choices": [
        {
          "id": "choice-1",
          "text": "선택지 1",
          "isCorrect": true,
          "feedback": "피드백 메시지",
          "nextScene": "scene-2"
        }
      ]
    }
  ],
  "originalProblem": {
    "question": "원래 문제",
    "answer": "정답",
    "explanation": "해설"
  }
}
```

### 4. Student Experience
- **Story Player**:
  - Visual novel style interface
  - Character avatars and dialogue boxes
  - Animated transitions
  - Progress indicators
- **Learning Tracking**:
  - Completion rate
  - Accuracy rate
  - Time spent
  - Retry attempts

### 5. Teacher Dashboard
- **Problem Library**: Upload and manage problems
- **Story Gallery**: View generated stories
- **Analytics**: Student performance metrics
- **Customization**: Adjust story themes and difficulty

## Database Schema

### Users
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(STUDENT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  TEACHER
  STUDENT
  ADMIN
}
```

### Problems
```prisma
model Problem {
  id          String   @id @default(uuid())
  teacherId   String
  subject     String
  topic       String
  difficulty  String
  question    String
  type        ProblemType
  options     Json?
  answer      String
  explanation String?
  createdAt   DateTime @default(now())

  teacher     User     @relation(fields: [teacherId], references: [id])
  stories     Story[]
}

enum ProblemType {
  MULTIPLE_CHOICE
  TRUE_FALSE
  SHORT_ANSWER
  MATH
}
```

### Stories
```prisma
model Story {
  id              String   @id @default(uuid())
  problemId       String
  title           String
  storyData       Json     // Full story structure
  theme           String
  generationTime  Int      // milliseconds
  createdAt       DateTime @default(now())

  problem         Problem  @relation(fields: [problemId], references: [id])
  attempts        StudentProgress[]
}
```

### Student Progress
```prisma
model StudentProgress {
  id            String   @id @default(uuid())
  studentId     String
  storyId       String
  completed     Boolean  @default(false)
  isCorrect     Boolean?
  choicesMade   Json
  timeSpent     Int      // seconds
  attempts      Int      @default(1)
  createdAt     DateTime @default(now())

  student       User     @relation(fields: [studentId], references: [id])
  story         Story    @relation(fields: [storyId], references: [id])
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Problems (Teacher)
- `POST /api/problems` - Create problem
- `GET /api/problems` - List problems
- `GET /api/problems/:id` - Get problem details
- `PUT /api/problems/:id` - Update problem
- `DELETE /api/problems/:id` - Delete problem
- `POST /api/problems/upload` - Upload CSV/JSON

### Stories
- `POST /api/stories/generate` - Generate story from problem
- `GET /api/stories` - List stories
- `GET /api/stories/:id` - Get story details
- `PUT /api/stories/:id/regenerate` - Regenerate story

### Student
- `GET /api/student/stories` - Get assigned stories
- `POST /api/student/stories/:id/start` - Start story
- `POST /api/student/stories/:id/choice` - Submit choice
- `GET /api/student/progress` - Get learning progress

### Analytics
- `GET /api/analytics/teacher/overview` - Teacher analytics
- `GET /api/analytics/student/:id` - Student performance

## Story Generation Prompt Strategy

### Claude API Prompt Template
```
You are an expert educational content creator specializing in interactive storytelling.

Transform the following educational problem into an engaging roleplay scenario:

PROBLEM:
Subject: {subject}
Topic: {topic}
Question: {question}
Type: {type}
Options: {options}
Correct Answer: {answer}

REQUIREMENTS:
1. Create a realistic, relatable scenario that naturally incorporates the problem
2. Design a character (name, role, personality) that students can connect with
3. Write engaging dialogue that feels natural and age-appropriate
4. Each choice should clearly map to a problem option
5. Provide constructive feedback for both correct and incorrect choices
6. Keep the tone positive and encouraging
7. Use Korean language for Korean students

OUTPUT FORMAT: JSON
{
  "title": "Story title",
  "context": "Background setting (2-3 sentences)",
  "character": {"name": "...", "role": "...", "personality": "..."},
  "scenes": [...]
}

Generate an immersive learning experience that makes education fun!
```

## Development Phases

### Phase 1: Foundation (Week 1-2)
- ✅ Set up project structure
- ✅ Configure development environment
- ✅ Initialize database with Prisma
- ✅ Implement authentication system

### Phase 2: Core Backend (Week 3-4)
- ✅ Problem CRUD operations
- ✅ Claude API integration
- ✅ Story generation service
- ✅ File upload handling

### Phase 3: Frontend - Teacher (Week 5-6)
- ✅ Teacher dashboard UI
- ✅ Problem creation forms
- ✅ Story preview interface
- ✅ Analytics dashboard

### Phase 4: Frontend - Student (Week 7-8)
- ✅ Story player interface
- ✅ Interactive choice system
- ✅ Progress tracking UI
- ✅ Results and feedback display

### Phase 5: Polish & Testing (Week 9-10)
- ✅ End-to-end testing
- ✅ Performance optimization
- ✅ UI/UX refinements
- ✅ Documentation

### Phase 6: Deployment (Week 11-12)
- ✅ Docker containerization
- ✅ Production environment setup
- ✅ Monitoring and logging
- ✅ User acceptance testing

## Security Considerations

### Authentication & Authorization
- JWT tokens with expiration
- Password hashing with bcrypt (10 rounds)
- Role-based access control (RBAC)
- Secure HTTP headers (helmet.js)

### Data Protection
- Input validation with Zod
- SQL injection prevention (Prisma ORM)
- XSS protection
- CORS configuration
- Rate limiting

### API Security
- API key management for Claude API
- Environment variable protection
- Request size limits
- Timeout configurations

## Performance Optimization

### Frontend
- Code splitting with React.lazy
- Image optimization
- Virtual scrolling for long lists
- Memoization for expensive computations

### Backend
- Database query optimization
- Connection pooling
- Caching with Redis (future)
- Async/await for I/O operations

### AI Integration
- Request queuing for Claude API
- Response caching for identical requests
- Timeout and retry logic
- Cost monitoring

## Monitoring & Logging

### Metrics
- API response times
- Story generation success rate
- User engagement metrics
- Error rates

### Logging
- Request/response logging
- Error tracking
- AI API usage logs
- User activity logs

## Future Enhancements

### Phase 2 Features
- Multi-language support
- Voice narration
- Image generation for scenes
- Social features (sharing stories)
- LMS integration (LTI standard)
- Mobile apps (React Native)

### Advanced AI Features
- Adaptive difficulty adjustment
- Personalized story themes
- Multi-step problem chains
- Collaborative stories

## Success Metrics

### Key Performance Indicators (KPIs)
- **Adoption**: 50+ teachers in first 3 months
- **Engagement**: 80%+ story completion rate
- **Learning**: 20%+ improvement in test scores
- **Satisfaction**: NPS > 50
- **Technical**: 99%+ uptime, <2s generation time

## Conclusion

This architecture provides a solid foundation for a scalable, AI-powered educational platform that transforms traditional problems into engaging interactive experiences. The modular design allows for incremental development and future expansion while maintaining code quality and performance.

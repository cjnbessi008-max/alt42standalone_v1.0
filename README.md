# Adaptive Learning System - Speed-Based Difficulty Adjustment

A standalone web application that automatically adjusts problem difficulty based on student performance, focusing on solution speed and accuracy.

## 🎯 Overview

This system implements an **adaptive learning algorithm** that:
- Tracks student performance in real-time
- Adjusts problem difficulty based on **speed** and **accuracy**
- Provides immediate feedback to students
- Offers comprehensive analytics for teachers

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (routing)
- Axios (API client)

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL (database)
- JWT authentication (ready for implementation)

**Difficulty Adjustment Algorithm:**
- Modified Elo-rating system
- Weighted scoring based on:
  - Recent accuracy (50% weight)
  - Solution speed percentile (30% weight)
  - Performance trend (20% weight)

## 📊 Features

### Student Features
- ✅ Adaptive problem difficulty (5 levels)
- ✅ Real-time feedback on answers
- ✅ Performance metrics tracking
- ✅ Multiple question types (multiple choice, short answer)
- ✅ Hints system
- ✅ Progress visualization

### Teacher Features
- ✅ Dashboard with overview statistics
- ✅ Student performance monitoring
- ✅ Difficulty distribution analysis
- ✅ Individual student progress tracking
- ✅ Performance trend indicators
- ✅ Detailed attempt history

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. **Set up the database**

Create a PostgreSQL database:
```bash
createdb adaptive_learning
```

Run migrations:
```bash
psql -d adaptive_learning -f database/migrations/001_initial_schema.sql
```

Load sample data:
```bash
psql -d adaptive_learning -f database/seeds/001_sample_data.sql
```

3. **Set up the backend**

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

The backend will run on `http://localhost:3000`

4. **Set up the frontend**

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

### Environment Variables

**Backend (.env):**
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=adaptive_learning
DB_USER=postgres
DB_PASSWORD=your-password
```

**Frontend (.env):**
```env
VITE_API_URL=/api
```

## 📖 Usage

### For Students

1. Visit `http://localhost:5173`
2. Select a student profile
3. Solve problems - difficulty will adjust automatically based on your performance
4. View your progress and metrics

### For Teachers

1. Visit `http://localhost:5173`
2. Click "Teacher Dashboard"
3. View all students' progress
4. Click on a student to see detailed information
5. Monitor difficulty adjustments and performance trends

### Sample Student Accounts

The system comes with 5 sample students:
- **Lee Minho** - Difficulty Level 2 (Easy)
- **Choi Yuna** - Difficulty Level 4 (Hard)
- **Jung Seojun** - Difficulty Level 3 (Medium)
- **Kang Jiwoo** - Difficulty Level 1 (Very Easy)
- **Han Dohyun** - Difficulty Level 5 (Very Hard)

## 🧮 Difficulty Adjustment Algorithm

### Levels
1. **Very Easy** (Level 1) - Expected time: 30s
2. **Easy** (Level 2) - Expected time: 45s
3. **Medium** (Level 3) - Expected time: 60s
4. **Hard** (Level 4) - Expected time: 90s
5. **Very Hard** (Level 5) - Expected time: 120s

### Adjustment Criteria

**Difficulty increases when:**
- Accuracy ≥ 85% AND
- Speed percentile ≥ 75 (faster than 75% of expected time)

**Difficulty decreases when:**
- Accuracy ≤ 60% AND
- Speed percentile ≤ 25 (slower than expected)

**Remains stable when:**
- Performance is within normal range

### Metrics Calculated
- **Accuracy Rate**: Correct answers / Total attempts
- **Speed Percentile**: Relative to expected time for difficulty
- **Performance Trend**: Improving / Stable / Declining (based on recent attempts)
- **Adjustment Score**: Weighted combination of all metrics

## 📁 Project Structure

```
alt42standalone_v1.0/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # API controllers
│   │   ├── models/         # Data access layer
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic (difficulty adjustment)
│   │   └── index.ts        # Main application
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── services/      # API client
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   └── vite.config.ts
├── database/              # Database schemas and seeds
│   ├── migrations/
│   └── seeds/
├── shared/                # Shared TypeScript types
│   └── types/
└── README.md
```

## 🧪 API Endpoints

### Student Endpoints
- `GET /api/students/:id` - Get student profile
- `GET /api/students/:id/next-problem` - Get next problem
- `POST /api/students/:id/submit` - Submit answer
- `GET /api/students/:id/progress` - Get progress details

### Teacher Endpoints
- `GET /api/teacher/dashboard` - Get dashboard data
- `GET /api/teacher/students` - Get all students
- `GET /api/teacher/students/:id` - Get student details
- `GET /api/teacher/analytics` - Get system analytics

## 🔧 Configuration

### Difficulty Adjustment Settings

Edit `backend/src/services/difficultyAdjustmentService.ts`:

```typescript
const DEFAULT_CONFIG = {
  minAttemptsBeforeAdjustment: 5,    // Minimum attempts before adjusting
  recentAttemptsWindow: 10,          // Number of recent attempts to consider
  highAccuracyThreshold: 0.85,       // High accuracy threshold (85%)
  lowAccuracyThreshold: 0.60,        // Low accuracy threshold (60%)
  fastSpeedPercentile: 75,           // Fast speed threshold
  slowSpeedPercentile: 25,           // Slow speed threshold
  accuracyWeight: 0.5,               // Weight for accuracy (50%)
  speedWeight: 0.3,                  // Weight for speed (30%)
  trendWeight: 0.2,                  // Weight for trend (20%)
};
```

## 📝 Development

### Adding New Problems

Insert into the database:
```sql
INSERT INTO problems (title, description, type, difficulty, correct_answer, options, tags)
VALUES (
  'Your Problem Title',
  'Problem description',
  'multiple_choice',
  3, -- difficulty level
  'Correct Answer',
  '["Option A", "Option B", "Option C", "Option D"]'::jsonb,
  '["tag1", "tag2"]'::jsonb
);
```

### Running Tests

```bash
cd backend
npm test

cd frontend
npm test
```

## 🎨 Customization

### Styling
- Edit `frontend/tailwind.config.js` for Tailwind customization
- Modify `frontend/src/index.css` for global styles

### Algorithm Tuning
- Adjust weights in `DifficultyAdjustmentService`
- Modify expected times per difficulty level
- Change thresholds for difficulty changes

## 📊 Database Schema

Key tables:
- `users` - All users (students, teachers)
- `students` - Student profiles with performance metrics
- `problems` - Problem bank
- `attempts` - Student attempts with timing
- `difficulty_adjustments` - History of difficulty changes
- `performance_metrics` - Cached performance data

## 🚧 Future Enhancements

- [ ] Authentication system (JWT ready)
- [ ] Real-time updates with WebSockets
- [ ] More problem types (coding, essay)
- [ ] Gamification (badges, achievements)
- [ ] Export to CSV/PDF
- [ ] Mobile app version
- [ ] Multi-language support
- [ ] Advanced analytics dashboards

## 📄 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for adaptive education

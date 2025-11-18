# Impossible Shadow - Division Learning App

**나눌 수 없는 경우가 그림자 효과로 나타나는 교육용 웹앱**

A web application that integrates with Moodle LMS to teach division concepts. Features a virtual smartphone display with realistic "impossible shadow" effects that highlight indivisible cases and division by zero.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Moodle](https://img.shields.io/badge/Moodle-3.7-orange)
![MySQL](https://img.shields.io/badge/MySQL-5.7-blue)
![PHP](https://img.shields.io/badge/PHP-7.1.9-purple)

## 📱 Key Features

### 1. Virtual Smartphone Display
- **Impossible Shadow Effect**: Multi-layered CSS shadows create realistic 3D depth
- **Responsive Device Frame**: Accurate smartphone mockup with notch and bezels
- **Floating Animation**: Subtle 3D rotation and movement
- **Bottom-right positioning**: Non-intrusive display on screen

### 2. Division Problem System
- **Smart Problem Generation**: Adjustable difficulty levels (easy, medium, hard, impossible)
- **Indivisible Case Detection**: Automatically identifies when division has remainders
- **Division by Zero Handling**: Special visualization for impossible operations
- **Shadow Effect Visualization**: Red-tinted overlay with pulsing animation for indivisible cases

### 3. Moodle LMS Integration
- **Student Roster Sync**: Automatic synchronization with Moodle courses
- **Grade Export**: Push student progress back to Moodle gradebook
- **Web Services API**: RESTful integration with Moodle 3.7
- **Activity Logging**: Track all student interactions

## 🏗️ Architecture

```
impossible-shadow/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── VirtualDevice/      # Smartphone display component
│   │   │   │   ├── VirtualDevice.jsx
│   │   │   │   └── VirtualDevice.css  # Impossible shadow effects
│   │   │   └── DivisionProblem/    # Problem interface
│   │   │       ├── DivisionProblem.jsx
│   │   │       └── DivisionProblem.css
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   └── App.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                  # Node.js API server
│   ├── api/
│   │   ├── routes/
│   │   │   ├── moodle.js          # Moodle integration
│   │   │   ├── problems.js        # Problem generation
│   │   │   └── students.js        # Student management
│   │   ├── database/
│   │   │   ├── connection.js      # MySQL connection
│   │   │   ├── schema.sql         # Database schema
│   │   │   └── README.md
│   │   └── server.js
│   └── package.json
│
├── config/
├── docs/
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md
├── .env.example
├── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm/yarn
- MySQL 5.7 or compatible
- Moodle 3.7 with Web Services enabled
- PHP 7.1.9 (for Moodle)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=impossible_shadow

# Moodle
MOODLE_URL=http://localhost/moodle
MOODLE_TOKEN=your_moodle_token

# Server
PORT=5000
FRONTEND_URL=http://localhost:3000
```

3. **Set up the database**

```bash
cd backend/database
mysql -u root -p < schema.sql
```

4. **Install dependencies**

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

5. **Start the application**

```bash
# Terminal 1: Start backend server
cd backend
npm start

# Terminal 2: Start frontend dev server
cd frontend
npm run dev
```

6. **Access the application**

Open your browser and navigate to:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

## 🎨 Impossible Shadow Effect

The "impossible shadow" effect is a CSS technique that creates realistic 3D depth without actual shadows on device edges. It uses:

### Multi-layered Shadows
```css
/* Primary shadow */
.shadow-1 {
  background: radial-gradient(ellipse, rgba(0,0,0,0.35), transparent);
  filter: blur(10px);
  transform: translateZ(-10px);
}

/* Secondary shadow */
.shadow-2 {
  background: radial-gradient(ellipse, rgba(0,0,0,0.25), transparent);
  filter: blur(20px);
  transform: translateZ(-20px);
}

/* Tertiary shadow */
.shadow-3 {
  background: radial-gradient(ellipse, rgba(0,0,0,0.15), transparent);
  filter: blur(30px);
  transform: translateZ(-30px);
}
```

### Indivisible Case Visualization
When a division problem cannot be divided evenly, a special shadow effect appears:

```css
.shadow-effect {
  /* Red-tinted overlay */
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(255, 0, 0, 0.03) 10px,
    rgba(255, 0, 0, 0.03) 20px
  );

  /* Pulsing animation */
  animation: shadowPulse 2s ease-in-out infinite;

  /* Multi-layer shadows */
  box-shadow:
    inset 0 0 30px rgba(255, 0, 0, 0.1),
    inset 0 0 60px rgba(255, 0, 0, 0.05),
    0 0 30px rgba(255, 0, 0, 0.15);
}
```

## 📚 API Endpoints

### Problems

- `GET /api/problems/next` - Get next problem
  - Query params: `studentId`, `difficulty`

- `POST /api/problems/answer` - Submit answer
  - Body: `{ problemId, studentId, answer, dividend, divisor }`

- `GET /api/problems/student/:id/history` - Get student history
  - Query params: `limit` (default: 10)

- `GET /api/problems/stats` - Get statistics
  - Query params: `studentId`

### Moodle Integration

- `GET /api/moodle/info` - Get Moodle site info
- `GET /api/moodle/courses` - Get all courses
- `GET /api/moodle/course/:id/students` - Get course students
- `POST /api/moodle/grade` - Submit grade to Moodle
- `POST /api/moodle/activity/log` - Log activity

### Students

- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student
- `GET /api/students/:id/progress` - Get student progress

## 🔧 Configuration

### Moodle Web Services Setup

1. Enable Web Services in Moodle:
   - Site Administration → Advanced features → Enable web services

2. Enable REST protocol:
   - Site Administration → Plugins → Web services → Manage protocols

3. Create a Web Service:
   - Site Administration → Plugins → Web services → External services
   - Add new service: "Impossible Shadow Integration"

4. Add required functions:
   - `core_webservice_get_site_info`
   - `core_course_get_courses`
   - `core_enrol_get_enrolled_users`
   - `core_grades_update_grades`

5. Create token:
   - Site Administration → Plugins → Web services → Manage tokens
   - Add token for your user
   - Copy token to `.env` file

### MySQL Configuration

The application uses MySQL 5.7 features:
- UTF8MB4 character set for emoji support
- InnoDB engine for transactions
- JSON fields for flexible data storage
- Stored procedures for complex queries
- Views for performance optimization

See `backend/database/README.md` for detailed setup instructions.

## 🎓 Usage Examples

### For Students

1. Open the application
2. A division problem appears in the virtual smartphone
3. If the problem is indivisible:
   - Red shadow effect appears
   - Warning message shows the remainder
4. Enter your answer
5. Get immediate feedback
6. Progress tracked automatically

### For Teachers (via Moodle)

1. Create course in Moodle
2. Enroll students
3. Students access the app (integrated via LTI or standalone)
4. View student progress in Moodle gradebook
5. Analytics available in Moodle reports

## 🧪 Testing

### Test Division Cases

```javascript
// Perfect division
{ dividend: 10, divisor: 2 } // = 5 (no shadow)

// Indivisible
{ dividend: 10, divisor: 3 } // = 3 remainder 1 (shadow effect)

// Division by zero
{ dividend: 10, divisor: 0 } // = impossible (error shadow)
```

### Manual Testing

1. Navigate to http://localhost:3000
2. Observe the virtual smartphone in the bottom-right
3. Try solving different problems
4. Notice the shadow effect on indivisible cases

## 📊 Database Schema

### Key Tables

- **students**: Student information (synced from Moodle)
- **problems**: Generated division problems
- **answers**: Student submissions
- **courses**: Moodle course data
- **sessions**: Learning session tracking
- **activity_log**: Detailed activity logs

### Example Queries

```sql
-- Get student accuracy
SELECT
  name,
  COUNT(*) as total,
  AVG(CASE WHEN correct = 1 THEN 100 ELSE 0 END) as accuracy
FROM students s
JOIN problems p ON s.id = p.student_id
JOIN answers a ON p.id = a.problem_id
GROUP BY s.id;

-- Find impossible problems
SELECT * FROM problems
WHERE divisor = 0 OR is_impossible = 1;
```

## 🐛 Troubleshooting

### Frontend won't start
- Check Node.js version: `node --version` (should be 16+)
- Clear node_modules: `rm -rf node_modules && npm install`
- Check port 3000 is available: `lsof -i :3000`

### Backend connection errors
- Verify MySQL is running: `sudo service mysql status`
- Check database exists: `mysql -u root -p -e "SHOW DATABASES;"`
- Verify credentials in `.env`

### Moodle integration fails
- Verify Web Services are enabled in Moodle
- Check token is valid
- Test token: `curl "http://localhost/moodle/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"`

### Shadow effect not showing
- Clear browser cache
- Check browser console for CSS errors
- Verify browser supports CSS `transform`, `filter`, and `blur`

## 🤝 Contributing

This is part of the AI Education System Pipeline project. See `tasks/0001-prd-ai-education-pipeline.md` for the full product requirements.

## 📝 License

MIT

## 🔗 Related Documentation

- [PRD: AI Education System Pipeline](./tasks/0001-prd-ai-education-pipeline.md)
- [Database Setup Guide](./backend/database/README.md)
- [Moodle Web Services API](https://docs.moodle.org/dev/Web_services)

## 👥 Support

For issues and questions:
- Check the troubleshooting section above
- Review Moodle logs at `/path/to/moodle/admin/tool/log`
- Check application logs in console
- Review database for sync errors: `SELECT * FROM moodle_sync WHERE sync_status = 'failed'`

---

**Built with ❤️ for better mathematics education**

*Integrates seamlessly with Moodle 3.7, MySQL 5.7, and PHP 7.1.9*

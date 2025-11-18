# Blend Difference Animation

A web application for visualizing mathematical function differences using color blending animations, with full LMS (Moodle) integration support.

## Features

- **Interactive Function Visualization**: Compare two mathematical functions with smooth, animated transitions
- **Color Blending Modes**: Six different blend modes (difference, multiply, screen, overlay, add, subtract)
- **Virtual Smartphone Display**: Displays problems in a draggable smartphone interface positioned at the bottom-right
- **LMS Integration**: Full integration with Moodle 3.7 for problem management and student submissions
- **Real-time Animation**: Canvas-based rendering with 60 FPS smooth animations
- **Mathematical Expression Parser**: Supports complex mathematical expressions using math.js

## Technology Stack

### Frontend
- **React 18.2** with TypeScript
- **Vite** for fast development and building
- **Framer Motion** for smooth animations
- **math.js** for mathematical expression evaluation
- **Axios** for API communication

### Backend
- **PHP 7.1.9** compatible
- **MySQL 5.7** database
- **RESTful API** architecture
- **PDO** for secure database operations

### LMS
- **Moodle 3.7** integration
- Web Services API for synchronization

## Project Structure

```
alt42standalone_v1.0/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── BlendDifferenceAnimator.tsx
│   │   │   └── VirtualSmartphone.tsx
│   │   ├── hooks/           # Custom React hooks
│   │   │   └── useLMSIntegration.ts
│   │   ├── utils/           # Utility functions
│   │   │   ├── mathEvaluator.ts
│   │   │   ├── colorBlending.ts
│   │   │   └── canvasUtils.ts
│   │   ├── types/           # TypeScript type definitions
│   │   ├── App.tsx          # Main application component
│   │   └── main.tsx         # Application entry point
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                 # PHP backend API
│   ├── api/
│   │   ├── index.php        # API router
│   │   ├── ProblemController.php
│   │   ├── SubmissionController.php
│   │   └── MoodleController.php
│   ├── config.php           # Configuration
│   └── Database.php         # Database wrapper
│
├── database/                # Database schemas
│   └── schema.sql           # MySQL database schema
│
└── README.md                # This file
```

## Installation

### Prerequisites

- Node.js 16+ and npm
- PHP 7.1.9+
- MySQL 5.7+
- Moodle 3.7 (optional, for LMS integration)

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration (optional):
```bash
cp .env.example .env
```

Edit `.env` to configure LMS integration:
```env
VITE_LMS_ENDPOINT=http://localhost:8080/api
VITE_LMS_API_KEY=your_api_key_here
VITE_LMS_COURSE_ID=1
```

4. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Backend Setup

1. Configure database connection:

Edit `backend/config.php` or set environment variables:
```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=blend_difference_db
export DB_USER=your_username
export DB_PASS=your_password
```

2. Create database and import schema:
```bash
mysql -u root -p < database/schema.sql
```

3. Configure web server (Apache/Nginx):

**Apache (.htaccess):**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ backend/api/index.php [QSA,L]
```

**Nginx:**
```nginx
location /api {
    try_files $uri $uri/ /backend/api/index.php?$args;
}
```

4. Start PHP server (development):
```bash
cd backend
php -S localhost:8080
```

### Moodle Integration Setup

1. Configure Moodle Web Services:
   - Go to Site Administration > Plugins > Web services > Manage protocols
   - Enable REST protocol
   - Create a web service token for your user

2. Update backend configuration:
```bash
export MOODLE_URL=http://your-moodle-site.com
export MOODLE_TOKEN=your_web_service_token
```

3. Create Moodle integration:
```bash
curl -X POST http://localhost:8080/api/moodle \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 1,
    "moodle_course_id": 2,
    "integration_type": "quiz"
  }'
```

## Usage

### Basic Usage

1. Open the application in your browser
2. Select a problem from the problem selector
3. Choose a blend mode from the settings
4. Watch the animation visualize the function differences
5. Toggle the virtual smartphone display for problem details

### Creating Problems via API

```bash
curl -X POST http://localhost:8080/api/problems \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Custom Problem",
    "description": "Compare two functions",
    "function1": "sin(x)",
    "function2": "cos(x)",
    "color1": "#FF5733",
    "color2": "#33C4FF",
    "category": "Trigonometry",
    "difficulty": "medium",
    "hints": ["Hint 1", "Hint 2"]
  }'
```

### Submitting Answers

```bash
curl -X POST http://localhost:8080/api/problems/1/submit \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 123,
    "student_name": "John Doe",
    "answer": "The functions differ by π/2",
    "time_spent": 120
  }'
```

## API Endpoints

### Problems

- `GET /api/problems` - Get all problems
  - Query params: `courseId`, `category`, `difficulty`
- `GET /api/problems/{id}` - Get single problem
- `POST /api/problems` - Create new problem
- `PUT /api/problems/{id}` - Update problem
- `DELETE /api/problems/{id}` - Delete problem
- `POST /api/problems/{id}/submit` - Submit answer
- `GET /api/problems/{id}/stats` - Get problem statistics

### Submissions

- `GET /api/submissions` - Get all submissions
  - Query params: `problemId`, `studentId`
- `GET /api/submissions/{id}` - Get single submission
- `PUT /api/submissions/{id}` - Update submission
- `DELETE /api/submissions/{id}` - Delete submission

### Moodle Integration

- `GET /api/moodle` - Get all integrations
- `GET /api/moodle/{id}` - Get single integration
- `POST /api/moodle` - Create integration
- `PUT /api/moodle/{id}` - Update integration
- `DELETE /api/moodle/{id}` - Delete integration
- `POST /api/moodle/{id}/sync` - Sync with Moodle
- `GET /api/moodle/courses` - Get Moodle courses
- `GET /api/moodle/{courseId}/activities` - Get course activities

## Blend Modes

The application supports six different color blending modes:

1. **Difference**: Shows absolute difference between colors
2. **Multiply**: Multiplies color values
3. **Screen**: Inverse multiply (creates lighter results)
4. **Overlay**: Combination of multiply and screen
5. **Add**: Adds color values together
6. **Subtract**: Subtracts one color from another

## Development

### Building for Production

Frontend:
```bash
cd frontend
npm run build
```

The build output will be in `frontend/dist/`

### Running Tests

```bash
cd frontend
npm test
```

## Database Schema

The application uses the following main tables:

- `problems` - Stores math problems and function definitions
- `problem_hints` - Stores hints for each problem
- `submissions` - Stores student answers and scores
- `moodle_integration` - Maps problems to Moodle activities
- `animation_settings` - Stores animation configuration per problem

See `database/schema.sql` for complete schema details.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Documentation: See `/docs` folder

## Authors

- AI Education System Team
- KAIST Touch Math Academy

## Version

1.0.0 - Initial Release

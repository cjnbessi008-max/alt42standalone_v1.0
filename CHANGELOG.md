# Changelog

All notable changes to the Solution Paint project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-18

### Added
- **Core Features**
  - Interactive HTML5 Canvas drawing interface for inequality solutions
  - Touch and mouse support for drawing on number line
  - Paint, erase, and clear tools
  - Real-time answer validation and scoring

- **Problem Types**
  - Linear inequalities (x > a, x < b, x ≥ a, x ≤ b)
  - Compound inequalities (a < x ≤ b)
  - Multiple difficulty levels (easy, medium, hard)
  - Sample problems included in database

- **User Interface**
  - Smartphone frame UI design (positioned at bottom-right)
  - Responsive design for desktop, tablet, and mobile
  - Beautiful gradient styling
  - Real-time timer and attempt counter
  - Result modal with score and feedback

- **Backend API**
  - `GET /api/get_problem.php` - Fetch problems from database or Moodle
  - `POST /api/submit_answer.php` - Submit answers and get instant grading
  - Automatic partial scoring based on accuracy
  - Detailed feedback system

- **Database**
  - `inequality_problems` table for storing problem data
  - `student_answers` table for tracking student submissions
  - `moodle_config` table for LMS integration settings
  - `learning_logs` table for behavior analytics

- **Moodle Integration**
  - REST API support for fetching problems from Moodle 3.7
  - Automatic grade synchronization
  - Student authentication via Moodle session
  - Configurable via admin interface

- **Installation**
  - Web-based installation wizard (`install.php`)
  - Automatic database creation and schema setup
  - Configuration file generation
  - Moodle setup wizard

- **Documentation**
  - Comprehensive README.md with setup instructions
  - API documentation with request/response examples
  - Database schema documentation
  - Troubleshooting guide

- **Security**
  - SQL injection prevention via PDO prepared statements
  - XSS protection with input sanitization
  - CSRF protection headers
  - Secure password handling

### Technical Stack
- **Backend**: PHP 7.1.9, MySQL 5.7
- **Frontend**: HTML5, CSS3, Vanilla JavaScript ES6+
- **Integration**: Moodle 3.7 REST API

### Project Structure
```
alt42standalone_v1.0/
├── api/                    # Backend API endpoints
├── database/               # SQL schema and migrations
├── js/                     # JavaScript application logic
├── css/                    # Stylesheets
├── assets/                 # Images and icons
├── index.php               # Main application page
├── install.php             # Installation wizard
├── .htaccess              # Apache configuration
└── README.md              # Project documentation
```

## [Unreleased]

### Planned for v1.1.0
- Quadratic inequalities support
- System of inequalities
- Hint system for struggling students
- Admin dashboard for teachers
- Export student data to CSV/Excel

### Planned for v2.0.0
- AI-powered problem generation
- Personalized learning paths
- Gamification elements (badges, leaderboard)
- Multi-language support (English, Korean, etc.)
- Native mobile apps (iOS, Android)

## Development Notes

### Version Naming Convention
- **Major** (X.0.0): Breaking changes or major feature additions
- **Minor** (1.X.0): New features, backward compatible
- **Patch** (1.0.X): Bug fixes and minor improvements

### Git Branch Strategy
- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical production fixes

### Contributing
See [README.md](README.md) for contribution guidelines.

---

[1.0.0]: https://github.com/yourrepo/solution-paint/releases/tag/v1.0.0

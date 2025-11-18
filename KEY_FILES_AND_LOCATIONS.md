# ALT42 Standalone v1.0 - Key Files & Locations Guide

## Current Repository Files

### Root Level
```
/home/user/alt42standalone_v1.0/
├── .git/                                      # Git repository metadata
│
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md     # Main PRD (1,262 lines)
│       Contains: 6-phase pipeline specification, functional requirements,
│       technology stack, success metrics, development timeline
│
├── CODEBASE_STRUCTURE.md                      # [NEW] Comprehensive overview
├── ARCHITECTURE_DIAGRAM.txt                   # [NEW] Visual architecture
└── KEY_FILES_AND_LOCATIONS.md                 # [NEW] This file
```

## Files in Related Feature Branches

### Moodle Integration Branch
**Branch**: `origin/claude/moodle-auto-display-problems-012KbgrrXtt2ebBb2terzSrw`

```
Root Files:
├── README.md                    # Installation and usage guide (Korean/English)
├── INSTALL.md                   # Detailed setup instructions
└── .gitignore                   # Git ignore patterns

Configuration:
├── config/
│   ├── config.php              # Main configuration file (PHP array)
│   └── .env.example            # Environment variables template

Source Code (Backend):
├── src/
│   ├── autoload.php            # PSR-4 autoloader
│   ├── Database/
│   │   └── Connection.php      # PDO connection manager (singleton pattern)
│   └── Services/
│       ├── CacheService.php    # File-based caching service
│       └── QuestionService.php # Question retrieval service
│
Public/Frontend:
├── public/
│   ├── index.php               # Main HTML entry point
│   ├── api.php                 # REST API endpoint gateway
│   └── css/
│       └── style.css           # Styling for question display

Cache Directory (created during setup):
└── cache/                       # File-based cache storage (needs 755 permissions)
```

**Key Files Summary**:
- **config/config.php** (90 lines)
  - Database connection settings
  - Cache configuration
  - Display options
  - Performance tuning parameters
  
- **src/Database/Connection.php** (150 lines)
  - Singleton pattern implementation
  - PDO initialization with prepared statements
  - Error handling and logging
  - Charset configuration (utf8mb4)
  
- **src/Services/QuestionService.php** (200 lines)
  - Query optimization for Moodle questions
  - Cache integration
  - Pagination support
  - Category filtering
  
- **src/Services/CacheService.php** (100 lines)
  - File-based cache management
  - TTL handling
  - Cache key generation
  
- **public/api.php** (150 lines)
  - RESTful API endpoint handling
  - Query parameter parsing
  - Response formatting (JSON)

### Animation/Gesture Branch
**Branch**: `origin/claude/add-infinity-breath-animation-01JsHcZ7bPDGdRRApkgfwrzz`

```
Root Files:
├── README.md                    # Animation system documentation
├── index.html                   # Main HTML page
├── app.js                       # JavaScript application logic
└── styles.css                   # CSS including animations

Key JavaScript Classes:
├── LMS_CONFIG                   # Configuration object
├── AppState                     # State management class
└── LMSConnector                 # Moodle API communication class
```

**Key Files Summary**:
- **index.html** (200 lines)
  - Virtual smartphone frame HTML
  - Notch simulation
  - Responsive layout structure
  - Status bar and header
  - Content area with animations
  
- **app.js** (400 lines)
  - LMS configuration
  - AppState class for state management
  - LMSConnector class for API communication
  - Progress tracking
  - Animation event handlers
  
- **styles.css** (500 lines)
  - .smartphone-frame (device dimensions)
  - .screen-content (display area)
  - .app-header (branded header)
  - .progress-fill (progress bar)
  - @keyframes infinity-breath (animation)
  - @keyframes gradient-rotate (gradient animation)

## Configuration & Environment Files

### .env Template Structure
```ini
# Moodle Database Connection
MOODLE_DB_HOST=localhost
MOODLE_DB_PORT=3306
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=moodle_user
MOODLE_DB_PASS=your_password

# LMS Settings
MOODLE_API_ENDPOINT=/moodle/webservice/rest/server.php
MOODLE_WS_TOKEN=your_generated_token

# Application Settings
APP_DEBUG=true
LOG_LEVEL=debug
CACHE_TTL=3600
```

### Database Connection String Format
```
PDO DSN: mysql:host=localhost;port=3306;dbname=moodle;charset=utf8mb4
User: moodle_user (MySQL user with SELECT privileges)
Options: Prepared statements enabled, error mode exception
```

## API Endpoints (From Moodle Branch)

### Question Retrieval
```
GET /api.php?action=questions&page=1&category=5
GET /api.php?action=question&id=123
GET /api.php?action=categories
GET /api.php?action=quiz_questions&quiz_id=5
POST /api.php?action=clear_cache
```

## Moodle Database Tables Referenced

The system connects to these standard Moodle tables:
```
mdl_question              - Question bank
mdl_question_categories   - Question categories
mdl_quiz_slots            - Quiz question assignments
mdl_question_attempts     - Student answer attempts
mdl_quiz                  - Quiz definitions
```

## Important Configuration Constants

### PHP Configuration (config/config.php)
```php
'moodle_db' => [
    'prefix' => 'mdl_',           // Moodle table prefix
    'charset' => 'utf8mb4',       // Character encoding
]

'cache' => [
    'enabled' => true,
    'driver' => 'file',
    'ttl' => 3600,                // 1 hour cache
]

'display' => [
    'per_page' => 10,             // Questions per page
    'order_by' => 'name',         // Sort column
]

'performance' => [
    'enable_query_cache' => true,
    'max_questions_per_query' => 100,
    'use_prepared_statements' => true,
]
```

### JavaScript Configuration (app.js)
```javascript
const LMS_CONFIG = {
    apiEndpoint: '/moodle/webservice/rest/server.php',
    wsToken: '', // Must be configured
    format: 'json'
}
```

## Installation Files

### From Moodle Branch
```
INSTALL.md                        # Step-by-step setup
├── System Requirements
│   ├── PHP 7.1.9+
│   ├── MySQL 5.7+
│   ├── Moodle 3.7
│   └── Apache/Nginx
│
├── Setup Steps
│   ├── Clone repository
│   ├── Copy .env.example to .env
│   ├── Create cache directory
│   ├── Configure web server
│   └── Set permissions
│
└── Verification
    ├── Database connectivity test
    ├── Cache directory test
    └── API endpoint test
```

## Documentation Files

### Primary Documentation
```
/home/user/alt42standalone_v1.0/
├── tasks/0001-prd-ai-education-pipeline.md   # Full PRD
├── CODEBASE_STRUCTURE.md                      # Architecture overview
├── ARCHITECTURE_DIAGRAM.txt                   # Visual diagrams
└── KEY_FILES_AND_LOCATIONS.md                 # This file
```

### Inline Documentation
```
- Code comments (PHP, JavaScript)
- PHPDoc blocks in classes
- JSDoc comments in JavaScript files
- CSS comments for animations
- README files in each feature branch
```

## Security-Related Files

### Configuration Protection
```
config/.env              # NEVER commit (use .gitignore)
config/.env.example      # Safe template to commit
.gitignore              # Prevents .env commits
```

### Database Credentials
```
Stored in: config/.env (environment variables)
Accessed in: config/config.php (via getenv())
Usage: Database\Connection.php (PDO initialization)
```

## Cache Files Location

```
/home/user/alt42standalone_v1.0/cache/
└── *.cache              # Generated cache files (auto-created)
```

Required permissions:
```bash
chmod 755 cache/        # Directory readable by web server
chown www-data:www-data cache/  # Web server ownership (if needed)
```

## Testing & Debugging Files

### From Moodle Branch
```
No dedicated test files in current implementation
Test execution via:
  1. Manual API calls to /api.php
  2. Browser access to index.php
  3. Database query verification
```

## Development & Deployment

### Source Control
```
.git/
├── config              # Git configuration
├── objects/            # Commits, trees, blobs
├── refs/               # Branch references
│   ├── heads/          # Local branches
│   └── remotes/        # Remote branches
└── hooks/              # Git hooks (pre-commit, etc.)
```

### Remote Repository
```
Remote URL: http://127.0.0.1:38387/git/cjnbessi008-max/alt42standalone_v1.0

Related Branches:
├── Moodle Integration (3 branches)
├── Animations & Gestures (60+ branches)
├── LMS Features (20+ branches)
└── Mathematical Visualizations (multiple branches)
```

## Build & Deployment Files

### Planned (From PRD)
```
docker/                          # Docker configuration (Planned)
├── Dockerfile                   # Container image definition
├── docker-compose.yml           # Multi-container setup
└── .dockerignore

kubernetes/                      # K8s config (Phase 2)
ci-cd/                          # GitHub Actions (Planned)
```

## Quick Reference Commands

### View PRD
```bash
cat /home/user/alt42standalone_v1.0/tasks/0001-prd-ai-education-pipeline.md
```

### View Architecture
```bash
cat /home/user/alt42standalone_v1.0/ARCHITECTURE_DIAGRAM.txt
```

### Explore Feature Branches
```bash
git fetch origin claude/moodle-auto-display-problems-012KbgrrXtt2ebBb2terzSrw
git show origin/claude/moodle-auto-display-problems-012KbgrrXtt2ebBb2terzSrw:config/config.php
git show origin/claude/moodle-auto-display-problems-012KbgrrXtt2ebBb2terzSrw:src/Database/Connection.php
```

### Check All Branches
```bash
git branch -r | grep -E "moodle|animation|gesture|lms"
```

## File Size Reference

```
tasks/0001-prd-ai-education-pipeline.md          ~50 KB
CODEBASE_STRUCTURE.md (created)                  ~32 KB
ARCHITECTURE_DIAGRAM.txt (created)               ~18 KB

Expected in feature branches:
- config/config.php                              ~2 KB
- src/Database/Connection.php                    ~5 KB
- src/Services/QuestionService.php               ~8 KB
- src/Services/CacheService.php                  ~3 KB
- public/api.php                                 ~6 KB
- public/index.php                               ~8 KB
- app.js                                         ~12 KB
- styles.css                                     ~15 KB
```

## Access Rights & Permissions

### Directory Permissions
```
Repository root         755 (rx-rx-rx)
cache/                  755 (rwxr-xr-x) - needs write access
public/                 755
src/                    755
config/                 755
.env (if exists)        600 (rw-------)  - private, no group/other access
```

### File Permissions
```
.env                    600 (credentials - read-write only)
*.php                   644 (read for all)
*.js                    644 (read for all)
*.css                   644 (read for all)
.gitignore              644 (read for all)
```

---

**Last Updated**: 2025-11-18
**Status**: Early Development Phase
**Main Documentation**: See CODEBASE_STRUCTURE.md for comprehensive overview

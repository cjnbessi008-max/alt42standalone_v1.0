# Installation Guide

Complete installation guide for the AI Thinking Routine Engine.

## Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 20.04+ recommended) or macOS
- **RAM**: Minimum 4GB, recommended 8GB
- **Storage**: 10GB free space
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+

### Software Requirements
- **Moodle**: Version 3.7+ with PHP 7.1.9+
- **MySQL**: Version 5.7 (for Moodle)
- **Python**: Version 3.11+ (for manual installation)
- **PostgreSQL**: Version 15+ (managed by Docker)
- **Redis**: Version 7+ (managed by Docker)

### API Keys
- **Anthropic API Key**: Required for AI features
  - Sign up at: https://console.anthropic.com/
  - Generate API key from dashboard

## Installation Methods

Choose one of the following installation methods:

### Method 1: Docker Compose (Recommended)

#### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

#### Step 2: Configure Environment
```bash
cd thinking-routine-engine
cp .env.example .env
```

Edit `.env` file with your configuration:
```bash
nano .env
```

**Required Variables:**
```env
# Moodle Database
MOODLE_DB_HOST=your_moodle_mysql_host
MOODLE_DB_PORT=3306
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=moodle_readonly
MOODLE_DB_PASSWORD=your_secure_password

# Claude AI
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

#### Step 3: Start Services
```bash
cd ..
docker-compose up -d
```

This will start:
- Thinking Routine API (port 8000)
- PostgreSQL (port 5432)
- Redis (port 6379)
- Optional: Moodle + MySQL (ports 8080, 3306)

#### Step 4: Verify Installation
```bash
# Check service status
docker-compose ps

# Test API health
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","timestamp":"2024-11-18T..."}
```

#### Step 5: View Logs
```bash
docker-compose logs -f thinking-routine-api
```

### Method 2: Manual Installation

#### Step 1: Install Python Dependencies
```bash
cd thinking-routine-engine

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### Step 2: Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql-15 postgresql-contrib

# macOS
brew install postgresql@15
```

**Create Database:**
```bash
sudo -u postgres psql
CREATE DATABASE thinking_routine;
CREATE USER thinking_routine_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE thinking_routine TO thinking_routine_user;
\q
```

#### Step 3: Install Redis
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Start Redis
redis-server
```

#### Step 4: Configure Environment
```bash
cp .env.example .env
nano .env
```

Update database connection strings:
```env
APP_DB_HOST=localhost
APP_DB_PORT=5432
APP_DB_NAME=thinking_routine
APP_DB_USER=thinking_routine_user
APP_DB_PASSWORD=your_password

REDIS_HOST=localhost
REDIS_PORT=6379
```

#### Step 5: Run Application
```bash
# Development mode
python main.py

# Production mode with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Moodle Plugin Installation

### Step 1: Copy Plugin Files
```bash
# From repository root
cp -r moodle-integration/local/thinkroutine /path/to/your/moodle/local/
```

### Step 2: Set Permissions
```bash
cd /path/to/your/moodle/local/thinkroutine
chmod -R 755 .
chown -R www-data:www-data .  # Adjust user/group as needed
```

### Step 3: Install via Moodle Admin
1. Log in to Moodle as administrator
2. Navigate to: **Site administration > Notifications**
3. Click **Update Moodle database now**
4. Verify plugin appears in installed plugins list

### Step 4: Enable Web Services
1. Navigate to: **Site administration > Server > Web services > Overview**
2. Enable web services
3. Create a web service:
   - Name: "Thinking Routine Service"
   - Enabled: Yes
   - Authorized users only: No (or configure as needed)
4. Add functions:
   - `local_thinkroutine_get_student_activity`
   - `local_thinkroutine_get_course_analytics`
   - `local_thinkroutine_analyze_learning_patterns`

### Step 5: Create Service Token (Optional)
If using Moodle web services instead of direct database access:
1. Navigate to: **Site administration > Server > Web services > Manage tokens**
2. Create token for your integration user
3. Copy token to application configuration

## Database Configuration

### Moodle Database User (Read-Only)

**Create Read-Only User:**
```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create read-only user
CREATE USER 'moodle_readonly'@'%' IDENTIFIED BY 'secure_password';
GRANT SELECT ON moodle.* TO 'moodle_readonly'@'%';
FLUSH PRIVILEGES;
```

**Test Connection:**
```bash
mysql -h localhost -u moodle_readonly -p moodle
```

### PostgreSQL Analytics Database

**Create Tables:**
```bash
# Tables are auto-created by application
# Or manually run:
cd thinking-routine-engine
python -c "from database import app_engine; from models.app_models import AppBase; AppBase.metadata.create_all(bind=app_engine)"
```

### Index Optimization (Recommended)

**Add indexes to Moodle database for better performance:**
```sql
-- Logstore indexes
CREATE INDEX idx_logstore_userid_time ON mdl_logstore_standard_log(userid, timecreated);
CREATE INDEX idx_logstore_courseid_time ON mdl_logstore_standard_log(courseid, timecreated);

-- Quiz indexes
CREATE INDEX idx_quiz_attempts_user_finish ON mdl_quiz_attempts(userid, timefinish);

-- Grade indexes
CREATE INDEX idx_grade_grades_user_time ON mdl_grade_grades(userid, timemodified);
```

## Post-Installation Configuration

### 1. Configure CORS
Edit `.env`:
```env
CORS_ORIGINS=http://localhost:3000,https://yourmoodle.com
```

### 2. Adjust Analysis Parameters
```env
TOP_PERFORMER_PERCENTILE=10.0       # Top 10% of students
MIN_SESSIONS_FOR_ANALYSIS=5         # Minimum sessions needed
SESSION_GAP_MINUTES=30              # Gap between sessions
ANALYSIS_LOOKBACK_DAYS=90           # Analysis period
```

### 3. AI Model Configuration
```env
CLAUDE_MODEL=claude-3-sonnet-20240229
CLAUDE_MAX_TOKENS=4096
CLAUDE_TEMPERATURE=0.7
```

### 4. Security Configuration
```env
SECRET_KEY=generate_random_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Generate secure secret key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Verification Checklist

- [ ] API responds to health check: `http://localhost:8000/health`
- [ ] Database connections successful (check logs)
- [ ] Redis connection working
- [ ] Moodle plugin installed and visible
- [ ] Can fetch student analysis data
- [ ] AI service generates recommendations
- [ ] No errors in application logs

## Testing Installation

### 1. Test API Endpoints

**Health Check:**
```bash
curl http://localhost:8000/health
```

**Get Student Analysis:**
```bash
curl "http://localhost:8000/api/v1/students/123/analysis?course_id=5"
```

**Get Course Analytics:**
```bash
curl "http://localhost:8000/api/v1/courses/5/analytics"
```

### 2. Test Moodle Plugin

**Via Moodle Web Interface:**
1. Navigate to course
2. Check if "Thinking Routine" block appears (if block added)
3. View student reports

**Via Web Services:**
```bash
# Using wstoken
curl "https://yourmoodle.com/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=local_thinkroutine_get_student_activity&moodlewsrestformat=json&userid=123"
```

## Troubleshooting

### Issue: Cannot connect to Moodle database
**Solution:**
1. Verify MySQL is running: `systemctl status mysql`
2. Check credentials in `.env`
3. Test connection: `mysql -h HOST -u USER -p DATABASE`
4. Check firewall rules

### Issue: Anthropic API errors
**Solution:**
1. Verify API key is valid
2. Check API usage limits
3. Review error in logs: `docker-compose logs thinking-routine-api`

### Issue: Permission denied errors
**Solution:**
```bash
# Fix permissions
chmod -R 755 thinking-routine-engine/
chmod 600 thinking-routine-engine/.env
```

### Issue: Port already in use
**Solution:**
```bash
# Check what's using the port
sudo lsof -i :8000

# Change port in docker-compose.yml
ports:
  - "8001:8000"  # Host:Container
```

## Upgrading

### Docker Installation
```bash
cd alt42standalone_v1.0
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d
```

### Manual Installation
```bash
git pull origin main
cd thinking-routine-engine
source venv/bin/activate
pip install -r requirements.txt --upgrade
python main.py
```

## Uninstallation

### Remove Docker Services
```bash
docker-compose down -v  # -v removes volumes
docker rmi alt42standalone_v1.0_thinking-routine-api
```

### Remove Moodle Plugin
```bash
rm -rf /path/to/moodle/local/thinkroutine
# Then run Moodle notifications to clean up database
```

### Remove Databases
```bash
# PostgreSQL
sudo -u postgres psql
DROP DATABASE thinking_routine;
DROP USER thinking_routine_user;
\q

# Redis data
redis-cli FLUSHALL
```

## Next Steps

After successful installation:
1. Read [API Documentation](API.md)
2. Review [Architecture](ARCHITECTURE.md)
3. Configure frontend integration
4. Set up monitoring and logging
5. Review security best practices

## Support

- **Issues**: GitHub Issues
- **Documentation**: `/docs` folder
- **Community**: [Moodle Forums]

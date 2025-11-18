# Setup Guide - AI Education System Pipeline

## Quick Setup (Docker - Recommended)

### 1. Prerequisites
- Docker Desktop or Docker Engine with Docker Compose
- Git

### 2. Clone and Configure
```bash
# Clone repository
git clone <repository-url>
cd alt42standalone_v1.0

# Copy environment file
cp .env.example .env
```

### 3. Start Services
```bash
# Build and start all containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Initialize Database
```bash
# Run database migrations (when available)
docker-compose exec backend alembic upgrade head

# Or manually create tables (current approach)
# Tables are auto-created on first run
```

### 5. Access Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Redoc**: http://localhost:8000/redoc

### 6. Stop Services
```bash
# Stop containers
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

## Local Development Setup

### Backend Setup

1. **Install Python 3.11+**
   ```bash
   python --version  # Should be 3.11 or higher
   ```

2. **Create Virtual Environment**
   ```bash
   cd backend
   python -m venv venv

   # Activate (Linux/Mac)
   source venv/bin/activate

   # Activate (Windows)
   venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up PostgreSQL**
   ```bash
   # Option 1: Use Docker
   docker run --name ai-edu-postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=ai_education_system \
     -p 5432:5432 \
     -d postgres:15-alpine

   # Option 2: Install locally and create database
   createdb ai_education_system
   ```

5. **Set up Redis**
   ```bash
   # Option 1: Use Docker
   docker run --name ai-edu-redis \
     -p 6379:6379 \
     -d redis:7-alpine

   # Option 2: Install locally
   # Follow Redis installation guide for your OS
   ```

6. **Configure Environment**
   ```bash
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_education_system"
   export REDIS_URL="redis://localhost:6379/0"
   ```

7. **Run Development Server**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup

1. **Install Node.js 20+**
   ```bash
   node --version  # Should be 20 or higher
   npm --version
   ```

2. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Access Frontend**
   - Open browser to http://localhost:3000

## Database Migrations (Future)

### Setup Alembic
```bash
cd backend

# Initialize Alembic (already done)
# alembic init alembic

# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## LMS Integration Setup

### 1. Configure LMS (Canvas Example)

1. Go to Canvas Admin → Developer Keys
2. Create new LTI Key:
   - Key Name: "AI Education System"
   - Owner Email: your-email@domain.com
   - Redirect URIs: `https://your-domain.com/api/lms/lti/launch`
   - Configure these LTI Advantage services:
     - Can create and view assignment data in the gradebook (for grade passback)
     - Can view assignment data in the gradebook (for reading grades)
     - Can retrieve user data associated with the context (for roster)

3. Note down:
   - Client ID
   - Deployment ID

### 2. Add LMS Configuration to Database

```python
# Using Python shell or database client
from app.models.lms_integration import LMSIntegration
from app.db.session import SessionLocal

db = SessionLocal()

lms_config = LMSIntegration(
    name="Canvas KAIST",
    lms_type="canvas",
    issuer="https://canvas.kaist.ac.kr",
    client_id="your-client-id",
    auth_login_url="https://canvas.kaist.ac.kr/api/lti/authorize_redirect",
    auth_token_url="https://canvas.kaist.ac.kr/login/oauth2/token",
    key_set_url="https://canvas.kaist.ac.kr/api/lti/security/jwks",
    deployment_id="your-deployment-id",
    is_active=True
)

db.add(lms_config)
db.commit()
```

### 3. Install Tool in Canvas

1. Go to Course Settings → Apps
2. Add App → By Client ID
3. Enter the Client ID from step 1
4. Configure tool placement (e.g., Course Navigation)

### 4. Test Integration

1. Click the tool link in Canvas
2. Should redirect through LTI launch
3. User should be automatically logged in
4. Student data should sync from Canvas

## Troubleshooting

### Backend Issues

**Database Connection Failed**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Test connection
psql -h localhost -U postgres -d ai_education_system
```

**Module Import Errors**
```bash
# Ensure you're in virtual environment
which python  # Should show venv path

# Reinstall dependencies
pip install --force-reinstall -r requirements.txt
```

### Frontend Issues

**Dependencies Installation Failed**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build Errors**
```bash
# Check Node version
node --version  # Should be 20+

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Docker Issues

**Container Won't Start**
```bash
# Check logs
docker-compose logs [service-name]

# Rebuild containers
docker-compose up -d --build

# Remove and recreate
docker-compose down
docker-compose up -d
```

**Port Already in Use**
```bash
# Find process using port
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill process or change port in docker-compose.yml
```

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Backend: Edit files in `backend/app/`
- Frontend: Edit files in `frontend/src/`

### 3. Test Changes
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run test
```

### 4. Commit and Push
```bash
git add .
git commit -m "Description of changes"
git push origin feature/your-feature-name
```

### 5. Create Pull Request
- Go to repository
- Create PR from feature branch to main branch

## Production Deployment

### Using Docker Compose

1. **Update Environment**
   ```bash
   # Production .env file
   DATABASE_URL=postgresql://prod_user:secure_password@db_host:5432/prod_db
   SECRET_KEY=generate-secure-key-here
   ```

2. **Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Using Kubernetes (Future)

Documentation coming soon.

## Monitoring and Maintenance

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Database Backup
```bash
# Backup
docker-compose exec postgres pg_dump -U postgres ai_education_system > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres ai_education_system < backup.sql
```

### Health Checks
```bash
# API health
curl http://localhost:8000/health

# Database
docker-compose exec postgres pg_isready

# Redis
docker-compose exec redis redis-cli ping
```

## Support

For issues or questions:
1. Check this setup guide
2. Review README.md
3. Check API documentation at /docs
4. Contact development team

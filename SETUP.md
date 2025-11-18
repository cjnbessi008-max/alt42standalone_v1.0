# Setup Guide - Focus Analysis System

## Quick Start (Docker)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd alt42standalone_v1.0

# Copy environment file
cp backend/.env.example backend/.env
```

### 2. Configure Environment Variables
Edit `backend/.env`:
```bash
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/focus_analysis_db
POSTGRES_USER=user
POSTGRES_PASSWORD=your_strong_password_here  # CHANGE THIS!
POSTGRES_DB=focus_analysis_db

# Redis
REDIS_URL=redis://redis:6379/0

# JWT Security
SECRET_KEY=your-secret-key-here-change-in-production  # CHANGE THIS!
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
```

### 3. Start Services
```bash
docker-compose up -d
```

### 4. Initialize Database
```bash
# Wait for PostgreSQL to be ready (about 10 seconds)
sleep 10

# Run database initialization
docker exec -it focus_analysis_backend python /app/database/init_db.py
```

### 5. Verify Installation
```bash
# Check all services are running
docker-compose ps

# Expected output:
# focus_analysis_backend    running   0.0.0.0:8000->8000/tcp
# focus_analysis_frontend   running   0.0.0.0:3000->3000/tcp
# focus_analysis_db         running   0.0.0.0:5432->5432/tcp
# focus_analysis_redis      running   0.0.0.0:6379->6379/tcp

# Test backend API
curl http://localhost:8000/health
# Expected: {"status":"healthy"}

# Test frontend
curl http://localhost:3000
# Expected: HTML content
```

### 6. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Manual Setup (Development)

### Backend Setup

#### 1. Prerequisites
- Python 3.11 or higher
- PostgreSQL 15 or higher
- Redis 7 or higher

#### 2. Create Virtual Environment
```bash
cd backend
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Setup Database
```bash
# Create PostgreSQL database
createdb focus_analysis_db

# Or using psql:
psql -U postgres
CREATE DATABASE focus_analysis_db;
\q

# Run migrations
python ../database/init_db.py
```

#### 5. Run Backend Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

#### 1. Prerequisites
- Node.js 20 or higher
- npm or yarn

#### 2. Install Dependencies
```bash
cd frontend
npm install
```

#### 3. Configure Environment
Create `frontend/.env.local`:
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

#### 4. Run Development Server
```bash
npm run dev
```

Frontend will be available at http://localhost:3000

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Common Issues

### Issue: Database Connection Failed
**Solution**: Check PostgreSQL is running and credentials are correct
```bash
# Check PostgreSQL status
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Issue: Backend Import Errors
**Solution**: Ensure backend directory is in Python path
```bash
# Add to PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:/path/to/alt42standalone_v1.0"
```

### Issue: Frontend CORS Errors
**Solution**: Check BACKEND_CORS_ORIGINS in backend/.env includes frontend URL
```bash
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

### Issue: Port Already in Use
**Solution**: Change ports in docker-compose.yml or stop conflicting services
```bash
# Check what's using port 8000
lsof -i :8000

# Or on Windows:
netstat -ano | findstr :8000
```

## Production Deployment

### Security Checklist
- [ ] Change SECRET_KEY to a strong random value
- [ ] Change database passwords
- [ ] Enable HTTPS/TLS
- [ ] Set DEBUG=False in backend
- [ ] Configure proper CORS origins
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure firewall rules

### Environment Variables for Production
```bash
# Backend
SECRET_KEY=<generate-strong-random-key>
DATABASE_URL=postgresql://user:password@db-host:5432/focus_analysis_db
REDIS_URL=redis://redis-host:6379/0
BACKEND_CORS_ORIGINS=["https://yourdomain.com"]

# Frontend
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

### Deployment Options
1. **Docker Swarm**: Scale services horizontally
2. **Kubernetes**: For large-scale deployments
3. **Cloud Platforms**: AWS ECS, Google Cloud Run, Azure Container Instances
4. **Traditional Servers**: Nginx + Gunicorn for backend, Nginx for frontend

## Database Backup

```bash
# Backup
docker exec focus_analysis_db pg_dump -U user focus_analysis_db > backup.sql

# Restore
docker exec -i focus_analysis_db psql -U user focus_analysis_db < backup.sql
```

## Monitoring

### Health Checks
- Backend: http://localhost:8000/health
- Database: `docker-compose exec postgres pg_isready`
- Redis: `docker-compose exec redis redis-cli ping`

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

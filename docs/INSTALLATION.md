# Installation Guide

## Prerequisites

- Docker & Docker Compose (recommended)
- OR: Python 3.11+, Node.js 18+, PostgreSQL 15+

## Option 1: Docker Installation (Recommended)

### 1. Clone the repository

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Configure environment variables

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `.env` files with your configuration:
- `MOODLE_URL`: Your Moodle instance URL
- `MOODLE_TOKEN`: Web service token from Moodle

### 3. Start the application

```bash
docker-compose up -d
```

### 4. Access the application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### 5. Initialize the database

The database tables will be created automatically on first run.

## Option 2: Manual Installation

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

5. Set up PostgreSQL:
```bash
# Create database
createdb loop_detector

# Update DATABASE_URL in .env
```

6. Run the application:
```bash
uvicorn app.main:app --reload
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with backend URL
```

4. Start development server:
```bash
npm start
```

## Verification

1. Open http://localhost:3000
2. Click "Load Example" to load sample PHP code
3. Click "Analyze Code" to test the analysis
4. You should see analysis results with detected inefficiencies

## Troubleshooting

### Backend won't start

- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Check logs: `docker-compose logs backend`

### Frontend won't connect to backend

- Verify REACT_APP_API_URL in frontend/.env
- Check backend is running on port 8000
- Check CORS settings in backend/app/core/config.py

### Database connection errors

- Ensure PostgreSQL is running
- Check credentials in .env
- Wait for PostgreSQL to be ready (healthcheck)

## Production Deployment

### Security Checklist

- [ ] Change SECRET_KEY in backend/.env
- [ ] Use strong database password
- [ ] Enable HTTPS (use reverse proxy like Nginx)
- [ ] Restrict CORS_ORIGINS to your domain
- [ ] Set DEBUG=False in production
- [ ] Configure firewall rules
- [ ] Set up SSL for PostgreSQL connection

### Environment Setup

```bash
# Backend
export DEBUG=False
export SECRET_KEY=<strong-secret-key>
export DATABASE_URL=postgresql://user:pass@host/dbname

# Frontend
export REACT_APP_API_URL=https://api.yourdomain.com
```

### Build for production

```bash
# Backend - use gunicorn or uvicorn with workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Frontend - create production build
cd frontend
npm run build
# Serve build/ directory with Nginx or similar
```

## Next Steps

- Configure Moodle integration (see MOODLE_INTEGRATION.md)
- Set up user authentication
- Configure monitoring and logging
- Set up automated backups

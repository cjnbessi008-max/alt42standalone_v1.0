# Setup Guide

## Prerequisites

- Docker & Docker Compose installed
- OR: Python 3.11+, Node.js 18+, PostgreSQL 15+

## Quick Start with Docker

1. **Clone and navigate to the project:**
   ```bash
   cd /home/user/alt42standalone_v1.0
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database on port 5432
   - FastAPI backend on port 8000
   - React frontend on port 3000

3. **Check services are running:**
   ```bash
   docker-compose ps
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

5. **Import sample data:**
   - Go to the "Import Data" tab in the web interface
   - Upload `docs/sample_students.csv`
   - Then upload `docs/sample_sessions.csv`

6. **Run bias analyses:**
   - Navigate through the different analysis tabs
   - Click "Run Analysis" buttons to see results

## Local Development Setup

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up database
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/concept_tool_bias"

# Run migrations (database will be created automatically)
uvicorn app.main:app --reload
```

Backend will be available at http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend will be available at http://localhost:3000

### Database Setup (if running locally)

```bash
# Create database
psql -U postgres
CREATE DATABASE concept_tool_bias;
\q

# Initialize schema
psql -U postgres -d concept_tool_bias -f database/init.sql
```

## Importing Data

### Via Web Interface

1. Go to http://localhost:3000
2. Click "Import Data" tab
3. Upload CSV files in order:
   - First: students CSV
   - Second: sessions CSV

### Via API

**Import Students:**
```bash
curl -X POST http://localhost:8000/api/import/csv/students \
  -F "file=@docs/sample_students.csv"
```

**Import Sessions:**
```bash
curl -X POST http://localhost:8000/api/import/csv/sessions \
  -F "file=@docs/sample_sessions.csv"
```

## Running Analyses

### Via Web Interface

Simply click through the analysis tabs and run each analysis type.

### Via API

**Frequency Bias Analysis:**
```bash
curl -X POST http://localhost:8000/api/analysis/frequency \
  -H "Content-Type: application/json" \
  -d '{"analysis_type": "frequency"}'
```

**Demographic Bias Analysis:**
```bash
curl -X POST http://localhost:8000/api/analysis/demographic \
  -H "Content-Type: application/json" \
  -d '{"analysis_type": "demographic"}'
```

**Temporal Bias Analysis:**
```bash
curl -X POST http://localhost:8000/api/analysis/temporal \
  -H "Content-Type: application/json" \
  -d '{"analysis_type": "temporal"}'
```

**Effectiveness Bias Analysis:**
```bash
curl -X POST http://localhost:8000/api/analysis/effectiveness \
  -H "Content-Type: application/json" \
  -d '{"analysis_type": "effectiveness"}'
```

## Stopping Services

```bash
docker-compose down

# To remove volumes (database data):
docker-compose down -v
```

## Troubleshooting

**Port already in use:**
```bash
# Change ports in docker-compose.yml
# For example, change "3000:3000" to "3001:3000"
```

**Database connection errors:**
```bash
# Check database is running
docker-compose logs db

# Restart database
docker-compose restart db
```

**Frontend not loading:**
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

**No data available for analysis:**
- Make sure you've imported both students and sessions data
- Check import logs for errors
- Verify data exists: http://localhost:8000/api/sessions/stats

## Development Tips

**View logs:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

**Rebuild after code changes:**
```bash
docker-compose build
docker-compose up -d
```

**Access database directly:**
```bash
docker-compose exec db psql -U postgres -d concept_tool_bias
```

**Run backend tests:**
```bash
cd backend
pytest
```

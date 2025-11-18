# LMS Solution Comparison Backend

FastAPI backend for the LMS Solution Comparison System with AI-powered solution comparison.

## Features

- User authentication (JWT)
- Problem management (CRUD)
- Solution submission
- AI-powered solution comparison (Claude AI)
- Role-based access control (Student, Teacher, Admin)

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Generate with `openssl rand -hex 32`
- `ANTHROPIC_API_KEY`: Your Anthropic API key for AI comparison

### 3. Setup Database

Make sure PostgreSQL is running and create the database:

```bash
psql -U postgres
CREATE DATABASE lms_db;
\q
```

The tables will be created automatically on first run.

### 4. Run the Server

```bash
uvicorn app.main:app --reload
```

Or:

```bash
python -m app.main
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get token
- `GET /auth/me` - Get current user info

### Problems
- `POST /problems` - Create problem (teacher only)
- `GET /problems` - List all problems
- `GET /problems/{id}` - Get problem details
- `PUT /problems/{id}` - Update problem
- `DELETE /problems/{id}` - Delete problem

### Solutions
- `POST /solutions` - Submit solution
- `GET /solutions/problem/{problem_id}` - Get solutions for a problem
- `GET /solutions/{id}` - Get solution details
- `GET /solutions/my/all` - Get my solutions

### Comparisons
- `POST /comparisons` - Compare student solution with model solution (AI)
- `GET /comparisons/solution/{solution_id}` - Get comparisons for a solution
- `GET /comparisons/{id}` - Get comparison details

## Database Schema

### Users
- Student, Teacher, Admin roles
- Authentication and profile info

### Problems
- Created by teachers
- Multiple difficulty levels
- Support for math, coding, essay types

### Solutions
- Student submissions
- Model solutions (reference answers)
- Step-by-step explanations

### Comparisons
- AI-generated comparison results
- Similarity scores
- Feedback and suggestions
- Identified strengths and improvements

## Development

### Run Tests

```bash
pytest
```

### Database Migrations

Using Alembic (optional, for schema changes):

```bash
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## Architecture

```
backend/
├── app/
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── config.py        # Configuration
│   ├── database.py      # Database setup
│   └── main.py          # FastAPI application
├── tests/               # Test files
└── requirements.txt     # Dependencies
```

## Technologies

- **FastAPI**: Modern web framework
- **SQLAlchemy**: ORM
- **PostgreSQL**: Database
- **JWT**: Authentication
- **Anthropic Claude**: AI comparison service
- **Pydantic**: Data validation

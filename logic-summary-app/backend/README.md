# Logic Summary Backend API

FastAPI-based backend for extracting and summarizing logical propositions from educational problems using Claude AI.

## Features

- RESTful API for problem management
- AI-powered proposition extraction using Claude
- Logic summary generation
- SQLite database (easily switchable to PostgreSQL)

## Setup

### Prerequisites

- Python 3.11+
- Anthropic API Key (Claude)

### Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Running the Server

Development mode with auto-reload:
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or using Python directly:
```bash
python -m app.main
```

The API will be available at:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Problems

- `POST /api/problems/` - Create a new problem
- `GET /api/problems/` - List all problems
- `GET /api/problems/{id}` - Get a specific problem
- `DELETE /api/problems/{id}` - Delete a problem

### Logic Analysis

- `POST /api/problems/{id}/analyze` - Analyze a problem and generate logic summary

## Example Usage

### Create a problem:
```bash
curl -X POST http://localhost:8000/api/problems/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fraction Addition",
    "content": "If you have 1/4 of a pizza and get 2/4 more, how much do you have?",
    "problem_type": "math",
    "grade_level": "3rd grade"
  }'
```

### Analyze the problem:
```bash
curl -X POST http://localhost:8000/api/problems/1/analyze
```

## Database

By default, uses SQLite (`logic_summary.db`). For production, switch to PostgreSQL by updating `DATABASE_URL` in `.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/logic_summary
```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── database.py          # Database configuration
│   ├── models/
│   │   ├── problem.py       # SQLAlchemy models
│   │   └── schemas.py       # Pydantic schemas
│   ├── routes/
│   │   └── problems.py      # API endpoints
│   └── services/
│       └── proposition_extractor.py  # AI logic extraction
├── requirements.txt
└── .env.example
```

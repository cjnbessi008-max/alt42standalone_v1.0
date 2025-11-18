# Concept Tool Bias Analysis System

A standalone web application for analyzing bias in educational concept tool usage patterns.

## Overview

This system analyzes usage data from learning management systems (LMS) like Moodle to identify and visualize biases in how educational concept tools are used across different student groups, time periods, and contexts.

## Features

- **Usage Pattern Analysis**: Track which tools are used, by whom, and how often
- **Bias Detection**: Identify statistical biases across:
  - Student demographics (grade level, performance)
  - Tool types and categories
  - Time periods and contexts
  - Teacher preferences
- **Interactive Dashboard**: Visualize bias patterns with charts and graphs
- **Statistical Validation**: Chi-square tests, effect sizes, and significance testing
- **Recommendations**: Suggestions for reducing bias and increasing tool diversity

## Tech Stack

- **Backend**: Python 3.11+ with FastAPI
- **Frontend**: React 18+ with TypeScript
- **Database**: PostgreSQL 15+
- **Analysis**: pandas, numpy, scipy
- **Visualization**: Chart.js, recharts

## Architecture

```
┌─────────────────────────────────────────┐
│   React Dashboard (Frontend)            │
│   - Visualizations                      │
│   - Filters & Controls                  │
└──────────────┬──────────────────────────┘
               │ REST API
┌──────────────▼──────────────────────────┐
│   FastAPI Backend                       │
│   - Data ingestion                      │
│   - Bias analysis engine                │
│   - Statistical computations            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   PostgreSQL Database                   │
│   - Usage logs                          │
│   - Tool metadata                       │
│   - Analysis results                    │
└─────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Running with Docker

```bash
docker-compose up -d
```

Access the application at http://localhost:3000

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

## Data Import

### CSV Import

Import usage data from Moodle or other LMS:

```bash
curl -X POST http://localhost:8000/api/import/csv \
  -F "file=@usage_data.csv"
```

Expected CSV format:
```csv
timestamp,student_id,tool_name,session_duration,grade_level,performance_level
2024-01-15 10:30:00,S001,FractionVisualizer,300,3,high
2024-01-15 10:35:00,S002,NumberLine,450,3,medium
```

### API Integration

Connect directly to Moodle API (future feature).

## Bias Analysis Methods

### 1. Usage Frequency Bias
- Chi-square test for uniform distribution
- Tool diversity index (Shannon entropy)
- Gini coefficient for concentration

### 2. Demographic Bias
- Tool effectiveness by student group
- Statistical significance testing (t-tests, ANOVA)
- Effect size calculations (Cohen's d)

### 3. Temporal Bias
- Time-series analysis of tool usage
- Peak usage identification
- Seasonal patterns

### 4. Teacher Preference Bias
- Recommendation diversity analysis
- Assignment pattern analysis

## API Documentation

Once running, visit http://localhost:8000/docs for interactive API documentation.

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── models/       # Database models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── main.py       # FastAPI app
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API clients
│   │   ├── types/        # TypeScript types
│   │   └── App.tsx
│   └── package.json
├── database/
│   └── init.sql          # Database initialization
├── docker-compose.yml
└── README.md
```

## Contributing

This project is part of KAIST Touch Math Academy's AI Education System Pipeline.

## License

Proprietary - KAIST Touch Math Academy

# Inefficient Loop Detector for PHP Code

A standalone web application that detects inefficient loops in PHP code, integrated with Moodle LMS.

## Features

- **Static Code Analysis**: Detects inefficient loop patterns in PHP code
- **Real-time Feedback**: Provides immediate optimization suggestions
- **Moodle Integration**: Seamlessly integrates with Moodle LMS (3.7+)
- **Teacher Dashboard**: Comprehensive reports on student code quality
- **Performance Metrics**: Quantifies inefficiency impact

## Detected Inefficient Patterns

1. **Loop Invariant Calculations**: Computations inside loops that don't change
2. **Nested Loop Inefficiencies**: Unnecessary repeated iterations
3. **Database Queries in Loops**: N+1 query problems
4. **Redundant Function Calls**: Same function called repeatedly with same arguments
5. **Inefficient String Concatenation**: Building strings in loops without buffering

## Architecture

- **Frontend**: React + TypeScript + Monaco Editor
- **Backend**: Python FastAPI + PHP-Parser
- **Database**: PostgreSQL 15+
- **Integration**: Moodle Web Services REST API

## System Requirements

- **Moodle**: 3.7+
- **MySQL**: 5.7+
- **PHP**: 7.1.9+
- **Python**: 3.11+
- **Node.js**: 18+
- **PostgreSQL**: 15+

## Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Docker Deployment

```bash
docker-compose up -d
```

## Configuration

### Moodle Integration

1. Enable Web Services in Moodle (Site administration → Advanced features)
2. Create a Web Service user and token
3. Configure in `.env`:

```env
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_web_service_token
```

## Usage

### For Students

1. Access the web application
2. Login with Moodle credentials
3. Write or paste PHP code
4. Get instant feedback on loop inefficiencies
5. View optimization suggestions

### For Teachers

1. Access teacher dashboard
2. View student submissions and analysis results
3. Generate reports on common inefficiency patterns
4. Track student progress over time

## API Documentation

Once running, visit:
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.

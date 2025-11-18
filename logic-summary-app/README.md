# Logic Summary - 논리 명제 자동 요약 시스템

AI-powered logical proposition extraction and summarization system for educational problems using Claude AI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![React](https://img.shields.io/badge/react-18+-blue.svg)

## 🎯 Overview

Logic Summary is a standalone web application that automatically extracts and summarizes logical propositions from educational problems. It uses Claude AI (Anthropic) to analyze problem content and identify:

- **Premises** (전제) - Given facts
- **Assumptions** (가정) - Implicit requirements
- **Conclusions** (결론) - What needs to be proven/found
- **Constraints** (제약) - Limitations and conditions
- **Operations** (연산) - Mathematical or logical operations

## ✨ Features

- **AI-Powered Analysis**: Uses Claude Sonnet 4.5 for intelligent proposition extraction
- **Bilingual Support**: Korean and English interface
- **Virtual Smartphone Display**: Bottom-right corner shows mobile view of results
- **Real-time Processing**: Instant analysis and visualization
- **Logic Relationship Mapping**: Visual representation of how propositions relate
- **Confidence Scoring**: AI-assigned confidence scores for each proposition
- **RESTful API**: Well-documented FastAPI backend

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (React + TypeScript)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ ProblemInput │  │ LogicSummary │  │ VirtualPhone │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API (Axios)
┌─────────────────────▼───────────────────────────────────────┐
│                   Backend (FastAPI)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   API Routes │  │   Services   │  │   Database   │     │
│  │   /problems  │  │  Proposition │  │   SQLite     │     │
│  │   /analyze   │  │  Extractor   │  │  (or PgSQL)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
              Claude API (Anthropic)
```

## 🚀 Quick Start

### Prerequisites

- **Backend**: Python 3.11+, pip
- **Frontend**: Node.js 18+, npm
- **API Key**: Anthropic Claude API key

### Installation

1. **Clone the repository**
```bash
cd logic-summary-app
```

2. **Set up Backend**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

3. **Set up Frontend**
```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment (optional)
cp .env.example .env
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📖 Usage

### 1. Enter a Problem

Fill in the problem form with:
- **Title**: Brief description
- **Content**: Full problem text
- **Type**: logic, math, or reasoning
- **Grade Level**: Target student level (optional)

### 2. Analyze

Click "문제 제출 및 분석" (Submit & Analyze) button.

### 3. View Results

Results appear in two places:
- **Main Display**: Detailed proposition list with confidence scores
- **Virtual Phone** (bottom-right): Mobile-optimized view

### Example Problems

**분수 덧셈 (Fraction Addition):**
```
Title: 분수 덧셈 문제
Content: 만약 피자의 1/4를 먹고 친구가 2/4를 더 주면, 전체 피자의 몇 분의 몇을 갖게 되나요?
Type: math
Grade: 3학년
```

**논리 추론 (Logical Reasoning):**
```
Title: 삼단논법
Content: 모든 고양이는 동물이다. 뭉치는 고양이다. 따라서 뭉치는 무엇인가?
Type: logic
Grade: 5학년
```

## 🔌 API Endpoints

### Problems

- `POST /api/problems/` - Create a new problem
  ```json
  {
    "title": "Fraction Addition",
    "content": "If you have 1/4 and add 2/4...",
    "problem_type": "math",
    "grade_level": "3rd grade"
  }
  ```

- `GET /api/problems/` - List all problems
- `GET /api/problems/{id}` - Get specific problem
- `DELETE /api/problems/{id}` - Delete a problem

### Analysis

- `POST /api/problems/{id}/analyze` - Analyze problem and extract propositions
  ```json
  {
    "problem_id": 1,
    "propositions": [
      {
        "id": "P1",
        "text": "You have 1/4 of pizza",
        "type": "premise",
        "confidence": 0.95
      }
    ],
    "logic_summary": "...",
    "visualization_data": {...}
  }
  ```

## 📁 Project Structure

```
logic-summary-app/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── database.py          # Database setup
│   │   ├── models/
│   │   │   ├── problem.py       # SQLAlchemy models
│   │   │   └── schemas.py       # Pydantic schemas
│   │   ├── routes/
│   │   │   └── problems.py      # API endpoints
│   │   └── services/
│   │       └── proposition_extractor.py  # AI logic
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProblemInput.tsx
│   │   │   ├── LogicSummary.tsx
│   │   │   └── VirtualPhone.tsx
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Anthropic Claude API** - AI-powered analysis
- **SQLite/PostgreSQL** - Data persistence
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Axios** - HTTP client

## 🎨 UI Features

### Virtual Smartphone Display

Located in the **bottom-right corner**, this component:
- Simulates iPhone-style display with notch
- Shows mobile-optimized proposition cards
- Displays confidence scores as progress bars
- Updates in real-time with analysis results
- Provides realistic smartphone UX

### Main Display

- Clean, bilingual interface (Korean/English)
- Color-coded proposition types
- Confidence score badges
- Logical relationship visualization
- Responsive grid layout

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
DATABASE_URL=sqlite:///./logic_summary.db
API_HOST=0.0.0.0
API_PORT=8000
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:8000
```

### Database

Default: SQLite (`logic_summary.db`)

For PostgreSQL:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/logic_summary
```

## 📊 Example Output

```json
{
  "problem_id": 1,
  "propositions": [
    {
      "id": "P1",
      "text": "초기에 피자의 1/4를 가지고 있다",
      "type": "premise",
      "confidence": 0.98
    },
    {
      "id": "P2",
      "text": "친구로부터 2/4를 추가로 받는다",
      "type": "premise",
      "confidence": 0.95
    },
    {
      "id": "C1",
      "text": "1/4 + 2/4 = 3/4",
      "type": "operation",
      "confidence": 0.99
    }
  ],
  "logic_summary": "이 문제는 분수 덧셈에 관한 것입니다. 초기 상태(1/4)와 추가 상태(2/4)를 합산하여 최종 결과(3/4)를 도출합니다.",
  "visualization_data": {
    "nodes": [...],
    "edges": [{"from": "P1", "to": "C1", "relationship": "implies"}]
  }
}
```

## 🚧 Roadmap

- [ ] Add support for more LMS integrations (Moodle, Canvas)
- [ ] Implement user authentication
- [ ] Add problem history and analytics
- [ ] Support for image-based problems
- [ ] Multi-language support (beyond Korean/English)
- [ ] Interactive graph visualization of logic relationships
- [ ] Export to PDF/LaTeX
- [ ] Batch problem analysis

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ using Claude AI**

# AI Education System Pipeline - LMS Integration with Checklist Generation

A comprehensive web application for automatically generating step-by-step checklists integrated with Learning Management Systems (LMS). This system enables teachers to track module generation progress and students to monitor their learning journey through automatically generated, interactive checklists.

## 🎯 Features

### For Teachers
- **Pipeline Progress Tracking**: Automatically generated checklists for the 6-phase module generation pipeline
- **Real-time Updates**: Track progress through World Model, Rules, Data, Input Strategy, UI, and Deployment phases
- **Visual Progress Indicators**: Clear visual feedback on completion status
- **Module Management Dashboard**: Centralized view of all module generation progress

### For Students
- **Learning Progress Checklists**: Personalized learning paths with interactive checkboxes
- **Visual Progress Tracking**: Linear progress bars and completion percentages
- **Multiple Module Support**: Track progress across multiple learning modules
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### LMS Integration
- **LTI 1.3 Support**: Standards-based integration with popular LMS platforms (Canvas, Moodle, Blackboard)
- **Grade Passback**: Automatic grade submission to LMS using Assignment and Grade Services (AGS)
- **Roster Sync**: Automatic student enrollment from LMS using Names and Role Provisioning Services (NRPS)
- **SSO Support**: Seamless single sign-on through LTI launch

## 🏗️ Architecture

### Technology Stack

**Backend**
- Python 3.11+ with FastAPI
- PostgreSQL 15+ (with JSONB support)
- SQLAlchemy ORM
- Redis for caching
- LTI 1.3 implementation (pylti1p3)

**Frontend**
- React 18+ with TypeScript
- Material-UI (MUI) components
- React Router for navigation
- React Query for data fetching
- Vite for build tooling

**DevOps**
- Docker & Docker Compose
- Nginx as reverse proxy
- PostgreSQL and Redis containers

### Project Structure

```
alt42standalone_v1.0/
├── backend/
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   │   ├── checklist.py  # Checklist CRUD and generation
│   │   │   └── lms.py        # LMS integration endpoints
│   │   ├── models/           # Database models
│   │   │   ├── checklist.py  # Checklist and ChecklistItem models
│   │   │   ├── module.py     # Educational module model
│   │   │   ├── teacher.py    # Teacher/educator model
│   │   │   ├── student.py    # Student/learner model
│   │   │   └── lms_integration.py  # LMS configuration
│   │   ├── services/         # Business logic
│   │   │   ├── checklist_generator.py  # Auto-generation logic
│   │   │   └── lms_service.py         # LMS integration logic
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── db/               # Database configuration
│   │   └── main.py           # FastAPI application
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ChecklistItem.tsx
│   │   │   └── ChecklistView.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── TeacherDashboard.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   └── StudentChecklistView.tsx
│   │   ├── services/         # API services
│   │   │   └── api.ts
│   │   ├── types/            # TypeScript types
│   │   │   └── checklist.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md  # Product Requirements
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)
- PostgreSQL 15+ (for local development without Docker)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alt42standalone_v1.0
   ```

2. **Copy environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

5. **Check service health**
   ```bash
   docker-compose ps
   ```

### Local Development Setup

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up database
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_education_system"

# Run migrations (when available)
# alembic upgrade head

# Run development server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run development server
npm run dev
```

The frontend will be available at http://localhost:3000

## 📖 API Documentation

### Checklist Endpoints

**Generate Pipeline Checklist**
```
POST /api/checklists/generate/pipeline/{module_id}?teacher_id={teacher_id}
```
Automatically generates a 26-item checklist tracking the 6-phase module generation pipeline.

**Generate Learning Checklist**
```
POST /api/checklists/generate/learning/{module_id}/{student_id}
```
Generates a personalized learning progress checklist for a student.

**Get Checklist**
```
GET /api/checklists/{checklist_id}
```
Retrieves a checklist with all its items.

**Update Item Progress**
```
PUT /api/checklists/items/progress
Body: {
  "item_id": "uuid",
  "is_completed": true,
  "progress_percentage": 100
}
```

**Get Module Checklists**
```
GET /api/checklists/module/{module_id}
```

**Get Student Checklists**
```
GET /api/checklists/student/{student_id}
```

### LMS Integration Endpoints

**LTI Login**
```
POST /api/lms/lti/login
```
Initiates LTI 1.3 login flow.

**LTI Launch**
```
POST /api/lms/lti/launch
Body: {
  "lms_id": "uuid",
  "launch_data": {...}
}
```

**Submit Grade**
```
POST /api/lms/grade/submit
Body: {
  "lms_id": "uuid",
  "student_lms_id": "string",
  "resource_link_id": "string",
  "score": 85.5,
  "max_score": 100
}
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=redis://host:6379/0
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
ANTHROPIC_API_KEY=your-anthropic-key
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:8000
```

### LMS Integration Setup

1. Configure LTI 1.3 credentials in the LMS admin panel
2. Create an `LMSIntegration` record in the database with:
   - issuer
   - client_id
   - auth_login_url
   - auth_token_url
   - key_set_url
   - deployment_id

3. Install the tool in your LMS using the provided configuration

## 📊 Database Schema

### Core Tables

**checklists**
- id (UUID, PK)
- title, description
- checklist_type (enum)
- module_id, student_id, teacher_id (FKs)
- total_items, completed_items
- auto_generated (boolean)
- created_at, updated_at

**checklist_items**
- id (UUID, PK)
- checklist_id (FK)
- title, description
- order, is_completed, is_required
- depends_on (self-referencing FK)
- pipeline_stage (string)
- progress_percentage (0-100)
- created_at, updated_at

**modules**
- Educational module metadata
- Tracks generation status and artifacts

**teachers**
- Teacher/educator accounts

**students**
- Student/learner accounts
- Links to LMS user IDs

**lms_integrations**
- LTI 1.3 configuration
- OAuth credentials

## 🎨 UI Components

### ChecklistItem
Displays individual checklist items with:
- Checkbox for completion
- Progress bar (when applicable)
- Required/optional badges
- Pipeline stage labels
- Description text

### ChecklistView
Complete checklist display with:
- Overall progress bar
- Grouped items (by pipeline stage for generation checklists)
- Completion celebration
- Type-specific styling

### Teacher Dashboard
- Module-centric view
- Generate new checklists
- View all pipeline checklists
- Real-time progress updates

### Student Dashboard
- Card-based layout
- Multiple module support
- Quick access to active learning paths
- Progress visualization

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 🔒 Security

- JWT-based authentication
- CORS protection
- SQL injection prevention (parameterized queries)
- Input validation (Pydantic)
- Rate limiting (planned)
- LTI 1.3 security standards

## 📈 Monitoring

- Health check endpoint: `GET /health`
- API metrics available at `/metrics` (when Prometheus integration is added)
- Logging configured for all services

## 🤝 Contributing

This is a project for KAIST Touch Math Academy. For questions or contributions, please contact the development team.

## 📄 License

[License information to be determined]

## 🙏 Acknowledgments

- Built with FastAPI and React
- LTI integration using pylti1p3
- UI components from Material-UI
- Based on the comprehensive PRD in `tasks/0001-prd-ai-education-pipeline.md`

## 📞 Support

For technical support or questions:
- Review the PRD: `tasks/0001-prd-ai-education-pipeline.md`
- Check API docs: http://localhost:8000/docs
- Contact the development team

## 🗺️ Roadmap

- [x] Core checklist generation for pipeline stages
- [x] LMS integration (LTI 1.3)
- [x] Teacher and student dashboards
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics and reporting
- [ ] Mobile native apps
- [ ] Multi-language support (Korean/English)
- [ ] AI-powered checklist optimization

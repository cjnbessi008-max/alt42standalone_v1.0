# AI Education System Pipeline

An intelligent system that transforms teacher requests into complete educational modules.

## 🏗️ Project Structure

```
ai-education-pipeline/
├── backend/
│   ├── api-gateway/          # Node.js + Express - API Gateway
│   ├── pipeline-engine/      # Python + FastAPI - AI Pipeline Orchestrator
│   └── shared/               # Shared utilities and types
├── frontend/                 # React + TypeScript - Teacher & Admin UI
├── database/                 # PostgreSQL schemas and migrations
├── docker/                   # Docker configurations
└── docs/                     # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose

### Development Setup

```bash
# 1. Clone and install dependencies
cd ai-education-pipeline

# Backend API Gateway
cd backend/api-gateway
npm install

# Pipeline Engine
cd backend/pipeline-engine
pip install -r requirements.txt

# Frontend
cd frontend
npm install

# 2. Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# 3. Start database
docker-compose up -d postgres redis

# 4. Run migrations
npm run migrate

# 5. Start development servers
npm run dev:all
```

## 📚 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🎯 MVP Features (Phase 0)

- ✅ Teacher request submission
- ✅ Natural language processing (Claude API)
- ✅ World model reconstruction
- ✅ Basic database schema generation
- ✅ Simple UI generation
- ✅ Progress monitoring

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Material-UI, Redux Toolkit
- **API Gateway**: Node.js, Express, JWT Authentication
- **Pipeline Engine**: Python, FastAPI, Claude API
- **Database**: PostgreSQL 15, Redis 7
- **DevOps**: Docker, Docker Compose, GitHub Actions

## 📖 License

Educational use - KAIST Touch Math Academy

---

**Status**: MVP Development In Progress
**Version**: 0.1.0 (Alpha)
**Last Updated**: 2025-11-18

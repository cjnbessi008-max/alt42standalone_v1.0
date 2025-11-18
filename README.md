# ALT42 Length Assist - Standalone Web Application

ALT42 Length Assist is an interactive geometry learning tool that allows students to manipulate geometric shapes and automatically calculates length ratios.

## Features

- 🎯 **Length Assist**: Drag geometric shapes to measure and calculate ratios
- 📱 **Virtual Smartphone Interface**: Optimized mobile-like experience
- 🔗 **Moodle LMS Integration**: API endpoints for LMS connectivity
- 🎨 **Interactive Visualizations**: SVG-based geometry manipulation
- 📊 **Real-time Calculations**: Automatic ratio computation

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (Build tool)
- Material-UI (MUI)
- React-Konva (Canvas-based geometry)
- Zustand (State management)

### Backend
- Node.js + Express + TypeScript
- PostgreSQL 15+
- Redis (Caching)
- JWT Authentication

### Development
- Docker & Docker Compose
- ESLint + Prettier
- Jest + React Testing Library

## Project Structure

```
alt42standalone_v1.0/
├── frontend/           # React frontend application
├── backend/            # Node.js backend API
├── database/           # Database schemas and migrations
├── docker/             # Docker configuration files
└── docs/               # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Installation

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### Development

```bash
# Start backend (terminal 1)
cd backend
npm run dev

# Start frontend (terminal 2)
cd frontend
npm run dev
```

### Using Docker

```bash
# Start all services
docker-compose up

# Stop all services
docker-compose down
```

## API Documentation

See [API Documentation](./docs/API.md) for detailed endpoint information.

## License

Proprietary - KAIST

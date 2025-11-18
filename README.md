# Correlation Heat - Moodle Integration Web App

An intelligent web application that integrates with Moodle LMS to visualize problem correlations using color temperature heatmaps displayed in a smartphone simulator interface.

## Overview

This application:
- Connects to Moodle LMS (MySQL 5.7 + PHP 7.1.9 + Moodle 3.7) via REST API
- Fetches quiz/problem data from Moodle
- Visualizes data correlations using **Correlation Heat** (color temperature heatmap)
- Displays the interface in a smartphone simulator on the right side of the screen

## Architecture

```
┌─────────────────────────────────┐
│  Moodle LMS (MySQL + PHP)       │
│  - Problem/Quiz Management      │
└────────────┬────────────────────┘
             │ REST API
┌────────────▼────────────────────┐
│  Backend (Node.js + Express)    │
│  - Moodle API Integration       │
│  - Data Processing              │
│  - Correlation Analysis         │
└────────────┬────────────────────┘
             │ REST API
┌────────────▼────────────────────┐
│  Frontend (React + TypeScript)  │
│  ┌──────────┬─────────────────┐ │
│  │Dashboard │  📱 Smartphone  │ │
│  │          │   Simulator     │ │
│  │          │  (Correlation   │ │
│  │          │     Heat)       │ │
│  └──────────┴─────────────────┘ │
└─────────────────────────────────┘
```

## Tech Stack

### Frontend
- React 18+ with TypeScript
- Material-UI (MUI) for UI components
- D3.js or Recharts for heatmap visualization
- Axios for API calls

### Backend
- Node.js 18+
- Express.js
- TypeScript
- Axios for Moodle API integration

### Integration
- Moodle Web Services API
- MySQL 5.7 (existing Moodle database)

## Features

### 1. Correlation Heat Visualization
- Heatmap showing correlations between:
  - Student performance across different problems
  - Problem difficulty vs. success rate
  - Time spent vs. accuracy
- Color temperature scale (cool blue → warm red)

### 2. Smartphone Simulator UI
- Positioned at bottom-right of screen
- Realistic smartphone frame/bezel
- Responsive content area
- Displays Correlation Heat heatmap

### 3. Moodle Integration
- Fetch quiz/problem data
- Retrieve student attempts and scores
- Real-time data synchronization

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Access to Moodle LMS with Web Services enabled
- Moodle API token

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. Install dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Configure environment variables

**Backend** (`backend/.env`):
```env
PORT=3001
MOODLE_URL=https://your-moodle-instance.com
MOODLE_TOKEN=your_moodle_api_token
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:3001
```

4. Start development servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

5. Open browser at `http://localhost:3000`

## Development

### Backend Structure
```
backend/
├── src/
│   ├── routes/
│   │   ├── moodle.routes.ts
│   │   └── correlation.routes.ts
│   ├── services/
│   │   ├── moodleApi.service.ts
│   │   └── correlation.service.ts
│   ├── middleware/
│   │   └── errorHandler.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── SmartphoneSimulator/
│   │   │   ├── SmartphoneSimulator.tsx
│   │   │   └── SmartphoneSimulator.css
│   │   ├── CorrelationHeat/
│   │   │   ├── CorrelationHeatmap.tsx
│   │   │   └── CorrelationHeatmap.css
│   │   └── Dashboard/
│   │       └── Dashboard.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── moodle.types.ts
│   ├── App.tsx
│   └── index.tsx
├── package.json
└── tsconfig.json
```

## Docker Deployment

```bash
docker-compose up -d
```

## API Endpoints

### Backend API

- `GET /api/moodle/quizzes` - Get all quizzes
- `GET /api/moodle/quiz/:id/attempts` - Get quiz attempts
- `GET /api/correlation/:quizId` - Get correlation data for heatmap

## Correlation Heat Algorithm

The correlation coefficient is calculated using Pearson correlation:

```
r = Σ[(xi - x̄)(yi - ȳ)] / √[Σ(xi - x̄)² × Σ(yi - ȳ)²]
```

Color mapping:
- **r = -1.0 to -0.5**: Deep Blue (cold) - Strong negative correlation
- **r = -0.5 to 0.0**: Light Blue - Weak negative correlation
- **r = 0.0 to 0.5**: Light Red - Weak positive correlation
- **r = 0.5 to 1.0**: Deep Red (hot) - Strong positive correlation

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and development process.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues and questions, please open a GitHub issue.

## Roadmap

- [x] Project setup
- [ ] Moodle API integration
- [ ] Correlation calculation engine
- [ ] Heatmap visualization
- [ ] Smartphone simulator UI
- [ ] Docker deployment
- [ ] Production optimization

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18

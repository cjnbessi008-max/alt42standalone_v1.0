# Power Candle - Logarithm Learning App

## Overview
Power Candle is an interactive educational web application that visualizes logarithm concepts using candles. It helps students understand "log_a b" as "how many times do we multiply a to get b" through an intuitive candle counting interface.

## Concept
- **log_2 8 = 3** → Display 3 candles (2×2×2 = 8)
- **log_3 27 = 3** → Display 3 candles (3×3×3 = 27)
- **log_10 100 = 2** → Display 2 candles (10×10 = 100)

## Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **Backend**: PHP 7.1.9 (Moodle compatible)
- **Database**: MySQL 5.7
- **LMS Integration**: Moodle 3.7
- **UI Design**: Virtual smartphone display (responsive)

### Project Structure
```
power-candle/
├── backend/              # PHP backend for Moodle integration
│   ├── api/             # REST API endpoints
│   ├── config/          # Database and Moodle configuration
│   ├── models/          # Data models
│   └── utils/           # Helper functions
├── frontend/            # React application
│   ├── public/          # Static assets
│   └── src/
│       ├── components/  # React components
│       │   ├── Candle.tsx          # Single candle component
│       │   ├── CandleDisplay.tsx   # Candle array display
│       │   ├── SmartphoneFrame.tsx # Virtual phone UI
│       │   └── ProblemView.tsx     # Problem display
│       ├── services/    # API communication
│       ├── hooks/       # Custom React hooks
│       └── utils/       # Utility functions
├── database/            # Database schemas and migrations
│   ├── schema.sql      # Main database schema
│   └── seed.sql        # Sample data
└── docs/               # Documentation
    └── ARCHITECTURE.md
```

## Features

### Core Features
1. **Moodle Integration**
   - Fetch problem data from Moodle quiz/activity
   - Submit student answers back to Moodle
   - Track student progress

2. **Interactive Candle Visualization**
   - Animated candle display based on logarithm value
   - Visual feedback for correct/incorrect answers
   - Responsive smartphone-style interface

3. **Problem Types**
   - Calculate logarithm: Given base and result, find the power
   - Verify equation: Check if log equation is correct
   - Multiple choice: Select correct candle count

4. **Learning Support**
   - Step-by-step hints
   - Visual calculation breakdown
   - Progress tracking

### Virtual Smartphone Display
- Mobile-first responsive design
- Touch-friendly interface
- Simulated smartphone frame on desktop
- Portrait orientation optimized

## Installation

### Prerequisites
- PHP 7.1.9+
- MySQL 5.7+
- Node.js 16+ and npm
- Moodle 3.7+ instance

### Setup Steps

1. **Clone Repository**
```bash
git clone [repository-url]
cd power-candle
```

2. **Database Setup**
```bash
mysql -u root -p < database/schema.sql
```

3. **Backend Configuration**
```bash
cd backend
cp config/config.example.php config/config.php
# Edit config.php with your Moodle and database credentials
```

4. **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

## Moodle Integration

### API Endpoints
- `GET /api/problem/:id` - Fetch problem from Moodle
- `POST /api/submit` - Submit answer to Moodle
- `GET /api/progress/:student_id` - Get student progress

### Moodle Configuration
1. Install Moodle external tool/plugin
2. Configure API access tokens
3. Set up quiz activity with Power Candle questions

## Development

### Running Locally
```bash
# Backend (PHP built-in server)
cd backend
php -S localhost:8000

# Frontend (React dev server)
cd frontend
npm start
```

### Building for Production
```bash
cd frontend
npm run build
```

## Pedagogical Approach

### Learning Objectives
- Understand logarithms as inverse operations of exponents
- Visualize the "counting" nature of logarithms
- Connect abstract math concepts to concrete representations

### Design Principles
- **Visual First**: Use candles before numbers
- **Interactive**: Students engage through interaction
- **Immediate Feedback**: Instant visual response
- **Progressive Difficulty**: Start simple, increase complexity

## License
MIT License

## Contact
KAIST Touch Math Academy

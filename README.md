# Mean Center - LMS Integration App

Interactive educational app that visualizes the mean (center of gravity) from student touch coordinates, integrated with Moodle LMS.

## Features

- 📱 Virtual smartphone display (bottom-right positioning)
- 🎯 Real-time mean center calculation and visualization
- 📊 Coordinate tracking with trajectory display
- 🔗 Moodle LMS integration via REST API
- ⚡ Live updates as students interact

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: MySQL 5.7
- **Styling**: CSS3 with responsive design

## Quick Start

### Prerequisites

- Node.js 16+
- MySQL 5.7
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. Set up the database:
```bash
mysql -u root -p < database/schema.sql
```

3. Install backend dependencies:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
```

4. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend (in another terminal):
```bash
cd frontend
npm run dev
```

3. Open http://localhost:5173 in your browser

## Project Structure

```
├── backend/           # Node.js Express API
│   ├── src/
│   │   ├── config/    # Database and app configuration
│   │   ├── controllers/ # Business logic
│   │   ├── routes/    # API endpoints
│   │   ├── models/    # Database models
│   │   └── server.js  # Entry point
│   └── package.json
├── frontend/          # React TypeScript app
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── services/  # API communication
│   │   ├── types/     # TypeScript definitions
│   │   └── App.tsx    # Main app component
│   └── package.json
└── database/
    └── schema.sql     # MySQL schema
```

## API Endpoints

### Movement Tracking
- `POST /api/movement` - Record coordinate
- `GET /api/movement/:sessionId` - Get all coordinates
- `GET /api/mean-center/:sessionId` - Get mean center stats

### Moodle Integration
- `POST /api/moodle/auth` - Authenticate Moodle user
- `GET /api/moodle/problem/:problemId` - Get problem info

## Mean Center Calculation

The mean center (center of gravity) is calculated using:

```
mean_x = Σ(x_i) / n
mean_y = Σ(y_i) / n
```

Where:
- `x_i, y_i` are individual coordinate points
- `n` is the total number of points

## Development

### Environment Variables

Backend `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mean_center_db
PORT=3000
MOODLE_API_URL=http://your-moodle-instance/webservice/rest/server.php
MOODLE_TOKEN=your_moodle_token
```

### Database Schema

See `database/schema.sql` for the complete schema including:
- `sessions` - Student sessions
- `coordinates` - Touch/click coordinates
- `mean_center_stats` - Calculated statistics

## License

MIT

## Support

For issues and questions, please open a GitHub issue.

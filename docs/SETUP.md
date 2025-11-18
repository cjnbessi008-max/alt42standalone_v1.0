# ALT42 Length Assist - Setup Guide

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/download/))
- **Redis** 7+ (optional, for caching)
- **Docker & Docker Compose** (optional, for containerized setup)

## Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   cd alt42standalone_v1.0
   ```

2. **Start all services**
   ```bash
   docker-compose up
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/health

That's it! The database will be automatically initialized with the schema and seed data.

## Manual Setup (Without Docker)

### 1. Database Setup

#### PostgreSQL

1. **Create database**
   ```bash
   createdb alt42_lengthassist
   ```

2. **Run schema migration**
   ```bash
   psql -d alt42_lengthassist -f database/schema.sql
   ```

3. **Load seed data**
   ```bash
   psql -d alt42_lengthassist -f database/seed.sql
   ```

#### Redis (Optional)

1. **Start Redis server**
   ```bash
   redis-server
   ```

### 2. Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` with your configuration**
   ```env
   NODE_ENV=development
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=alt42_lengthassist
   DB_USER=postgres
   DB_PASSWORD=your_password
   REDIS_HOST=localhost
   REDIS_PORT=6379
   JWT_SECRET=your_secret_key
   CORS_ORIGIN=http://localhost:3000
   ```

5. **Start backend server**
   ```bash
   npm run dev
   ```

   Backend will run on http://localhost:5000

### 3. Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env`**
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

5. **Start frontend development server**
   ```bash
   npm run dev
   ```

   Frontend will run on http://localhost:3000

## Testing the Application

1. **Open browser** to http://localhost:3000

2. **You should see:**
   - Virtual smartphone frame
   - Length Assist interface
   - Demo problem loaded with two draggable lines

3. **Try the features:**
   - Drag the endpoints of lines to change their length
   - Select two lines from the line selector
   - Click "비율 계산하기" (Calculate Ratio)
   - View the calculated ratio
   - Click "답안 제출" (Submit Answer)

## Moodle LTI Integration

### Setup LTI in Moodle 3.7

1. **In Moodle, go to:** Site administration → Plugins → Activity modules → External tool → Manage tools

2. **Add new external tool:**
   - Tool name: `ALT42 Length Assist`
   - Tool URL: `http://your-server:5000/api/moodle/lti-launch`
   - Consumer key: (set in `.env` as `MOODLE_LTI_KEY`)
   - Shared secret: (set in `.env` as `MOODLE_LTI_SECRET`)

3. **Configure tool settings:**
   - Privacy:
     - ✓ Share launcher's name with tool
     - ✓ Share launcher's email with tool
   - Custom parameters: (optional)
     ```
     module_id=demo-module-1
     ```

4. **Add to course:**
   - Go to your course
   - Turn editing on
   - Add an activity → External tool
   - Select "ALT42 Length Assist"

5. **Students can now:**
   - Click the tool link
   - Automatically launch into Length Assist
   - Their progress is tracked
   - Grades can be sent back to Moodle

## Environment Variables Reference

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Backend server port | `5000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `alt42_lengthassist` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT signing secret | - |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `MOODLE_LTI_KEY` | Moodle LTI consumer key | - |
| `MOODLE_LTI_SECRET` | Moodle LTI shared secret | - |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:5000/api` |

## Development Commands

### Backend

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

### Frontend

```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:** Make sure PostgreSQL is running and credentials in `.env` are correct.

### Redis Connection Error

```
Error: Redis connection to localhost:6379 failed
```

**Solution:** Either start Redis server or comment out Redis initialization in `backend/src/config/database.ts` (Redis is optional for basic functionality).

### CORS Error

```
Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:** Make sure `CORS_ORIGIN=http://localhost:3000` in backend `.env`.

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:** Change `PORT` in backend `.env` or kill the process using that port.

## Production Deployment

For production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md) (to be created).

## Support

For issues and questions, please contact the development team or create an issue in the repository.

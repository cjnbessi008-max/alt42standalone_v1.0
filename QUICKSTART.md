# Quick Start Guide

Get the 3D Matching Guide up and running in 5 minutes!

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# The defaults work for local development!
# No need to edit unless you want custom settings
```

### 4. Start Database Services

```bash
# Start PostgreSQL and Redis using Docker
docker-compose up -d

# Wait for services to be ready (about 10 seconds)
# Check status:
docker-compose ps
```

You should see:
```
NAME                        STATUS
matching_guide_db          Up
matching_guide_redis       Up
```

### 5. Initialize Database

```bash
# Create tables
npm run db:migrate

# Load sample data
npm run db:seed
```

You'll see:
```
✅ All migrations completed successfully!
✅ Database seeding completed successfully!

📊 Seed Summary:
- 4 users created
- 6 3D shapes created
- 6 2D shapes created
- 1 problem created with 9 matching pairs

🔐 Test credentials:
Teacher: teacher1 / password123
Student: student1 / password123
Admin: admin / password123
```

### 6. Start the Application

```bash
# Start both backend and frontend
npm run dev:full
```

This will start:
- Backend API at http://localhost:5000
- Frontend at http://localhost:3000

Your browser should automatically open to http://localhost:3000

## What You'll See

### Virtual Smartphone Display

The app renders in a **virtual smartphone frame** positioned on the right side of the screen, simulating how it would appear on a mobile device.

### Sample Problem: "Basic 3D to 2D Matching"

The seeded database includes a sample problem with:
- **6 3D shapes** (입체도형): Cube, Sphere, Cylinder, Cone, Rectangular Prism, Pyramid
- **6 2D shapes** (평면도형): Square, Circle, Rectangle, Triangle, Pentagon, Hexagon

### How to Play

1. **Drag** a 3D shape (입체도형) from the top section
2. **Drop** it onto the matching 2D shape (평면도형) in the bottom section
3. Get **instant feedback** - green for correct, red for incorrect
4. **Track progress** with the progress bar at the bottom
5. **Complete** all matches to finish the problem!

### Touch Gestures

- **Desktop**: Click and drag with mouse
- **Mobile/Tablet**: Touch and drag with finger
- **Multi-touch**: Supported on touch devices

## Test the API

### Check API Health

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "service": "3D Matching Guide API"
}
```

### Get All Problems

```bash
curl http://localhost:5000/api/problems
```

### Get Problem Pairs

```bash
curl http://localhost:5000/api/problems/1/pairs
```

## Test Accounts

Use these credentials to test different user roles:

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| Student | student1 | password123 | Can attempt problems |
| Student | student2 | password123 | Another student account |
| Teacher | teacher1 | password123 | Can create/manage problems |
| Admin | admin | password123 | Full system access |

## Project Structure

```
alt42standalone_v1.0/
├── client/                 # React frontend
│   ├── public/            # Static files
│   └── src/
│       ├── components/    # React components
│       │   ├── SmartphoneFrame.js    # Virtual phone display
│       │   ├── MatchingGame.js       # Main game logic
│       │   ├── Shape3DItem.js        # 3D shape component
│       │   └── Shape2DTarget.js      # 2D shape target
│       └── services/      # API services
├── server/                # Node.js backend
│   ├── controllers/      # Request handlers
│   ├── routes/          # API routes
│   ├── db/              # Database utilities
│   └── index.js         # Server entry point
├── docs/                # Documentation
│   ├── API.md          # API documentation
│   ├── LMS_INTEGRATION.md  # LMS integration guide
│   └── DEPLOYMENT.md    # Deployment instructions
└── docker-compose.yml  # Database services
```

## Common Commands

```bash
# Development
npm run dev              # Start backend only
npm run client          # Start frontend only
npm run dev:full        # Start both

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed sample data

# Production
npm run build           # Build frontend
npm start               # Start production server

# Docker
docker-compose up -d    # Start services
docker-compose down     # Stop services
docker-compose logs -f  # View logs
```

## Troubleshooting

### Port Already in Use

If you see `Error: listen EADDRINUSE`:

```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use a different port
PORT=5001 npm run dev
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart services
docker-compose restart

# View logs
docker-compose logs postgres
```

### Frontend Not Loading

```bash
# Clear cache and reinstall
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

## Next Steps

### 1. Create Your Own Problem

See [docs/API.md](docs/API.md) for API documentation.

```bash
curl -X POST http://localhost:5000/api/problems \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Custom Problem",
    "title_ko": "나만의 문제",
    "difficulty_level": 2,
    "category": "custom",
    "created_by": 1
  }'
```

### 2. Configure LMS Integration

See [docs/LMS_INTEGRATION.md](docs/LMS_INTEGRATION.md) for Moodle integration.

```bash
curl -X POST http://localhost:5000/api/lms/configure \
  -H "Content-Type: application/json" \
  -d '{
    "lms_type": "moodle",
    "lms_url": "https://your-moodle.com",
    "course_id": "course_123"
  }'
```

### 3. Deploy to Production

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment instructions.

## Features

✅ **Virtual Smartphone Display**: Realistic mobile interface
✅ **Drag & Drop**: Intuitive touch gestures
✅ **3D/2D Matching**: Educational geometry game
✅ **Real-time Feedback**: Instant correctness validation
✅ **Progress Tracking**: Student performance analytics
✅ **LMS Ready**: Moodle integration support
✅ **Bilingual**: Korean & English support
✅ **Responsive**: Works on all devices

## Technologies Used

- **Frontend**: React 18, React DnD (drag & drop), Framer Motion
- **Backend**: Node.js, Express, PostgreSQL, Redis
- **DevOps**: Docker, Docker Compose
- **LMS**: Moodle 3.7+ compatible (LTI protocol)

## Support

- 📖 [Full Documentation](README.md)
- 🔌 [API Reference](docs/API.md)
- 🎓 [LMS Integration](docs/LMS_INTEGRATION.md)
- 🚀 [Deployment Guide](docs/DEPLOYMENT.md)

## License

MIT License - see [LICENSE](LICENSE) file for details

---

**Happy Matching! 즐거운 학습 되세요! 🎯📱**

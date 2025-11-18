# Quick Start Guide - AI Education Pipeline MVP

## 🚀 Get Started in 5 Minutes

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- Claude API key from Anthropic

### 1. Clone and Setup (1 min)

```bash
cd ai-education-pipeline

# Copy environment file
cp .env.example .env

# Edit .env and add your Claude API key
nano .env  # or use your preferred editor
```

**Required in .env:**
```env
ANTHROPIC_API_KEY=your-api-key-here
```

### 2. Start with Docker (2 min)

```bash
cd docker
docker-compose up -d
```

This starts:
- ✅ PostgreSQL database (port 5432)
- ✅ Redis cache (port 6379)
- ✅ API Gateway (port 3000)
- ✅ Pipeline Engine (port 8000)
- ✅ Frontend (port 5173)

### 3. Access the Application (30 sec)

Open your browser:
```
http://localhost:5173
```

### 4. Create Your First Module (1 min)

1. Enter a module name (e.g., "Fraction Learning")
2. Describe your module:
   ```
   Create a fractions learning module for 4th graders where students
   practice adding fractions with visual pie chart representations.
   Include interactive exercises and instant feedback.
   ```
3. Click "Generate Module"
4. Watch the AI pipeline work! 🎉

## 📊 Check Progress

### API Gateway Health
```bash
curl http://localhost:3000/health
```

### Pipeline Engine Health
```bash
curl http://localhost:8000/health
```

### Database Connection
```bash
docker exec -it ai-edu-postgres psql -U postgres -d ai_education -c "SELECT COUNT(*) FROM modules;"
```

## 🛠️ Local Development (Without Docker)

### Terminal 1: Database
```bash
# Install and start PostgreSQL locally
psql -U postgres -f database/schema.sql
```

### Terminal 2: API Gateway
```bash
cd backend/api-gateway
npm install
npm run dev
# Runs on http://localhost:3000
```

### Terminal 3: Pipeline Engine
```bash
cd backend/pipeline-engine
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
```

### Terminal 4: Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## 📝 Example Teacher Requests

Try these examples:

**1. Fractions Module**
```
Create a fractions module for grade 4 students. Include visual representations
using pie charts, practice problems for adding and subtracting fractions, and
provide immediate feedback on answers.
```

**2. Geometry Module**
```
Design a geometry module teaching triangles to 6th graders. Include area and
perimeter calculations, different types of triangles, and interactive tools
for measuring angles.
```

**3. Algebra Module**
```
Build an algebra module introducing linear equations to 7th grade students.
Include step-by-step problem solving, graph visualization, and word problems
with real-world applications.
```

## 🔍 Monitor Generation

### Check Module Status
```bash
# Get all modules
curl http://localhost:3000/api/modules

# Get specific module (replace with actual ID)
curl http://localhost:3000/api/modules/{module-id}
```

### Check Generation Jobs
```bash
# Get generation jobs for a module
curl http://localhost:3000/api/generation/jobs/{module-id}

# Get job status
curl http://localhost:3000/api/generation/status/{job-id}
```

## 🐛 Troubleshooting

### Docker containers not starting
```bash
# Check logs
docker-compose logs

# Restart specific service
docker-compose restart api-gateway
```

### Database connection error
```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs ai-edu-postgres
```

### Claude API errors
- Verify `ANTHROPIC_API_KEY` is set in `.env`
- Check API key validity at https://console.anthropic.com
- Ensure sufficient API credits

### Port already in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process (replace PID)
kill -9 PID
```

## 📚 Next Steps

1. **Read Full Documentation**: [README.md](README.md)
2. **Explore API**: http://localhost:3000/api
3. **View Database**: Connect to PostgreSQL at localhost:5432
4. **Customize**: Edit prompts in `backend/pipeline-engine/engines/`

## 🎯 MVP Features Included

- ✅ Teacher request input (natural language)
- ✅ World model reconstruction (Claude API)
- ✅ Concept graph generation
- ✅ Database schema design
- ✅ Rule generation engine
- ✅ Progress monitoring UI
- ✅ Module management

## 🔄 Stop Everything

```bash
cd docker
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v
```

---

**🎉 Congratulations!** You're running the AI Education Pipeline MVP!

For production deployment, see [DEPLOYMENT.md](docs/DEPLOYMENT.md)

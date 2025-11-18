# Quick Start Guide

Get the Blend Difference Animation running in 5 minutes!

## Option 1: Docker (Recommended)

The easiest way to get started is using Docker Compose.

### Prerequisites
- Docker
- Docker Compose

### Steps

1. **Clone and navigate to the project**:
```bash
cd alt42standalone_v1.0
```

2. **Start all services**:
```bash
docker-compose up -d
```

This will start:
- MySQL database on port 3306
- PHP backend on port 8080
- React frontend on port 3000

3. **Wait for services to initialize** (about 30 seconds)

4. **Open your browser**:
```
http://localhost:3000
```

You should see the Blend Difference Animation interface!

5. **Test the API**:
```bash
curl http://localhost:8080/api/health
```

### Stopping Services

```bash
docker-compose down
```

To remove all data:
```bash
docker-compose down -v
```

---

## Option 2: Manual Setup

If you prefer to run without Docker:

### Prerequisites
- Node.js 16+
- PHP 7.1.9+
- MySQL 5.7+

### Steps

1. **Setup Database**:
```bash
mysql -u root -p
CREATE DATABASE blend_difference_db;
exit

mysql -u root -p blend_difference_db < database/schema.sql
```

2. **Setup Backend**:
```bash
cd backend
# Configure config.php with your database credentials
php -S localhost:8080 &
cd ..
```

3. **Setup Frontend**:
```bash
cd frontend
npm install
npm run dev
```

4. **Open your browser**:
```
http://localhost:3000
```

---

## Using the Application

### 1. Select a Problem
Click on any problem card to load it:
- Linear vs Quadratic
- Sine vs Cosine
- Exponential Growth
- Polynomial Comparison

### 2. Configure Animation
- **Blend Mode**: Choose how colors blend (difference, multiply, screen, etc.)
- **Show Grid**: Toggle coordinate grid
- **Show Axes**: Toggle X and Y axes
- **Virtual Smartphone**: Toggle mobile device display

### 3. Watch the Animation
The animation shows three phases:
1. First function appears (0-30%)
2. Second function appears (30-60%)
3. Blend effect visualization (60-100%)

### 4. Control Playback
- **Pause/Play**: Control animation
- **Restart**: Reset to beginning

---

## Moodle Integration (Optional)

### 1. Configure Moodle

In Moodle admin panel:
- Enable Web Services (REST protocol)
- Create a web service token
- Note your Moodle URL

### 2. Configure Backend

Create `.env` file:
```bash
export MOODLE_URL=http://your-moodle-site.com
export MOODLE_TOKEN=your_token_here
```

Or edit `backend/config.php` directly.

### 3. Create Integration

```bash
curl -X POST http://localhost:8080/api/moodle \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 1,
    "moodle_course_id": 2,
    "integration_type": "quiz"
  }'
```

### 4. Sync Problems

```bash
curl -X POST http://localhost:8080/api/moodle/1/sync
```

---

## Creating Custom Problems

### Via API:

```bash
curl -X POST http://localhost:8080/api/problems \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Custom Problem",
    "description": "Comparing two interesting functions",
    "function1": "x^2",
    "function2": "x^3",
    "color1": "#FF0000",
    "color2": "#0000FF",
    "category": "Custom",
    "difficulty": "medium",
    "hints": [
      "Look at how they diverge",
      "Consider the rate of growth"
    ]
  }'
```

### Via Database:

```sql
INSERT INTO problems (title, description, function1, function2, color1, color2, difficulty, category)
VALUES ('Custom Problem', 'My description', 'sin(x)', 'cos(x)', '#FF5733', '#33FF57', 'medium', 'Custom');
```

Refresh the frontend to see your new problem!

---

## Mathematical Functions Supported

The app uses math.js, so you can use:

### Basic Operations
- `+`, `-`, `*`, `/`, `^` (power)

### Functions
- `sin(x)`, `cos(x)`, `tan(x)`
- `asin(x)`, `acos(x)`, `atan(x)`
- `sinh(x)`, `cosh(x)`, `tanh(x)`
- `sqrt(x)`, `abs(x)`
- `exp(x)`, `log(x)`, `log10(x)`
- `ceil(x)`, `floor(x)`, `round(x)`

### Constants
- `pi`, `e`

### Examples
- `2*x + 3`
- `x^2 - 4*x + 4`
- `sin(2*pi*x)`
- `e^x`
- `log(x + 1)`
- `sqrt(x^2 + 1)`

---

## Troubleshooting

### Frontend won't start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend errors
- Check `backend/config.php` database credentials
- Verify MySQL is running: `mysql -u root -p`
- Check PHP version: `php -v` (should be 7.1.9+)

### Database connection failed
```bash
mysql -u root -p
CREATE DATABASE IF NOT EXISTS blend_difference_db;
GRANT ALL PRIVILEGES ON blend_difference_db.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### Port already in use
Change ports in:
- `docker-compose.yml` (for Docker)
- `vite.config.ts` (frontend)
- PHP command (backend)

---

## Next Steps

- Explore the codebase in `/frontend/src/components`
- Read the full README.md
- Check database schema in `/database/schema.sql`
- Customize blend modes in `/frontend/src/utils/colorBlending.ts`
- Add more problems via the API

Enjoy visualizing function differences!

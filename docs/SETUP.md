# Divisor Molecules - Setup Guide

## Prerequisites

### Required Software

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MySQL** 5.7+ ([Download](https://dev.mysql.com/downloads/mysql/))
- **Git** ([Download](https://git-scm.com/))

### Optional

- **Docker** & Docker Compose ([Download](https://www.docker.com/))

---

## Installation Methods

### Option 1: Docker (Recommended)

The easiest way to run the entire application.

#### 1. Clone the repository

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

#### 2. Create environment file

```bash
cp .env.example .env
```

Edit `.env` and configure your settings:

```env
DB_PASSWORD=your_secure_password
MOODLE_URL=https://your-moodle-instance.com
MOODLE_TOKEN=your_moodle_token
```

#### 3. Start all services

```bash
docker-compose up -d
```

This will start:
- MySQL database (port 3306)
- Backend API (port 3000)
- Frontend app (port 5173)

#### 4. Access the application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health

#### 5. View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

#### 6. Stop services

```bash
docker-compose down
```

---

### Option 2: Manual Installation

For development or customization.

#### 1. Clone the repository

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

#### 2. Setup Database

Create MySQL database:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE divisor_molecules CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

Import schema:

```bash
mysql -u root -p divisor_molecules < database/schema.sql
```

#### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=divisor_molecules

MOODLE_URL=https://your-moodle-instance.com
MOODLE_TOKEN=your_moodle_token

CORS_ORIGIN=http://localhost:5173
```

Start backend:

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

#### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### 5. Access the application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api

---

## Moodle Integration Setup

### 1. Enable Web Services in Moodle

1. Go to **Site Administration** > **Advanced features**
2. Enable **Enable web services**
3. Enable **Enable REST protocol**

### 2. Create Web Service

1. Go to **Site Administration** > **Server** > **Web services** > **External services**
2. Click **Add** to create a new service
3. Name: "Divisor Molecules API"
4. Enable: Yes
5. Save

### 3. Add Functions to Service

Add these functions to your web service:
- `core_course_get_courses`
- `core_course_get_contents`
- `core_enrol_get_enrolled_users`
- `mod_assign_save_grade`
- `core_completion_update_activity_completion_status_manually`

### 4. Create Service User

1. Create a new user account for the service
2. Assign appropriate role (e.g., Manager or custom role)

### 5. Generate Token

1. Go to **Site Administration** > **Server** > **Web services** > **Manage tokens**
2. Create token for your service user
3. Copy the token and add to `.env` file as `MOODLE_TOKEN`

### 6. Test Connection

```bash
curl "http://localhost:3000/api/moodle/course/1"
```

---

## Development Workflow

### Frontend Development

```bash
cd frontend
npm run dev
```

The app will auto-reload when you make changes.

### Backend Development

```bash
cd backend
npm run dev
```

Uses `nodemon` for auto-restart on file changes.

### Database Changes

After modifying `database/schema.sql`:

```bash
# Drop and recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS divisor_molecules; CREATE DATABASE divisor_molecules;"
mysql -u root -p divisor_molecules < database/schema.sql
```

---

## Testing

### Run Frontend Tests

```bash
cd frontend
npm test
```

### Run Backend Tests

```bash
cd backend
npm test
```

### API Testing with cURL

```bash
# Get random problem
curl http://localhost:3000/api/problems/random

# Get problem by ID
curl http://localhost:3000/api/problems/prob_001

# Submit progress
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student_001",
    "problemId": "prob_001",
    "score": 95,
    "timeSpent": 85,
    "attempts": 1
  }'
```

---

## Troubleshooting

### Database Connection Error

**Error**: `ER_ACCESS_DENIED_ERROR` or `ECONNREFUSED`

**Solutions**:
1. Check MySQL is running: `mysql -u root -p`
2. Verify credentials in `.env` file
3. Ensure database exists: `SHOW DATABASES;`

### Frontend Can't Connect to Backend

**Error**: Network error or CORS error

**Solutions**:
1. Check backend is running: `curl http://localhost:3000/api/health`
2. Verify `CORS_ORIGIN` in backend `.env`
3. Check frontend proxy in `vite.config.ts`

### Moodle Integration Not Working

**Solutions**:
1. Verify Moodle URL is correct
2. Check token is valid
3. Ensure web services are enabled in Moodle
4. Check Moodle logs for errors

### Port Already in Use

**Error**: `EADDRINUSE: address already in use`

**Solutions**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

---

## Production Deployment

### Build for Production

#### Frontend
```bash
cd frontend
npm run build
```

Output will be in `frontend/dist/`

#### Backend
```bash
cd backend
npm run build
```

Output will be in `backend/dist/`

### Serve with Nginx

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Environment Variables

Set production environment variables:

```env
NODE_ENV=production
DB_PASSWORD=<secure-password>
JWT_SECRET=<strong-secret-key>
CORS_ORIGIN=https://your-domain.com
```

### SSL/HTTPS

Use Let's Encrypt for free SSL:

```bash
sudo certbot --nginx -d your-domain.com
```

---

## Next Steps

- Read [API Documentation](./API.md)
- Customize molecule colors and animations
- Integrate with your Moodle instance
- Add more problem types
- Implement user authentication

---

## Support

For issues or questions:
- GitHub Issues: <repository-url>/issues
- Email: support@example.com

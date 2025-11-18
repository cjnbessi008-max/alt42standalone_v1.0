# Installation Guide

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **MySQL** 5.7
- **Docker** and Docker Compose (optional, for containerized deployment)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Environment Configuration

Copy the example environment file and update with your settings:

```bash
cp .env.example .env
```

Edit `.env` and configure:
- Database credentials
- Moodle URL and API token
- Secret key for JWT authentication

### 3. Database Setup

Start MySQL and create the database:

```bash
mysql -u root -p
```

Then run the schema:

```bash
mysql -u root -p < database/schema.sql
```

### 4. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the backend
python main.py
```

The API will be available at `http://localhost:8000`
- API documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

### 5. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Docker Deployment

For a containerized deployment using Docker:

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

Services will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- MySQL: `localhost:3306`

## Production Deployment

### Building for Production

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

Set `DEBUG=False` in `.env`

Run with gunicorn:
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

**Frontend:**
```bash
cd frontend
npm run build
```

Serve the `dist` folder with nginx or any static file server.

### Nginx Configuration Example

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
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Moodle Integration

### Setting Up Moodle Web Services

1. **Enable Web Services** in Moodle:
   - Site Administration → Advanced Features
   - Check "Enable web services"

2. **Create a Web Service User**:
   - Create a dedicated user for API access
   - Assign appropriate roles

3. **Create a Service**:
   - Site Administration → Server → Web Services → External Services
   - Add a new service
   - Add required functions:
     - `core_user_get_users_by_field`
     - `core_question_get_question`
     - `mod_assign_save_grade`

4. **Generate Token**:
   - Site Administration → Server → Web Services → Manage Tokens
   - Create token for the service and user
   - Copy the token to `.env` as `MOODLE_API_TOKEN`

5. **Configure in Application**:
   - Set `MOODLE_URL` to your Moodle instance URL
   - Set `MOODLE_API_TOKEN` to the generated token

## Troubleshooting

### Database Connection Issues

```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u app_user -p -h localhost permutation_pattern
```

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Frontend Not Connecting to Backend

- Ensure backend is running on port 8000
- Check CORS settings in `backend/app/core/config.py`
- Verify `VITE_API_URL` in frontend `.env`

### Docker Issues

```bash
# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up

# View container logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql
```

## Testing the Installation

1. **Backend Health Check**:
   ```bash
   curl http://localhost:8000/health
   ```

2. **Get Pattern Types**:
   ```bash
   curl http://localhost:8000/api/v1/problems/pattern-types
   ```

3. **Frontend**:
   - Open `http://localhost:5173`
   - Click on difficulty level
   - Try solving a problem

## Next Steps

- Configure Moodle integration
- Set up production database backups
- Configure SSL certificates
- Set up monitoring and logging
- Review security settings

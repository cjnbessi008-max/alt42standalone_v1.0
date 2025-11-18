# Deployment Guide

## Deployment Options

### Option 1: Docker Compose (Recommended for Development/Testing)

This is the easiest way to get started.

#### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

#### Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd dmn-math-game
```

2. **Configure environment variables**
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your settings
```

3. **Start all services**
```bash
docker-compose up -d
```

4. **Initialize the database**
```bash
# The schema.sql is automatically loaded on first run
# Verify with:
docker-compose logs db
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/

6. **View logs**
```bash
docker-compose logs -f
```

7. **Stop services**
```bash
docker-compose down
```

### Option 2: Manual Deployment (Production)

#### Backend Deployment

1. **Set up PostgreSQL**
```bash
# Install PostgreSQL 15
sudo apt-get install postgresql-15

# Create database
sudo -u postgres psql
CREATE DATABASE dmn_math_game;
CREATE USER dmn_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE dmn_math_game TO dmn_user;
\q

# Load schema
psql -U dmn_user -d dmn_math_game -f database/schema.sql
```

2. **Set up Redis**
```bash
sudo apt-get install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

3. **Deploy Backend**
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env  # Edit with production settings

# Run with Gunicorn (production server)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

4. **Set up systemd service**
```bash
sudo nano /etc/systemd/system/dmn-math-backend.service
```

```ini
[Unit]
Description=DMN Math Game Backend
After=network.target postgresql.service redis.service

[Service]
Type=notify
User=www-data
WorkingDirectory=/var/www/dmn-math-game/backend
Environment="PATH=/var/www/dmn-math-game/backend/venv/bin"
ExecStart=/var/www/dmn-math-game/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:app

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable dmn-math-backend
sudo systemctl start dmn-math-backend
```

#### Frontend Deployment

1. **Build for production**
```bash
cd frontend

# Install dependencies
npm install

# Build
npm run build
```

2. **Serve with Nginx**
```bash
sudo apt-get install nginx

sudo nano /etc/nginx/sites-available/dmn-math-game
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/dmn-math-game/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/dmn-math-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

3. **Set up SSL with Let's Encrypt**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 3: Cloud Deployment (AWS/Azure/GCP)

#### AWS Deployment Example

1. **Set up RDS (PostgreSQL)**
- Create RDS PostgreSQL 15 instance
- Note the endpoint and credentials

2. **Set up ElastiCache (Redis)**
- Create Redis cluster
- Note the endpoint

3. **Deploy Backend on EC2 or ECS**

**EC2:**
- Launch Ubuntu instance
- Follow manual deployment steps above
- Use RDS and ElastiCache endpoints in `.env`

**ECS (Fargate):**
```bash
# Build and push Docker image
docker build -t dmn-math-backend ./backend
docker tag dmn-math-backend:latest <aws-account-id>.dkr.ecr.<region>.amazonaws.com/dmn-math-backend:latest
docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/dmn-math-backend:latest

# Create ECS task definition and service
# Use AWS Console or AWS CLI
```

4. **Deploy Frontend on S3 + CloudFront**
```bash
# Build frontend
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

5. **Set up API Gateway (optional)**
- Configure API Gateway to proxy backend
- Or use Application Load Balancer with ECS

## Environment Variables

### Backend (.env)

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/dmn_math_game
SECRET_KEY=<generate-with-python-secrets-token-hex-32>
REDIS_URL=redis://host:6379/0

# Optional
FLASK_ENV=production
FLASK_DEBUG=False
PORT=5000
CORS_ORIGINS=https://your-domain.com

# LTI (if using LMS integration)
LTI_CLIENT_ID=your-client-id
LTI_DEPLOYMENT_ID=your-deployment-id
LTI_ISS=https://your-lms.com
LTI_AUTH_URL=https://your-lms.com/api/lti/authorize_redirect
LTI_TOKEN_URL=https://your-lms.com/login/oauth2/token
LTI_KEYSET_URL=https://your-lms.com/api/lti/security/jwks
```

### Frontend (.env)

```env
VITE_API_URL=https://your-domain.com
```

## Security Checklist

- [ ] Change default SECRET_KEY
- [ ] Use strong database passwords
- [ ] Enable HTTPS (required for LTI)
- [ ] Set CORS_ORIGINS to your actual domain
- [ ] Disable Flask DEBUG in production
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Monitor logs for suspicious activity

## Monitoring

### Application Logs

```bash
# Docker
docker-compose logs -f backend

# Systemd
sudo journalctl -u dmn-math-backend -f
```

### Health Checks

```bash
# Backend health
curl http://localhost:5000/health

# Database connection
psql -U dmn_user -d dmn_math_game -c "SELECT 1"

# Redis
redis-cli ping
```

### Monitoring Tools (Optional)

- **Prometheus + Grafana**: Metrics and dashboards
- **Sentry**: Error tracking
- **CloudWatch/Stackdriver**: Cloud-native monitoring

## Backup and Recovery

### Database Backup

```bash
# Backup
pg_dump -U dmn_user dmn_math_game > backup_$(date +%Y%m%d).sql

# Restore
psql -U dmn_user dmn_math_game < backup_20240101.sql
```

### Automated Backups

```bash
# Add to crontab
0 2 * * * pg_dump -U dmn_user dmn_math_game > /backups/dmn_math_$(date +\%Y\%m\%d).sql
```

## Scaling

### Horizontal Scaling

1. **Backend**: Run multiple instances behind a load balancer
2. **Database**: Use read replicas for heavy read workloads
3. **Redis**: Use Redis Cluster for session distribution

### Vertical Scaling

- Increase instance size based on metrics
- Monitor CPU, memory, and database connections

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Verify database connection
psql $DATABASE_URL -c "SELECT 1"

# Check dependencies
pip list
```

### Database connection errors

```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U dmn_user -h localhost -d dmn_math_game

# Check firewall
sudo ufw status
```

### Frontend build fails

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+
```

## Performance Optimization

1. **Enable gzip compression** in Nginx
2. **Use CDN** for frontend static assets
3. **Database indexing** (already in schema.sql)
4. **Redis caching** for frequently accessed data
5. **Connection pooling** for database

## Updates and Maintenance

```bash
# Pull latest code
git pull origin main

# Backend updates
cd backend
pip install -r requirements.txt
sudo systemctl restart dmn-math-backend

# Frontend updates
cd frontend
npm install
npm run build
# Copy dist/ to web server

# Database migrations
psql -U dmn_user dmn_math_game -f migrations/new_migration.sql
```

## Support

For deployment issues, check:
1. Application logs
2. System logs
3. Database logs
4. Network connectivity
5. Environment variables

Contact the development team if issues persist.

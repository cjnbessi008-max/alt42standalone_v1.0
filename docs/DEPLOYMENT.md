# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)
- Domain name (for production)
- SSL certificate (for production)

## Development Deployment

### 1. Clone Repository

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Install Dependencies

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd client
npm install
cd ..
```

### 3. Setup Environment Variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start Database Services

```bash
docker-compose up -d
```

### 5. Run Database Migrations

```bash
npm run db:migrate
```

### 6. Seed Sample Data (Optional)

```bash
npm run db:seed
```

### 7. Start Development Servers

```bash
# Start both backend and frontend
npm run dev:full

# Or start separately:
# Backend only
npm run dev

# Frontend only (in another terminal)
npm run client
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## Production Deployment

### Option 1: Docker Deployment (Recommended)

#### 1. Create Production Dockerfile

Create `Dockerfile.prod`:

```dockerfile
# Multi-stage build
FROM node:18-alpine AS backend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY server ./server

FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client ./
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=backend-build /app ./
COPY --from=frontend-build /app/build ./client/build
EXPOSE 5000
CMD ["node", "server/index.js"]
```

#### 2. Create Docker Compose for Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: matching_guide_app
    restart: always
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    networks:
      - app-network

  postgres:
    image: postgres:15-alpine
    container_name: matching_guide_db
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    container_name: matching_guide_redis
    restart: always
    volumes:
      - redis_data:/data
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: matching_guide_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

#### 3. Configure Nginx

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server app:5000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # API requests
        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location / {
            root /app/client/build;
            try_files $uri /index.html;
        }
    }
}
```

#### 4. Deploy

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Run migrations
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate
```

### Option 2: Traditional Server Deployment

#### 1. Setup Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 15
sudo apt install -y postgresql-15 postgresql-contrib-15

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Clone and Setup Application

```bash
cd /var/www
git clone <repository-url> 3d-matching-guide
cd 3d-matching-guide

# Install dependencies
npm install
cd client && npm install && cd ..

# Build frontend
cd client && npm run build && cd ..

# Setup environment
cp .env.example .env.production
nano .env.production  # Edit configuration
```

#### 3. Configure PostgreSQL

```bash
sudo -u postgres psql

CREATE DATABASE matching_guide_db;
CREATE USER matchinguser WITH PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE matching_guide_db TO matchinguser;
\q
```

#### 4. Run Migrations

```bash
NODE_ENV=production npm run db:migrate
```

#### 5. Start Application with PM2

```bash
# Start backend
pm2 start server/index.js --name 3d-matching-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 6. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/3d-matching-guide
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /var/www/3d-matching-guide/client/build;
        try_files $uri /index.html;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/3d-matching-guide /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Environment Variables

### Production `.env.production`

```bash
NODE_ENV=production
PORT=5000
API_BASE_URL=https://your-domain.com

DB_HOST=localhost
DB_PORT=5432
DB_NAME=matching_guide_db
DB_USER=matchinguser
DB_PASSWORD=secure-password

JWT_SECRET=very-secure-random-string-change-this

LMS_INTEGRATION_ENABLED=true
LMS_API_URL=https://moodle.kaist.ac.kr/webservice/rest/server.php
LMS_API_KEY=your-moodle-api-key

CORS_ORIGIN=https://your-domain.com

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Monitoring

### PM2 Monitoring

```bash
# View logs
pm2 logs 3d-matching-api

# Monitor resources
pm2 monit

# View status
pm2 status
```

### Database Monitoring

```bash
# Check PostgreSQL connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Check database size
sudo -u postgres psql -c "\l+"
```

---

## Backup

### Database Backup

```bash
# Create backup script
cat > /root/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U matchinguser matching_guide_db > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x /root/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /root/backup-db.sh
```

### Application Backup

```bash
# Backup application files
tar -czf /backups/app_$(date +%Y%m%d).tar.gz /var/www/3d-matching-guide
```

---

## Troubleshooting

### Check Application Logs

```bash
pm2 logs 3d-matching-api --lines 100
```

### Check Nginx Logs

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check Database Connection

```bash
sudo -u postgres psql -d matching_guide_db
```

### Restart Services

```bash
# Restart application
pm2 restart 3d-matching-api

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql

# Restart Redis
sudo systemctl restart redis
```

---

## Security Checklist

- [ ] Change default passwords
- [ ] Enable firewall (ufw)
- [ ] Setup SSL/TLS certificates
- [ ] Configure rate limiting
- [ ] Enable CORS only for trusted origins
- [ ] Setup automated backups
- [ ] Enable database SSL connections
- [ ] Use environment variables for secrets
- [ ] Setup log rotation
- [ ] Configure fail2ban
- [ ] Regular security updates

---

## Scaling

### Horizontal Scaling

1. Use a load balancer (Nginx, HAProxy)
2. Deploy multiple app instances
3. Use Redis for session storage
4. Setup PostgreSQL replication

### Vertical Scaling

1. Increase server resources
2. Optimize database queries
3. Implement caching strategies
4. Use CDN for static assets

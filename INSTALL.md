# Installation Guide

## Prerequisites

### System Requirements
- **Node.js**: 18.x or higher
- **PHP**: 7.1.9 (for Moodle 3.7 compatibility)
- **MySQL**: 5.7 or higher
- **Apache**: 2.4 or higher (with mod_rewrite enabled)
- **Moodle**: 3.7 (optional, demo mode available)

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 3. Backend Setup

#### 3.1 Configure Environment Variables

```bash
cd ../backend/api
cp .env.example .env
```

Edit `.env` file:
```ini
# If you have Moodle installed
DB_HOST=localhost
DB_NAME=moodle
DB_USER=moodle_user
DB_PASS=your_password
MOODLE_PREFIX=mdl_

# For demo mode (no Moodle required)
# Leave DB credentials empty or use dummy values
API_DEBUG=true
```

#### 3.2 Apache Configuration

**Option A: Using Virtual Host (Recommended)**

Create `/etc/apache2/sites-available/alt42.conf`:
```apache
<VirtualHost *:80>
    ServerName alt42.local
    DocumentRoot /path/to/alt42standalone_v1.0/backend

    <Directory /path/to/alt42standalone_v1.0/backend/api>
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/alt42_error.log
    CustomLog ${APACHE_LOG_DIR}/alt42_access.log combined
</VirtualHost>
```

Enable the site:
```bash
sudo a2ensite alt42
sudo a2enmod rewrite
sudo systemctl restart apache2
```

Add to `/etc/hosts`:
```
127.0.0.1 alt42.local
```

**Option B: Using Symbolic Link**

```bash
sudo ln -s /path/to/alt42standalone_v1.0/backend/api /var/www/html/api
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### 3.3 Set Permissions

```bash
sudo chown -R www-data:www-data /path/to/alt42standalone_v1.0/backend/api
sudo chmod -R 755 /path/to/alt42standalone_v1.0/backend/api
```

### 4. Database Setup (Optional)

#### 4.1 With Existing Moodle Installation

If you already have Moodle 3.7 installed:
1. Update `.env` with your Moodle database credentials
2. The API will automatically fetch questions from Moodle tables
3. No additional database setup required

#### 4.2 Demo Mode (No Moodle)

If you don't have Moodle:
1. Leave database credentials empty or use dummy values
2. The API will automatically use demo data
3. Sample questions will be served automatically

## Verification

### 1. Test Frontend

Visit `http://localhost:3000`

You should see:
- Main application interface
- Virtual smartphone in bottom-right corner
- Question controls

### 2. Test Backend API

```bash
# Test questions endpoint
curl http://localhost/api/moodle/questions/1

# Or if using virtual host
curl http://alt42.local/api/moodle/questions/1
```

Expected response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "text": "다음 중 분수 3/4를 소수로 나타내면?",
    "type": "multiple_choice",
    "options": ["0.25", "0.5", "0.75", "1.0"],
    "correctAnswer": "0.75"
  }
}
```

### 3. Test Flip Moment Effect

1. Open the application in your browser
2. Open DevTools (F12)
3. Enable Device Toolbar (Ctrl+Shift+M or Cmd+Shift+M)
4. Rotate the simulated device
5. Watch for the flip moment visual effects!

## Troubleshooting

### Frontend Issues

**Issue**: `npm install` fails
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Port 3000 already in use
```bash
# Edit vite.config.ts and change port
server: {
  port: 3001  // Change to any available port
}
```

### Backend Issues

**Issue**: API returns 404
- Check Apache mod_rewrite is enabled: `sudo a2enmod rewrite`
- Check `.htaccess` file exists in `/backend/api/`
- Restart Apache: `sudo systemctl restart apache2`

**Issue**: Database connection failed
- Verify MySQL is running: `sudo systemctl status mysql`
- Check database credentials in `.env`
- For demo mode, use empty credentials

**Issue**: CORS errors
- Ensure `API_ENABLE_CORS=true` in `.env`
- Check Apache headers module: `sudo a2enmod headers`
- Restart Apache

### Permission Issues

```bash
# Fix file permissions
sudo chown -R $USER:www-data backend/api
sudo chmod -R 755 backend/api
sudo chmod 644 backend/api/.htaccess
```

## Production Deployment

### 1. Build Frontend

```bash
cd frontend
npm run build
```

Built files will be in `frontend/dist/`

### 2. Configure Apache for Production

Update virtual host to serve built frontend:
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /path/to/alt42standalone_v1.0/frontend/dist

    <Directory /path/to/alt42standalone_v1.0/frontend/dist>
        Options FollowSymLinks
        AllowOverride All
        Require all granted

        # React Router support
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    Alias /api /path/to/alt42standalone_v1.0/backend/api
    <Directory /path/to/alt42standalone_v1.0/backend/api>
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### 3. Security Checklist

- [ ] Change `API_SECRET_KEY` in `.env`
- [ ] Set `API_DEBUG=false` in `.env`
- [ ] Use HTTPS (SSL certificate)
- [ ] Restrict database user permissions
- [ ] Enable firewall rules
- [ ] Regular backups

## Development Tips

### Hot Module Replacement

Frontend supports HMR. Changes will reflect immediately without full page reload.

### API Development

Edit PHP files in `backend/api/`. Apache will serve updated files immediately (no restart needed in most cases).

### Debugging

**Frontend:**
- Use React DevTools browser extension
- Check browser console for errors

**Backend:**
- Set `API_DEBUG=true` in `.env`
- Check Apache error logs: `tail -f /var/log/apache2/error.log`
- Check PHP error logs: `tail -f /var/log/php/error.log`

## Next Steps

1. Read [README.md](README.md) for usage instructions
2. Customize visual effects in `frontend/src/hooks/useVisualEffects.ts`
3. Add more question types in `backend/api/questions.php`
4. Integrate with your Moodle instance

## Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review error logs

---

**Installation complete! 🎉**

Enjoy using Flip Moment Visual Effects!

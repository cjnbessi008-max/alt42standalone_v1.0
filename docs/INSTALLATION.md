# Installation Guide

Complete setup guide for ALT42 Trap Shadow feature.

## Prerequisites

### System Requirements
- **Node.js**: 16.x or higher
- **npm**: 8.x or higher
- **MySQL**: 5.7 (compatible with Moodle 3.7)
- **PHP**: 7.1.9 (for Moodle)
- **Moodle**: 3.7

### Development Tools
- Git
- Code editor (VS Code recommended)
- MySQL Workbench or similar (optional)

## Step 1: Clone Repository

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

## Step 2: Database Setup

### 2.1 Create Database (if needed)

```bash
mysql -u root -p
```

```sql
CREATE DATABASE IF NOT EXISTS moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2.2 Run Schema Script

```bash
cd database
mysql -u moodle_user -p moodle < schema.sql
```

This will create:
- `alt42_trap_points` - Trap point data table
- `alt42_trap_analytics` - Analytics tracking table
- `alt42_config` - Configuration settings
- `alt42_trap_stats` - Statistics view

### 2.3 Verify Installation

```bash
mysql -u moodle_user -p moodle -e "SHOW TABLES LIKE 'alt42%';"
```

You should see 3 tables:
- alt42_config
- alt42_trap_analytics
- alt42_trap_points

## Step 3: Backend Setup

### 3.1 Install Dependencies

```bash
cd ../backend
npm install
```

### 3.2 Configure Environment

```bash
cp .env.example .env
```

Edit `.env` file with your settings:

```env
# Server
PORT=3001
NODE_ENV=development

# Moodle Configuration
MOODLE_URL=https://your-moodle-instance.com
MOODLE_TOKEN=your_webservice_token_here

# MySQL Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=moodle
MYSQL_USER=moodle_user
MYSQL_PASSWORD=your_secure_password

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3.3 Get Moodle Web Service Token

1. Log in to Moodle as administrator
2. Go to **Site Administration** → **Plugins** → **Web services** → **Manage tokens**
3. Create a new token for your user
4. Copy the token to `.env` file

### 3.4 Start Backend Server

```bash
npm run dev
```

You should see:
```
✅ Server started successfully!
📡 Listening on port 3001
🔗 API Base URL: http://localhost:3001
```

### 3.5 Test Backend

Open browser: http://localhost:3001/health

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T...",
  "service": "ALT42 Trap Shadow Backend"
}
```

## Step 4: Frontend Setup

### 4.1 Install Dependencies

Open new terminal:

```bash
cd ../frontend
npm install
```

### 4.2 Configure Environment

```bash
cp .env.example .env
```

Edit `.env` file:

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ENABLE_TRAP_SHADOWS=true
REACT_APP_PHONE_POSITION=bottom-right
```

### 4.3 Start Frontend Server

```bash
npm start
```

Browser should automatically open to: http://localhost:3000

## Step 5: Verify Installation

### 5.1 Check Virtual Phone Display

You should see:
- ✅ Main page with gradient background
- ✅ Control panel with input fields
- ✅ Virtual smartphone in bottom-right corner
- ✅ Demo problem loaded in phone

### 5.2 Test Trap Shadows

1. Click "데모 문제 로드" button
2. Check virtual phone screen
3. Look for orange shadow overlays (trap points)
4. Hover over shadows to see tooltips
5. Click shadows to interact

### 5.3 Test API Integration

1. Enter a question ID (e.g., 1)
2. Click "문제 불러오기"
3. Check console for API calls
4. Verify problem loads in phone

### 5.4 Toggle Trap Shadows

1. Click "🎯 함정 표시 ON" button
2. Shadows should disappear
3. Click again to show shadows

## Troubleshooting

### Backend Won't Start

**Error**: `Database connection failed`

**Solution**:
- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `.env`
- Test connection: `mysql -u moodle_user -p moodle`

**Error**: `Moodle connection failed`

**Solution**:
- Verify `MOODLE_URL` is correct
- Check `MOODLE_TOKEN` is valid
- Ensure Moodle web services are enabled

### Frontend Issues

**Error**: `Cannot connect to backend`

**Solution**:
- Verify backend is running on port 3001
- Check `REACT_APP_API_URL` in frontend `.env`
- Check CORS settings in backend `.env`

**Error**: `Module not found`

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Virtual Phone Not Showing

**Solution**:
- Check browser console for errors
- Verify React is rendering: View page source
- Check CSS is loading properly
- Try different browser (Chrome recommended)

### Trap Shadows Not Appearing

**Solution**:
- Verify demo problem has trap points
- Check "함정 표시 ON" button is active
- Look for orange overlays on problem content
- Check browser console for errors

## Development Workflow

### Backend Development

```bash
cd backend
npm run dev  # Hot reload enabled
```

### Frontend Development

```bash
cd frontend
npm start  # Hot reload enabled
```

### Database Changes

```bash
mysql -u moodle_user -p moodle < database/migration.sql
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Production Build

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
# Serve build/ directory with nginx or similar
```

## Next Steps

1. **Add Real Questions**: Insert trap points for real Moodle questions
2. **Configure Moodle**: Enable web services and create tokens
3. **Customize UI**: Modify colors, layout in styled-components
4. **Add Analytics**: Track student interactions with trap points
5. **Deploy**: Set up production environment

## Support

For issues or questions:
1. Check documentation in `docs/` folder
2. Review API endpoints in backend code
3. Check browser console for errors
4. Review backend logs

## Security Notes

⚠️ **Important**:
- Never commit `.env` files to git
- Use strong passwords for MySQL
- Keep Moodle tokens secure
- Enable HTTPS in production
- Implement rate limiting for production

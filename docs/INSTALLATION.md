# Installation Guide - ALT42 Expansion Mode

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.x or higher) - [Download](https://nodejs.org/)
- **npm** (v6.x or higher) - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **Moodle** (v3.7 or higher) - Optional, can use mock data

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Install Dependencies

Install both backend and frontend dependencies:

```bash
npm run install:all
```

Or install them separately:

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd src/frontend
npm install
cd ../..
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Backend Server Configuration
PORT=3001
NODE_ENV=development

# Moodle LMS Configuration (Optional - leave empty to use mock data)
MOODLE_URL=https://your-moodle-instance.com
MOODLE_TOKEN=your_moodle_webservice_token_here

# Expansion Mode Settings
EXPANSION_DURATION=300000      # 5 minutes in milliseconds
EXPANSION_START_SIZE=180       # Starting screen size in pixels
EXPANSION_END_SIZE=400         # Maximum screen size in pixels
```

### 4. Verify Installation

Check if everything is installed correctly:

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# List installed dependencies
npm list --depth=0
```

## Running the Application

### Development Mode

Run both frontend and backend simultaneously:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend development server on `http://localhost:3000`

### Run Backend Only

```bash
npm run dev:backend
```

### Run Frontend Only

```bash
npm run dev:frontend
```

### Production Mode

Build the frontend:

```bash
npm run build:frontend
```

Start the production server:

```bash
npm start
```

## Moodle Integration Setup (Optional)

If you want to integrate with an actual Moodle instance:

### 1. Enable Web Services in Moodle

1. Log in to Moodle as an administrator
2. Navigate to: **Site administration → Plugins → Web services → Manage protocols**
3. Enable the **REST protocol**

### 2. Create a Web Service

1. Go to: **Site administration → Plugins → Web services → External services**
2. Click **Add**
3. Name: "ALT42 Integration"
4. Enable the service

### 3. Add Required Functions

Add these functions to your web service:
- `mod_quiz_get_quiz_questions`
- `core_question_get_question_data`
- `mod_quiz_process_attempt`
- `mod_quiz_get_user_attempts`
- `core_webservice_get_site_info`

### 4. Create a Web Service Token

1. Go to: **Site administration → Plugins → Web services → Manage tokens**
2. Click **Add**
3. Select a user (usually the administrator)
4. Select the service you created
5. Click **Save changes**
6. Copy the generated token

### 5. Update .env File

Add the Moodle URL and token to your `.env` file:

```env
MOODLE_URL=https://your-moodle-instance.com
MOODLE_TOKEN=your_generated_token_here
```

### 6. Test Connection

```bash
curl http://localhost:3001/api/moodle/test
```

You should see a response indicating successful connection.

## Using Mock Data (No Moodle Required)

If you don't have a Moodle instance, the application will automatically use mock data:

1. Leave `MOODLE_URL` and `MOODLE_TOKEN` empty in `.env`
2. Start the application
3. The backend will automatically provide sample questions

Mock data includes:
- 5 sample math questions (fractions)
- Automatic answer evaluation
- Progress tracking

## Troubleshooting

### Port Already in Use

If port 3001 or 3000 is already in use:

1. **Change backend port**: Edit `PORT` in `.env`
2. **Change frontend port**:
   - Create `src/frontend/.env`
   - Add `PORT=3002` (or any available port)

### Dependencies Installation Fails

Try clearing npm cache:

```bash
npm cache clean --force
npm run install:all
```

### Cannot Connect to Moodle

1. Check if Moodle URL is correct and accessible
2. Verify web services are enabled in Moodle
3. Check if token has proper permissions
4. Test manually:
   ```bash
   curl "https://your-moodle.com/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
   ```

### CORS Errors

If you see CORS errors in the browser console:

1. Ensure backend is running on port 3001
2. Check `proxy` setting in `src/frontend/package.json`
3. Verify CORS is enabled in backend (it should be by default)

### Frontend Not Loading

1. Clear browser cache
2. Check browser console for errors
3. Verify backend is running: `http://localhost:3001/api/health`

## Verifying Installation

### 1. Check Backend Health

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T...",
  "uptime": 123.456
}
```

### 2. Check Expansion Config

```bash
curl http://localhost:3001/api/expansion/config
```

Expected response:
```json
{
  "success": true,
  "data": {
    "duration": 300000,
    "startSize": 180,
    "endSize": 400,
    ...
  }
}
```

### 3. Check Questions (Mock Data)

```bash
curl http://localhost:3001/api/moodle/questions/1
```

Expected response:
```json
{
  "success": true,
  "data": {
    "questions": [...]
  }
}
```

### 4. Access Frontend

Open `http://localhost:3000` in your browser. You should see:
- Control panel on the left
- Status bar at the top
- Smartphone screen on the bottom right

## Next Steps

After successful installation:

1. Read the [README.md](../README.md) for usage instructions
2. Check [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system
3. Try different expansion modes
4. Integrate with your Moodle instance (optional)

## Uninstallation

To remove the application:

```bash
# Remove dependencies
rm -rf node_modules
rm -rf src/frontend/node_modules

# Remove build files
rm -rf src/frontend/build

# Remove the project directory
cd ..
rm -rf alt42standalone_v1.0
```

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the error messages in the console
3. Check backend logs
4. Create an issue on GitHub

## System Requirements

### Minimum Requirements
- CPU: Dual-core 2.0 GHz
- RAM: 2 GB
- Disk Space: 500 MB
- Browser: Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Recommended Requirements
- CPU: Quad-core 2.5 GHz or higher
- RAM: 4 GB or more
- Disk Space: 1 GB
- Browser: Latest version of Chrome, Firefox, Safari, or Edge

---

Installation guide last updated: 2025-11-18

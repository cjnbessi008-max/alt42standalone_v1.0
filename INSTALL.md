# Installation Guide

## Prerequisites

- **Node.js** 18+ and npm
- **Moodle** 3.7+ instance with Web Services enabled
- **Moodle Web Service Token** (see below for how to get one)

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd alt42standalone_v1.0

# Make scripts executable
chmod +x setup.sh start.sh

# Run setup
./setup.sh
```

### 2. Configure Moodle Connection

Edit `backend/.env`:

```env
PORT=3001
NODE_ENV=development

# Your Moodle instance URL
MOODLE_URL=https://your-moodle-instance.com

# Your Moodle Web Service token
MOODLE_TOKEN=your_token_here

CORS_ORIGIN=http://localhost:3000
API_PREFIX=/api
```

### 3. Start the Application

```bash
./start.sh
```

The application will open at `http://localhost:3000`

## Getting a Moodle Web Service Token

### Enable Web Services in Moodle

1. Login to Moodle as administrator
2. Go to **Site administration** → **Advanced features**
3. Enable **Enable web services**
4. Enable **Enable REST protocol**

### Create a Web Service

1. Go to **Site administration** → **Server** → **Web services** → **External services**
2. Click **Add** to create a new service
3. Name it "Correlation Heat API"
4. Check **Enabled**
5. Click **Add functions** and add these functions:
   - `mod_quiz_get_quizzes_by_courses`
   - `mod_quiz_get_user_attempts`
   - `mod_quiz_get_attempt_data`
   - `core_user_get_users_by_field`
   - `core_enrol_get_enrolled_users`

### Generate a Token

1. Go to **Site administration** → **Server** → **Web services** → **Manage tokens**
2. Click **Add**
3. Select a user (preferably with teacher or manager role)
4. Select the service you created ("Correlation Heat API")
5. Click **Save changes**
6. Copy the generated token

### Allow User to Use Web Service

1. Go to **Site administration** → **Users** → **Permissions** → **Define roles**
2. Find the user's role and edit it
3. Under **Web services**, allow:
   - `webservice/rest:use`
   - `webservice/xmlrpc:use` (if using XML-RPC)

## Manual Installation

If you prefer to install manually:

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Moodle credentials
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed (default should work)
npm start
```

## Docker Installation

```bash
# Create .env files first
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env with your Moodle credentials

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Troubleshooting

### Backend Won't Start

**Error: "MOODLE_URL and MOODLE_TOKEN must be set"**
- Make sure you've created `backend/.env` and filled in your Moodle URL and token

**Error: "Failed to fetch quizzes from Moodle"**
- Check your Moodle URL is correct
- Verify your token is valid
- Ensure Web Services are enabled in Moodle
- Check if the required web service functions are added to your service

### Frontend Won't Connect to Backend

**Error: "Network Error" or "CORS error"**
- Make sure backend is running on port 3001
- Check `frontend/.env` has `REACT_APP_API_URL=http://localhost:3001`
- Verify CORS_ORIGIN in `backend/.env` matches frontend URL

### No Quizzes Showing Up

- Make sure the user associated with the token has access to courses with quizzes
- Verify the user has appropriate permissions
- Check backend console logs for errors

### Correlation Data Not Loading

- Ensure the quiz has finished attempts (state = 'finished')
- Check that students have attempted multiple questions
- Minimum 2 students needed for correlation calculation

## Development

### Backend Development

```bash
cd backend
npm run dev  # Starts with hot-reload
npm run build  # Build TypeScript
npm start  # Run production build
npm test  # Run tests
```

### Frontend Development

```bash
cd frontend
npm start  # Starts dev server with hot-reload
npm run build  # Build for production
npm test  # Run tests
```

## Production Deployment

### Build for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Environment Variables for Production

Update `backend/.env`:
```env
NODE_ENV=production
PORT=3001
MOODLE_URL=https://your-production-moodle.com
MOODLE_TOKEN=your_production_token
CORS_ORIGIN=https://your-frontend-domain.com
```

### Using Docker in Production

```bash
# Build images
docker-compose build

# Start in production mode
docker-compose up -d

# Scale if needed
docker-compose up -d --scale backend=3
```

## Next Steps

After installation:

1. Select a quiz from the dropdown
2. The system will:
   - Fetch all quiz attempts
   - Calculate correlations between questions
   - Display the correlation heatmap in the smartphone simulator

The heatmap shows:
- **Red (hot)**: Strong positive correlation
- **Blue (cold)**: Strong negative correlation
- **White**: No correlation

## Support

For issues and questions:
- Check the troubleshooting section above
- Review backend logs: `cd backend && npm run dev`
- Review frontend console in browser DevTools
- Open a GitHub issue with details

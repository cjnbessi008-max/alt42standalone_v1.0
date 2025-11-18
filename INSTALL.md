# Installation Guide

## Prerequisites

Before installing the Concept Tree Moodle App, ensure you have:

- **Node.js** >= 12.0.0
- **MySQL** 5.7
- **Moodle** 3.7 with PHP 7.1.9
- **Git**

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your settings:
   ```
   MOODLE_URL=https://your-moodle-site.com
   MOODLE_TOKEN=your_moodle_webservice_token
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=concept_tree_db
   DB_PORT=3306
   PORT=3000
   ```

## Step 4: Set Up MySQL Database

1. Log in to MySQL:
   ```bash
   mysql -u root -p
   ```

2. Run the schema file:
   ```sql
   source database/schema.sql;
   ```

   Or from command line:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

3. Verify tables were created:
   ```sql
   USE concept_tree_db;
   SHOW TABLES;
   ```

   You should see:
   - concepts
   - concept_relationships
   - moodle_problems
   - problem_concepts
   - user_interactions

## Step 5: Configure Moodle Web Services

### Enable Web Services in Moodle

1. Log in to Moodle as administrator
2. Navigate to: **Site administration > Advanced features**
3. Check "Enable web services"
4. Click "Save changes"

### Create Web Service Token

1. Go to: **Site administration > Plugins > Web services > Manage tokens**
2. Click "Add"
3. Select a user
4. Select service (or create custom service)
5. Copy the generated token
6. Add token to your `.env` file

### Enable Required Functions

Go to: **Site administration > Plugins > Web services > External services**

Enable these functions:
- `core_webservice_get_site_info`
- `core_course_get_contents`
- `core_enrol_get_users_courses`
- `mod_quiz_get_quizzes_by_courses`
- `mod_quiz_get_user_attempts`

## Step 6: Start the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## Step 7: Verify Installation

1. Open your browser and navigate to `http://localhost:3000`
2. You should see the Concept Tree app interface
3. Try loading a demo problem
4. Click on numbers to see concept trees

## Troubleshooting

### MySQL Connection Errors

**Error:** `ER_NOT_SUPPORTED_AUTH_MODE`

**Solution:** Update MySQL user authentication:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### Moodle Connection Errors

**Error:** `Moodle API call failed`

**Solution:**
1. Verify your Moodle URL is correct
2. Check that web services are enabled
3. Verify the token is valid and has correct permissions
4. Check firewall settings

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:** Change the port in `.env`:
```
PORT=3001
```

### Database Character Set Issues

**Error:** Character encoding problems

**Solution:** Ensure MySQL uses utf8mb4:
```sql
ALTER DATABASE concept_tree_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Testing

### Test API Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Get concepts for number 2
curl http://localhost:3000/api/concepts/2

# Get all concepts
curl http://localhost:3000/api/concepts

# Get problem
curl http://localhost:3000/api/problems/1
```

### Test Moodle Connection

Open browser console on the app page and check for:
```
Moodle connection: ✓
```

## Next Steps

1. **Add Custom Concepts**: Insert your own concept data into the database
2. **Configure Moodle Integration**: Set up proper course and quiz connections
3. **Customize UI**: Modify CSS files in `public/css/`
4. **Add Authentication**: Implement user authentication if needed

## Production Deployment

### Using PM2 (Recommended)

```bash
npm install -g pm2
pm2 start server.js --name concept-tree-app
pm2 save
pm2 startup
```

### Using Docker (Optional)

```bash
# Build image
docker build -t concept-tree-app .

# Run container
docker run -d -p 3000:3000 --env-file .env concept-tree-app
```

## Support

For issues and questions:
- Check the main README.md
- Review error logs
- Check MySQL and Node.js logs

## Security Notes

- Never commit `.env` file to version control
- Use strong MySQL passwords
- Keep Moodle tokens secure
- Enable HTTPS in production
- Implement rate limiting for production use

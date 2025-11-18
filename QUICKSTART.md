# Quick Start Guide

Get the Concept Tree Moodle App running in 5 minutes!

## Prerequisites Check

```bash
node --version  # Should be >= 12.0.0
mysql --version # Should be 5.7
```

## Quick Setup (For Testing)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database
```bash
# Login to MySQL
mysql -u root -p

# Run schema
source database/schema.sql;
exit;
```

### 3. Configure Environment
```bash
# Copy example config
cp .env.example .env

# Edit .env - minimum required:
DB_PASSWORD=your_mysql_password
```

### 4. Start Server
```bash
npm start
```

### 5. Open Browser
```
http://localhost:3000
```

## Demo Mode (Without Moodle)

The app comes with pre-loaded sample data, so you can test it immediately without configuring Moodle!

### Try These Features:

1. **Load a Demo Problem**
   - Select "문제 1: 2 + 4는?" from dropdown
   - Click "문제 불러오기"

2. **View Concept Tree**
   - Look at the virtual smartphone (bottom-right corner)
   - Click on the number "2" or "4"
   - Watch the concept tree animation!

3. **Try Direct Number Input**
   - Enter any number (1-10) in the input field
   - Click "개념 트리 보기"

## Sample Numbers to Try

Numbers with rich concept data:
- **2**: Even numbers, prime numbers
- **4**: Even, perfect squares, composite
- **6**: Even, composite, perfect numbers
- **7**: Odd, prime numbers

## What You Should See

### Main Interface
- Purple gradient background
- Control panel with problem selector
- Instructions panel

### Virtual Smartphone (Bottom-Right)
- Black phone frame with notch
- White screen showing problem
- Clickable number badges
- Navigation buttons at bottom

### Concept Tree (After Clicking Number)
- Black overlay with tree visualization
- Root node (your clicked number) in pink
- Branching concept nodes in blue/purple
- Animated connecting lines
- Close button (X) in top-right

## Troubleshooting Quick Fixes

### Can't Connect to Database?
```bash
# Check MySQL is running
sudo systemctl status mysql

# Or on Mac:
brew services list | grep mysql
```

### Port 3000 Already in Use?
```bash
# Change port in .env
echo "PORT=3001" >> .env
```

### No Concept Data Showing?
```bash
# Verify sample data was inserted
mysql -u root -p
USE concept_tree_db;
SELECT COUNT(*) FROM concepts;
# Should show 20 rows
exit;
```

## Next Steps

Once basic demo works:

1. **Configure Moodle Integration**
   - See INSTALL.md for detailed Moodle setup
   - Add your Moodle URL and token to .env

2. **Add Your Own Data**
   ```sql
   -- Add custom concepts
   INSERT INTO concepts (number, concept_name, description, level)
   VALUES (42, 'The Answer', 'Life, universe, everything', 1);
   ```

3. **Customize the UI**
   - Edit files in `public/css/`
   - Change colors, animations, layout

4. **Deploy to Production**
   - See INSTALL.md deployment section
   - Use PM2 or Docker

## Common Questions

**Q: Do I need Moodle to test the app?**
A: No! The app has sample data and works in demo mode.

**Q: Can I change the smartphone position?**
A: Yes! Edit `.smartphone-container` in `public/css/smartphone.css`

**Q: How do I add more concepts?**
A: Insert into the `concepts` table in MySQL. See database/schema.sql for examples.

**Q: Can I use a different database?**
A: Currently only MySQL 5.7 is supported. PostgreSQL support could be added.

## Performance Tips

- **Clear browser cache** if CSS changes don't appear
- **Restart server** after changing .env
- **Check console** (F12) for detailed logs
- **Use Chrome DevTools** for debugging

## Demo Video Script

Follow these steps for a great demo:

1. Open app in browser
2. Point out the virtual smartphone UI
3. Select "문제 2: 7은 소수인가?"
4. Click "문제 불러오기"
5. Click number "7" in smartphone
6. Show the concept tree animation
7. Click different nodes to see info
8. Try number input: Enter "6"
9. Show perfect number concept
10. Close with X button

## Getting Help

- Check README.md for full documentation
- Review ARCHITECTURE.md for system design
- Read INSTALL.md for detailed setup
- Check MySQL and Node.js logs for errors

## Development Mode

For development with auto-reload:

```bash
npm run dev
```

Now any file changes will automatically restart the server!

## Test API Directly

```bash
# Test health
curl http://localhost:3000/health

# Get concepts for number 5
curl http://localhost:3000/api/concepts/5

# Pretty print with jq
curl -s http://localhost:3000/api/concepts/5 | jq
```

## Success Checklist

- [ ] Server starts without errors
- [ ] Can access http://localhost:3000
- [ ] Can see virtual smartphone
- [ ] Can load demo problem
- [ ] Can click number and see tree
- [ ] Tree animates smoothly
- [ ] Can close tree with X button
- [ ] Can input custom number
- [ ] Console shows no errors

If all checked - you're ready to go! 🎉

## What's Next?

Now that your app is running:

1. Explore the codebase
2. Add your own mathematical concepts
3. Integrate with your Moodle instance
4. Customize the design
5. Deploy to production

Happy coding! 🌳

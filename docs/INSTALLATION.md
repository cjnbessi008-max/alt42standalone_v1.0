# 3D Insight Mode - Installation Guide

## Overview

3D Insight Mode is a Moodle block plugin that provides interactive 3D geometry visualization for educational purposes. It displays problems in a virtual smartphone interface with full rotation and touch controls.

## Requirements

### Server Requirements
- **Moodle**: 3.7 or higher
- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher
- **Apache/Nginx**: Standard web server
- **Node.js**: 14.x or higher (for building frontend assets)
- **npm**: 6.x or higher

### Browser Requirements
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with WebGL support

## Installation Steps

### 1. Install the Moodle Plugin

#### Option A: Manual Installation

1. Download or clone the plugin files:
   ```bash
   cd /path/to/moodle/blocks/
   git clone <repository-url> 3dinsight
   ```

2. Copy the plugin directory to your Moodle blocks directory:
   ```bash
   cp -r moodle-plugin/block_3dinsight /path/to/moodle/blocks/3dinsight
   ```

3. Set proper permissions:
   ```bash
   cd /path/to/moodle/blocks/3dinsight
   chmod -R 755 .
   chown -R www-data:www-data .
   ```

#### Option B: Install via Moodle UI

1. Log in to Moodle as administrator
2. Navigate to: **Site administration** → **Plugins** → **Install plugins**
3. Upload the plugin ZIP file
4. Follow the installation wizard

### 2. Install Database Tables

1. Log in to Moodle as administrator
2. Navigate to: **Site administration** → **Notifications**
3. Click "Upgrade Moodle database now"
4. The following tables will be created:
   - `mdl_block_3dinsight_problems`
   - `mdl_block_3dinsight_attempts`
   - `mdl_block_3dinsight_config`

### 3. Build Frontend Assets

1. Navigate to the webapp directory:
   ```bash
   cd webapp/
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the production bundle:
   ```bash
   npm run build
   ```

4. Copy the built files to the Moodle plugin directory:
   ```bash
   mkdir -p /path/to/moodle/blocks/3dinsight/webapp/dist
   cp -r dist/* /path/to/moodle/blocks/3dinsight/webapp/dist/
   ```

### 4. Configure Plugin

1. Navigate to: **Site administration** → **Plugins** → **Blocks** → **3D Insight Mode**
2. Configure default settings:
   - Enable rotation: Yes/No
   - Default view angle: isometric/front/top/side
   - Smartphone display mode: Yes/No

### 5. Add Block to Course

1. Navigate to a course
2. Turn editing on
3. Click "Add a block"
4. Select "3D Insight Mode"
5. The block will appear with the virtual smartphone interface

## Directory Structure

```
/path/to/moodle/blocks/3dinsight/
├── block_3dinsight.php      # Main block class
├── version.php               # Plugin version info
├── lib.php                   # Library functions
├── api.php                   # API endpoint
├── lang/
│   └── en/
│       └── block_3dinsight.php  # English language strings
├── db/
│   ├── install.xml          # Database schema
│   └── access.php           # Capabilities
├── classes/                 # PHP classes (if any)
└── webapp/
    ├── dist/
    │   ├── bundle.js        # Compiled JavaScript
    │   └── styles.css       # Compiled CSS
    └── ...
```

## Verification

### Test the Installation

1. Add the block to a test course
2. Check that the smartphone interface appears in the bottom-right corner
3. Add a test problem using the management interface
4. Verify that you can:
   - Select problems from the dropdown
   - Rotate 3D models with mouse/touch
   - Zoom in/out
   - Drag the smartphone to reposition it

### Check Logs

If you encounter issues, check:
- Moodle error logs: `/path/to/moodledata/error_log`
- PHP error logs: `/var/log/apache2/error.log` or `/var/log/nginx/error.log`
- Browser console for JavaScript errors

## Troubleshooting

### Plugin Not Showing Up

**Problem**: Block doesn't appear in "Add a block" menu

**Solution**:
1. Clear Moodle cache: **Site administration** → **Development** → **Purge all caches**
2. Check file permissions
3. Verify database tables were created

### 3D Models Not Displaying

**Problem**: Smartphone appears but 3D models don't render

**Solution**:
1. Check browser console for errors
2. Verify `bundle.js` and `styles.css` are accessible
3. Test in a different browser
4. Check WebGL support: https://get.webgl.org/

### API Errors

**Problem**: "Failed to load problems" error message

**Solution**:
1. Check `api.php` file permissions
2. Verify database connection
3. Check user capabilities
4. Review PHP error logs

### Build Errors

**Problem**: `npm run build` fails

**Solution**:
1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Check Node.js version: `node --version`
3. Update npm: `npm install -g npm@latest`

## Updating the Plugin

1. Backup your Moodle installation and database
2. Download the new version
3. Replace plugin files
4. Navigate to: **Site administration** → **Notifications**
5. Follow upgrade instructions
6. Rebuild frontend assets: `npm run build`
7. Clear Moodle cache

## Uninstallation

1. Navigate to: **Site administration** → **Plugins** → **Plugins overview**
2. Find "3D Insight Mode" in the block plugins list
3. Click "Uninstall"
4. Confirm the uninstallation
5. Database tables will be dropped automatically
6. Manually remove the plugin directory if needed:
   ```bash
   rm -rf /path/to/moodle/blocks/3dinsight
   ```

## Security Considerations

- Ensure proper capability checks are in place
- Validate all user inputs
- Keep Moodle and PHP updated
- Use HTTPS in production
- Regularly update npm dependencies for security patches:
  ```bash
  npm audit
  npm audit fix
  ```

## Performance Optimization

### For Large Deployments

1. **Enable caching**:
   - Configure Redis/Memcached for Moodle
   - Enable browser caching for static assets

2. **Optimize 3D models**:
   - Keep polygon counts reasonable (< 10,000 faces)
   - Use appropriate detail levels

3. **CDN integration**:
   - Serve Three.js from CDN
   - Cache built assets on CDN

4. **Database optimization**:
   - Add indexes for frequently queried fields
   - Regularly clean up old attempt data

## Support

For issues and support:
- Check the documentation in `/docs/`
- Review Moodle logs
- Contact your system administrator

## Next Steps

- Read [CONFIGURATION.md](CONFIGURATION.md) for detailed configuration options
- Read [USAGE.md](USAGE.md) for user guide and best practices
- Read [DEVELOPER.md](DEVELOPER.md) for development and customization

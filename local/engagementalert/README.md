# Engagement Alert System (LMS 학습 참여도 자동 감지 및 알림)

A Moodle 3.7 plugin that automatically detects and alerts when students show signs of decreased engagement or attention drift (DMN - Default Mode Network drift).

## Features

### 🎯 Real-time Engagement Tracking
- Monitors mouse movements, keyboard activity, scrolling, and page focus
- Detects periods of inactivity or distraction
- Calculates engagement scores in real-time

### 🔔 Intelligent Alert System
- **Student Alerts**: Gentle on-screen notifications to help students refocus
- **Teacher Alerts**: Real-time notifications when students lose engagement
- Configurable alert thresholds and cooldown periods
- Severity-based alert system (1-5 levels)

### 📊 Comprehensive Reporting
- Course-wide engagement statistics
- Individual student engagement history
- Session-based tracking with engagement scores
- Exportable reports for analysis

### ⚙️ Flexible Configuration
- Adjustable inactivity thresholds
- Customizable tracking intervals
- Toggle student/teacher alerts independently
- Alert cooldown settings to prevent notification fatigue

## Requirements

- **Moodle**: 3.7 or higher
- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge - last 2 versions)

## Installation

### Method 1: Manual Installation

1. **Download the plugin**
   ```bash
   cd /path/to/moodle/local/
   git clone [repository-url] engagementalert
   ```

2. **Set proper permissions**
   ```bash
   cd engagementalert
   chmod -R 755 .
   chown -R www-data:www-data .
   ```

3. **Install via Moodle admin interface**
   - Log in as admin
   - Navigate to: Site administration → Notifications
   - Click "Upgrade Moodle database now"
   - The plugin will create necessary database tables

### Method 2: Upload via Moodle

1. Download the plugin as a ZIP file
2. Log in as Moodle admin
3. Navigate to: Site administration → Plugins → Install plugins
4. Upload the ZIP file
5. Follow the installation wizard

## Configuration

### Admin Settings

Navigate to: **Site administration → Plugins → Local plugins → Engagement Alert System**

Available settings:

| Setting | Default | Description |
|---------|---------|-------------|
| **Inactivity Threshold** | 120 seconds | Time of no activity before considering user inactive |
| **Unfocus Threshold** | 60 seconds | Time of unfocused state (tab switch, window blur) before alert |
| **Enable Student Alerts** | Yes | Show pop-up alerts to students when drift is detected |
| **Enable Teacher Alerts** | Yes | Send notifications to teachers when student drift is detected |
| **Tracking Interval** | 30 seconds | How often to send tracking data to server |
| **Alert Cooldown** | 300 seconds | Minimum time between alerts for same user |

### Recommended Settings by Use Case

**Elementary/Middle School (High Supervision)**
- Inactivity Threshold: 90 seconds
- Enable Student Alerts: Yes
- Enable Teacher Alerts: Yes
- Alert Cooldown: 180 seconds

**High School/University (Moderate Supervision)**
- Inactivity Threshold: 120 seconds
- Enable Student Alerts: Yes
- Enable Teacher Alerts: No (or only for critical alerts)
- Alert Cooldown: 300 seconds

**Self-paced Learning (Low Supervision)**
- Inactivity Threshold: 180 seconds
- Enable Student Alerts: Yes
- Enable Teacher Alerts: No
- Alert Cooldown: 600 seconds

## Usage

### For Students

The plugin works automatically in the background:

1. When you access any course material, tracking starts automatically
2. If you become inactive or lose focus for too long, you may see a gentle reminder
3. Click "OK" to dismiss the alert and continue learning
4. Your engagement data helps teachers understand class participation

**Privacy Note**: Only engagement patterns are tracked (mouse/keyboard activity, focus state). No keystrokes or screen content is recorded.

### For Teachers

**View Engagement Reports:**

1. Navigate to your course
2. Go to: Course Administration → Reports → Engagement Report
3. View:
   - List of all students with engagement metrics
   - Total sessions, alerts, and engagement scores
   - Last activity timestamps
   - Export data for further analysis

**Receive Alerts:**

1. Enable teacher alerts in plugin settings (admin)
2. When a student shows signs of disengagement, you'll receive:
   - Pop-up notification (if online)
   - Email notification (if configured)
3. Message includes: student name, course, and alert type

**Understanding Metrics:**

- **Engagement Score (0-100)**:
  - 80-100: Excellent engagement
  - 60-79: Good engagement
  - 40-59: Moderate engagement (some drift)
  - 0-39: Low engagement (frequent drift)

- **Alert Types**:
  - **Inactive**: No mouse/keyboard activity
  - **Unfocused**: Tab switch or window blur
  - **Slow Progress**: Taking unusually long on activities

### For Administrators

**Monitor System Health:**

1. Check database tables:
   ```sql
   SELECT COUNT(*) FROM mdl_local_engagement_events;
   SELECT COUNT(*) FROM mdl_local_engagement_alerts;
   ```

2. Review plugin logs: Site administration → Reports → Logs
   - Filter by component: local_engagementalert

3. Adjust settings based on usage patterns

**Performance Tuning:**

- If server load is high, increase tracking interval (30s → 60s)
- Reduce data retention by archiving old events (>90 days)
- Consider adding database indexes for large installations

## Database Schema

### Tables Created

1. **mdl_local_engagement_events**: Individual tracking events (mouse, keyboard, focus, etc.)
2. **mdl_local_engagement_alerts**: Detected drift incidents
3. **mdl_local_engagement_sessions**: Aggregated session summaries

### Storage Requirements

- ~500 bytes per event
- ~1KB per alert
- For 100 students × 5 hours/week: ~50MB/year

## Troubleshooting

### Tracking Not Working

**Check:**
1. JavaScript is enabled in browser
2. User has `local/engagementalert:view` capability
3. Browser console for errors (F12 → Console tab)
4. Moodle cron is running (for database cleanup)

**Fix:**
```bash
# Clear Moodle cache
php admin/cli/purge_caches.php

# Check JavaScript compilation
php admin/cli/build_theme.php
```

### Alerts Not Triggering

**Check:**
1. Thresholds are not too high (test with 30s inactivity)
2. Alert cooldown hasn't expired
3. Capabilities are set correctly
4. Message outputs are enabled: Site admin → Messaging → Message outputs

**Debug:**
```php
// Add to config.php temporarily
$CFG->debug = DEBUG_DEVELOPER;
$CFG->debugdisplay = 1;
```

### High Database Load

**Solutions:**
1. Increase tracking interval (30s → 60s or 120s)
2. Archive old events:
   ```sql
   DELETE FROM mdl_local_engagement_events
   WHERE timestamp < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 90 DAY));
   ```
3. Add database indexes (already included in install.xml)

### Teacher Not Receiving Alerts

**Check:**
1. Teacher has `local/engagementalert:receivealerts` capability
2. Message provider is enabled:
   - Site admin → Messaging → Notification settings
   - Find "Engagement Alert"
   - Enable desired outputs (popup, email)
3. Teacher's message preferences allow notifications

## Privacy & GDPR Compliance

### Data Collected
- User ID (linked to Moodle user)
- Course/module being accessed
- Event types (mouse, keyboard, focus, scroll) - timestamps only
- Session metadata (start time, end time, event counts)

### Data NOT Collected
- ❌ Keystroke content
- ❌ Mouse coordinates
- ❌ Screen captures
- ❌ Browsing history outside Moodle

### Privacy API Implementation

The plugin implements Moodle's Privacy API:
- Data export for subject access requests
- Data deletion on user deletion
- Privacy policy metadata included

### Retention Policy

Configure automatic data deletion in Moodle:
```php
// Add to scheduled task or cron
$days = 90; // Keep 90 days
$cutoff = time() - ($days * 24 * 60 * 60);
$DB->delete_records_select('local_engagement_events', 'timestamp < ?', [$cutoff]);
```

## API Reference

### JavaScript API

```javascript
// Initialize tracker manually
require(['local_engagementalert/tracker'], function(Tracker) {
    var config = {
        courseId: 123,
        cmId: 456,
        inactiveThreshold: 120,
        unfocusThreshold: 60,
        trackingInterval: 30,
        alertCooldown: 300,
        enableStudentAlerts: true
    };
    var tracker = Tracker.init(config);
});
```

### PHP API

```php
// Log custom events
$tracker = new \local_engagementalert\engagement_tracker();
$tracker->log_events($userid, $courseid, $cmid, $events);

// Create custom alert
$alertmanager = new \local_engagementalert\alert_manager();
$alertmanager->create_alert($userid, $courseid, $cmid, $sessionid, 'custom_alert', 180);

// Get statistics
$stats = $tracker->get_course_statistics($courseid, $starttime, $endtime);
```

## Roadmap

### Planned Features (v1.1)
- [ ] Dashboard widget for quick stats
- [ ] Mobile app support (Moodle Mobile)
- [ ] Advanced analytics with charts
- [ ] Custom alert types and rules
- [ ] Integration with Moodle gradebook

### Future Enhancements (v2.0)
- [ ] Machine learning for personalized thresholds
- [ ] Predictive alerts (prevent drift before it happens)
- [ ] Multi-language support (Korean, English, Spanish, etc.)
- [ ] Accessibility improvements (screen reader optimization)

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Follow Moodle coding standards
4. Add unit tests
5. Submit a pull request

## Support

- **Documentation**: [Link to full docs]
- **Issues**: [GitHub Issues]
- **Forum**: [Moodle.org plugin forum]
- **Email**: [support email]

## License

GNU GPL v3 or later

Copyright (C) 2025 KAIST Touch Math Academy

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

## Credits

Developed by KAIST Touch Math Academy

Special thanks to the Moodle community for their excellent documentation and support.

## Changelog

### Version 1.0.0 (2025-11-18)
- Initial release
- Real-time engagement tracking
- Student and teacher alerts
- Comprehensive reporting
- Moodle 3.7 compatibility

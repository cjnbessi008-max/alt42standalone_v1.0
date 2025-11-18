# Sequence Pearls - Moodle Activity Module

![Sequence Pearls](docs/banner.png)

**Sequence Pearls** is an interactive Moodle activity module that teaches number sequences through beautiful, glowing pearl visualizations displayed in a virtual smartphone interface.

## Features

✨ **Beautiful Visualization**: Each term in a sequence appears as a glowing, colorful pearl
📱 **Virtual Smartphone UI**: Activities are displayed in an elegant smartphone frame with fullscreen support
🎯 **Multiple Sequence Types**:
- Arithmetic sequences
- Geometric sequences
- Fibonacci sequences
- Custom sequences

🎮 **Engaging Interactions**:
- Interactive canvas with animated pearls
- Real-time feedback
- Progress tracking with streaks
- Celebration animations for correct answers

📊 **Progress Tracking**:
- Problems attempted/solved
- Accuracy percentage
- Current and best streak
- Completion percentage

## Requirements

- **Moodle**: 3.4 or higher (tested on 3.7)
- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher
- **Browser**: Modern browsers (Chrome, Firefox, Safari, Edge)

## Installation

### Method 1: Manual Installation

1. Download or clone this repository
2. Copy the `sequencepearls` folder to your Moodle's `mod/` directory:
   ```bash
   cp -r sequencepearls /path/to/moodle/mod/
   ```

3. Visit your Moodle site as an administrator
4. Navigate to **Site Administration → Notifications**
5. Follow the on-screen instructions to complete the installation

### Method 2: Via Moodle Plugin Installer

1. Download the plugin as a ZIP file
2. Log in to your Moodle site as an administrator
3. Navigate to **Site Administration → Plugins → Install plugins**
4. Upload the ZIP file
5. Follow the on-screen instructions

### Post-Installation

After installation, the plugin will automatically create the necessary database tables:
- `mdl_sequencepearls`
- `mdl_sequencepearls_problems`
- `mdl_sequencepearls_attempts`
- `mdl_sequencepearls_progress`

## Usage

### For Teachers

1. **Create a New Activity**:
   - Go to your course
   - Turn editing on
   - Click "Add an activity or resource"
   - Select "Sequence Pearls"

2. **Configure Settings**:
   - **Name**: Give your activity a descriptive name
   - **Introduction**: Add instructions for students
   - **Sequence Type**: Choose arithmetic, geometric, or Fibonacci
   - **Difficulty Level**: Set from 1 (easy) to 5 (hard)
   - **Number of Problems**: How many problems to generate (1-100)

3. **Save**: Click "Save and display" to create the activity

### For Students

1. **Access the Activity**: Click on the Sequence Pearls activity in your course
2. **View the Sequence**: Each number appears as a glowing pearl, with one missing
3. **Find the Missing Number**: Look at the pattern and determine the missing value
4. **Submit Your Answer**: Type your answer and click Submit
5. **Get Feedback**: Receive immediate feedback with animations
6. **Continue**: Move to the next problem and track your progress

## Technical Architecture

### File Structure

```
sequencepearls/
├── amd/
│   └── src/
│       └── pearls.js          # Main JavaScript (AMD module)
├── classes/
│   ├── event/
│   │   ├── answer_submitted.php
│   │   └── course_module_viewed.php
│   └── external.php           # Web services API
├── db/
│   ├── access.php             # Capabilities
│   ├── install.xml            # Database schema
│   └── services.php           # Service declarations
├── lang/
│   └── en/
│       └── sequencepearls.php # English strings
├── pix/                       # Icons
├── templates/                 # Mustache templates
├── index.php                  # Course activity list
├── lib.php                    # Core functions
├── mod_form.php               # Activity settings form
├── styles.css                 # Styles
├── version.php                # Plugin version
└── view.php                   # Main view page
```

### Database Schema

#### Table: `sequencepearls`
Main activity instances table
- id, course, name, intro, sequence_type, difficulty, num_problems
- timecreated, timemodified

#### Table: `sequencepearls_problems`
Generated sequence problems
- id, sequencepearls_id, sequence_data (JSON), missing_position
- correct_answer, rule_formula, timecreated

#### Table: `sequencepearls_attempts`
Student answer attempts
- id, sequencepearls_id, problem_id, userid, user_answer
- is_correct, time_spent, timecreated

#### Table: `sequencepearls_progress`
Student progress tracking
- id, sequencepearls_id, userid, problems_attempted, problems_correct
- best_streak, current_streak, total_time_spent, completion_percentage
- timecreated, timemodified

### API Endpoints

#### `mod_sequencepearls_submit_answer`
Submit an answer to a problem
- **Parameters**: problemid, answer, timespent
- **Returns**: correct (bool), progress (object)

#### `mod_sequencepearls_get_problem`
Get next problem for user
- **Parameters**: activityid
- **Returns**: problemid, sequence (JSON), missing_position

## Customization

### Adding New Sequence Types

Edit `lib.php` and add a new generation function:

```php
function sequencepearls_generate_custom($difficulty) {
    // Your custom sequence logic here
    return array(
        'values' => $values,
        'missing_pos' => $missingPos,
        'answer' => $answer,
        'formula' => $formula
    );
}
```

### Styling

Modify `styles.css` to customize:
- Pearl colors and animations
- Smartphone frame appearance
- Layout and spacing
- Responsive breakpoints

### Translations

Add language files in `lang/[language_code]/sequencepearls.php`:

```php
$string['modulename'] = 'Your translation';
// ... more strings
```

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- High contrast compatible
- Adjustable text sizes

## Performance

- Optimized canvas rendering with requestAnimationFrame
- Efficient database queries with proper indexing
- Cached progress data
- Minimal AJAX calls

## Troubleshooting

### JavaScript not loading
- Clear Moodle cache: **Site Administration → Development → Purge all caches**
- Check browser console for errors

### Database errors
- Verify MySQL 5.7+ is installed
- Check database permissions
- Re-run installation: **Site Administration → Notifications**

### Pearls not displaying
- Verify browser supports HTML5 Canvas
- Check CSS file is loading
- Disable browser extensions that might interfere

## Development

### Building AMD Modules

If you modify JavaScript files:

```bash
cd /path/to/moodle
php admin/cli/grunt.php amd
```

### Testing

Run Moodle's built-in tests:

```bash
php admin/tool/phpunit/cli/util.php --install
vendor/bin/phpunit mod/sequencepearls/tests/
```

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This plugin is licensed under the GNU GPL v3 or later.

See http://www.gnu.org/copyleft/gpl.html for details.

## Credits

**Developed by**: KAIST Touch Math Academy
**Version**: 1.0
**Release Date**: January 2025

## Support

For issues, questions, or feature requests:
- Create an issue on GitHub
- Contact: support@kaist-touchmath.edu

## Changelog

### Version 1.0 (2025-01-18)
- Initial release
- Support for arithmetic, geometric, and Fibonacci sequences
- Virtual smartphone interface
- Canvas-based pearl visualization
- Progress tracking and streaks
- AJAX-based answer submission
- Fullscreen mode
- Moodle 3.7 compatibility

---

Made with ❤️ by KAIST Touch Math Academy

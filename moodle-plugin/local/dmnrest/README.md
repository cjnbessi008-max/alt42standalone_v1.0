# DMN Rest Routines - Moodle Plugin

Moodle plugin that integrates with the DMN Rest Routine API to provide automatic brain break suggestions before and after quiz questions.

## Features

- **Automatic rest routine suggestions** during quiz attempts
- **Configurable trigger strategies** (every problem, complex only, interval-based, fatigue-based)
- **Customizable settings** via Moodle admin interface
- **Support for Korean and English** languages
- **Analytics integration** with DMN API

## Requirements

- Moodle 3.4 or higher (tested with 3.7)
- PHP 7.1 or higher
- Access to DMN Rest Routine API
- CURL extension enabled in PHP

## Installation

### 1. Copy Plugin Files

```bash
# Copy the plugin directory to Moodle
cp -r local/dmnrest /path/to/moodle/local/

# Set correct permissions
cd /path/to/moodle/local/dmnrest
chmod -R 755 .
```

### 2. Complete Installation via Moodle

1. Log in to Moodle as administrator
2. Navigate to **Site Administration > Notifications**
3. Click **Upgrade Moodle database now**
4. The plugin will be installed

### 3. Configure Plugin

1. Go to **Site Administration > Plugins > Local plugins > DMN Rest Routines**
2. Configure the following settings:

   - **Enable DMN rest routines**: Check to enable
   - **API endpoint**: URL of your DMN API (e.g., `http://localhost:3000/api/dmn`)
   - **API key**: Your API authentication key
   - **Trigger strategy**: Choose when to suggest routines
     - **Every problem**: Before each question
     - **Complex only**: Only for complex questions (based on threshold)
     - **Every N problems**: After every 5 questions (configurable)
     - **Fatigue-based**: Intelligent suggestions based on student state (recommended)
   - **Complexity threshold**: Minimum complexity (1-5) for "complex only" strategy
   - **Allow students to skip**: Let students skip rest routines
   - **Minimum rest interval**: Minimum minutes between suggestions (default: 10)

3. Click **Save changes**

## Usage

### For Students

When taking a quiz with the plugin enabled:

1. **Before/after questions**, a modal will appear with a rest routine suggestion
2. **Read the routine** name and description
3. **Click "Start rest routine"** to begin
4. **Follow the step-by-step instructions**
5. **Click "I'm done!"** when finished
6. **Optionally rate** how helpful the routine was (1-5 stars)
7. **Continue** with the quiz

Students can skip routines if allowed by the administrator.

### For Teachers

Teachers can:
- Enable/disable the plugin for specific courses or quizzes
- View analytics on routine usage and effectiveness
- Tag questions with difficulty levels to improve complexity detection

To tag questions with difficulty:
1. Edit a question
2. Add a tag: `difficulty:N` where N is 1-5
3. Save the question

### For Administrators

Monitor plugin usage:
1. Check plugin settings regularly
2. Review Moodle logs for DMN-related events
3. Query the DMN API for analytics

## How It Works

### Event Observers

The plugin hooks into Moodle quiz events:

- `\mod_quiz\event\attempt_started`: Initialize session tracking
- `\mod_quiz\event\question_viewed`: Trigger "before" routine suggestions
- `\mod_quiz\event\question_answered`: Trigger "after" routine suggestions

### Complexity Detection

Question complexity is determined by:
1. **Question type** (multichoice = 2, calculated/essay = 3, etc.)
2. **Difficulty tags** (`difficulty:N` in question tags)
3. **Default**: Level 2 if no other information available

### API Communication

The plugin communicates with the DMN API:
1. **Suggestion request**: Sends student context to API
2. **Receive routine**: API returns appropriate rest routine
3. **Display**: Show routine in modal overlay
4. **Track completion**: Send completion data back to API

### Session Tracking

The plugin tracks (in PHP session):
- Session start time
- Problems attempted
- Problems correct
- Last rest routine time

This data is sent to the API for intelligent recommendations.

## File Structure

```
local/dmnrest/
├── version.php              # Plugin metadata
├── lib.php                  # Core library functions
├── settings.php             # Admin settings definition
├── classes/
│   ├── api_client.php       # DMN API communication
│   └── observer.php         # Event observers
├── db/
│   └── events.php           # Event observer registration
├── lang/
│   ├── en/
│   │   └── local_dmnrest.php # English strings
│   └── ko/
│       └── local_dmnrest.php # Korean strings
├── amd/src/
│   └── routine.js           # JavaScript for routine display
├── ajax/
│   └── complete.php         # AJAX endpoint for completions
├── styles.css               # Modal and UI styles
└── README.md
```

## Customization

### Adding New Trigger Strategies

Edit `settings.php` to add new strategy options:

```php
$strategies = [
    'my_strategy' => get_string('strategy_my_strategy', 'local_dmnrest'),
];
```

Then implement logic in `classes/observer.php` in the `should_suggest_rest()` method.

### Styling

Customize the appearance by editing `styles.css`. The modal uses these main classes:
- `.dmn-routine-modal`: Main modal container
- `.dmn-modal-content`: Content area
- `.dmn-header`: Title section
- `.dmn-routine-info`: Routine details
- `.dmn-steps`: Step-by-step instructions

### Adding Languages

Create a new language directory:
```bash
mkdir lang/es
cp lang/en/local_dmnrest.php lang/es/
# Translate strings in lang/es/local_dmnrest.php
```

## Troubleshooting

### Rest routines not appearing

1. **Check plugin is enabled**: Site Administration > Plugins > DMN Rest Routines
2. **Verify API endpoint**: Ensure URL is correct and accessible from Moodle server
3. **Check API key**: Ensure it matches the backend configuration
4. **Enable debugging**: Site Administration > Development > Debugging (set to DEVELOPER level)
5. **Check browser console**: Look for JavaScript errors
6. **Check Moodle logs**: Site Administration > Reports > Logs

### Testing API connection

Create a test script in your Moodle root:

```php
<?php
require_once('config.php');
require_once($CFG->dirroot . '/local/dmnrest/classes/api_client.php');

$api = new \local_dmnrest\api_client();
$routines = $api->get_routines(true);

var_dump($routines);
```

Visit the script in your browser to test API connectivity.

### Common Issues

**Issue**: "API call failed" error
- **Solution**: Check API endpoint URL, ensure API is running, verify network connectivity

**Issue**: Modal appears but no content
- **Solution**: Check JavaScript console for errors, verify routine data in API response

**Issue**: Routines appear too frequently
- **Solution**: Increase "Minimum rest interval" in settings

**Issue**: No routines for complex problems
- **Solution**: Add difficulty tags to questions, or lower complexity threshold

## Privacy

The plugin:
- Does **NOT** store personal data locally in Moodle
- Sends **anonymized** user IDs to the DMN API
- Tracks only quiz activity, not other student behavior
- Complies with Moodle privacy API

Privacy manifest is included in the plugin.

## Performance

The plugin:
- Makes API calls asynchronously to avoid blocking quiz flow
- Caches routine data when possible
- Has minimal impact on quiz performance (< 100ms per question)

## Support

For issues:
1. Check the troubleshooting section above
2. Review Moodle and API logs
3. Enable debugging in both Moodle and the API
4. Contact system administrator

## License

GPL v3 (compatible with Moodle)

## Credits

- Developed for KAIST Touch Math Academy
- Part of the AI Education System Pipeline project

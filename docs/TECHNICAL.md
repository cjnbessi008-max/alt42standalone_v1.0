# Alternative Solutions - Technical Documentation

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────┐
│                Moodle 3.7 Core                      │
│                 (PHP 7.1.9)                         │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│         mod_altsolutions Plugin                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  UI Layer (PHP/HTML/JavaScript)              │  │
│  ├──────────────────────────────────────────────┤  │
│  │  Business Logic Layer (lib.php)              │  │
│  ├──────────────────────────────────────────────┤  │
│  │  Data Access Layer (Moodle DML)              │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              MySQL 5.7 Database                     │
│  - altsolutions                                     │
│  - altsolutions_steps                               │
│  - altsolutions_attempts                            │
│  - altsolutions_alternatives                        │
│  - altsolutions_reflections                         │
└─────────────────────────────────────────────────────┘
```

## Database Schema

### Entity Relationship Diagram

```
altsolutions (1) ──┬── (N) altsolutions_steps
                   │
                   ├── (N) altsolutions_attempts
                   │        │
                   │        └── (N) altsolutions_alternatives
                   │
                   └── (N) altsolutions_reflections

user (1) ──┬── (N) altsolutions_attempts
           │
           └── (N) altsolutions_reflections
```

### Table Specifications

#### `mdl_altsolutions`
Main activity instance table.

| Column | Type | Description |
|--------|------|-------------|
| id | INT(10) | Primary key |
| course | INT(10) | Foreign key to course |
| name | VARCHAR(255) | Activity name |
| intro | TEXT | Activity description |
| problemtext | TEXT | Main problem statement |
| minsteps | INT(4) | Minimum steps required |
| minalternatives | INT(4) | Minimum alternatives per step |
| timecreated | INT(10) | Creation timestamp |
| timemodified | INT(10) | Last modification timestamp |

#### `mdl_altsolutions_steps`
Problem-solving steps defined by teacher.

| Column | Type | Description |
|--------|------|-------------|
| id | INT(10) | Primary key |
| altsolutionsid | INT(10) | Foreign key to altsolutions |
| stepnumber | INT(4) | Step order (1, 2, 3...) |
| title | VARCHAR(255) | Step title |
| description | TEXT | Step description |
| hinttext | TEXT | Optional hint |
| timecreated | INT(10) | Creation timestamp |

**Indexes:**
- `(altsolutionsid, stepnumber)` - For efficient step retrieval

#### `mdl_altsolutions_attempts`
Student attempts for each step.

| Column | Type | Description |
|--------|------|-------------|
| id | INT(10) | Primary key |
| altsolutionsid | INT(10) | Foreign key to altsolutions |
| userid | INT(10) | Foreign key to user |
| stepid | INT(10) | Foreign key to altsolutions_steps |
| approach | TEXT | Selected approach description |
| solution | TEXT | Student's solution |
| confidence | INT(3) | Confidence level (1-5) |
| timespent | INT(10) | Time spent in seconds |
| timecreated | INT(10) | Creation timestamp |
| timemodified | INT(10) | Last modification timestamp |

**Indexes:**
- `(userid, stepid)` - For efficient user progress lookup

#### `mdl_altsolutions_alternatives`
Alternative approaches explored by students.

| Column | Type | Description |
|--------|------|-------------|
| id | INT(10) | Primary key |
| attemptid | INT(10) | Foreign key to altsolutions_attempts |
| alternativenumber | INT(4) | Alternative order (1, 2, 3...) |
| description | TEXT | Description of approach |
| reasoning | TEXT | Why this approach might work |
| selected | INT(1) | 1 if selected, 0 otherwise |
| timecreated | INT(10) | Creation timestamp |

#### `mdl_altsolutions_reflections`
Student reflections on problem-solving process.

| Column | Type | Description |
|--------|------|-------------|
| id | INT(10) | Primary key |
| altsolutionsid | INT(10) | Foreign key to altsolutions |
| userid | INT(10) | Foreign key to user |
| mosteffective | TEXT | Most effective approach |
| learned | TEXT | What was learned |
| wouldchange | TEXT | What would be changed |
| timecreated | INT(10) | Creation timestamp |

**Indexes:**
- `UNIQUE(userid, altsolutionsid)` - One reflection per user per activity

## File Structure

```
mod/altsolutions/
├── version.php              # Plugin metadata
├── lib.php                  # Core library functions
├── mod_form.php             # Activity settings form
├── view.php                 # Main view page
├── solve.php                # Step solving interface
├── reflection.php           # Reflection page
├── summary.php              # Results summary
├── managesteps.php          # Teacher step management
├── db/
│   ├── install.xml          # Database schema
│   └── access.php           # Capability definitions
├── lang/
│   ├── en/
│   │   └── altsolutions.php # English strings
│   └── ko/
│       └── altsolutions.php # Korean strings
├── classes/
│   └── event/
│       └── course_module_viewed.php
├── templates/               # Mustache templates (future)
├── amd/src/                 # JavaScript modules (future)
└── pix/                     # Icons (future)
```

## API Functions

### Core Functions (lib.php)

#### `altsolutions_add_instance($altsolutions, $mform)`
Creates new activity instance.

**Parameters:**
- `$altsolutions` (stdClass): Form data
- `$mform` (mod_altsolutions_mod_form): Form instance

**Returns:** int - New activity ID

#### `altsolutions_update_instance($altsolutions, $mform)`
Updates existing activity instance.

**Returns:** bool - Success/failure

#### `altsolutions_delete_instance($id)`
Deletes activity and all related data.

**Returns:** bool - Success/failure

#### `altsolutions_get_user_progress($altsolutionsid, $userid)`
Gets user's progress for activity.

**Returns:** stdClass with:
- `totalsteps` (int)
- `completedsteps` (int)
- `percentage` (int)
- `hasreflection` (bool)

#### `altsolutions_get_steps($altsolutionsid)`
Gets all steps for activity.

**Returns:** array of step records

#### `altsolutions_save_step_attempt($data)`
Saves student's step attempt with alternatives.

**Parameters:**
- `$data->altsolutionsid` (int)
- `$data->stepid` (int)
- `$data->approach` (string)
- `$data->solution` (string)
- `$data->confidence` (int 1-5)
- `$data->alternatives` (array)

**Returns:** int - Attempt ID

#### `altsolutions_save_reflection($data)`
Saves student's reflection.

**Returns:** bool - Success/failure

## Data Flow

### Student Workflow

```
1. view.php
   └─> Display activity, check progress
       ├─> If not started: redirect to solve.php?step=1
       ├─> If in progress: redirect to solve.php?step=N
       └─> If completed: redirect to reflection.php or summary.php

2. solve.php?step=N
   └─> Display step N
       ├─> Load existing attempt (if any)
       ├─> Show form with alternatives
       └─> On submit:
           ├─> Validate minimum alternatives
           ├─> Save attempt + alternatives
           └─> Redirect to next step or reflection

3. reflection.php
   └─> Display reflection form
       ├─> Load existing reflection (if any)
       └─> On submit:
           ├─> Save reflection
           └─> Redirect to summary

4. summary.php
   └─> Display all steps, attempts, alternatives, and reflection
```

### Teacher Workflow

```
1. mod_form.php
   └─> Create/edit activity
       ├─> Set problemtext
       ├─> Set minsteps, minalternatives
       └─> Save to altsolutions table

2. managesteps.php
   └─> List all steps
       ├─> Add new step
       ├─> Edit existing step
       └─> Delete step

3. report.php (future)
   └─> View student progress
       ├─> List all students
       ├─> Show completed steps
       └─> View individual submissions
```

## Security Considerations

### Input Validation

All user inputs are validated:
- `required_param()` / `optional_param()` for GET/POST
- Appropriate PARAM_* types (PARAM_INT, PARAM_TEXT, PARAM_RAW)
- HTML is sanitized using Moodle's text formatting

### Access Control

Capabilities checked on every page:
- `mod/altsolutions:view` - View activity
- `mod/altsolutions:submit` - Submit solutions
- `mod/altsolutions:addinstance` - Create/edit activity
- `mod/altsolutions:viewreports` - View student data

### SQL Injection Prevention

- All database queries use Moodle DML
- Prepared statements with placeholders
- No raw SQL concatenation

### XSS Prevention

- All output uses `s()` or `format_text()`
- HTML in user content is filtered
- CSRF protection with `sesskey()`

## Performance Optimization

### Database Queries

- Indexes on foreign keys
- Composite indexes for common queries
- Single query to load all steps

### Caching

- Moodle's built-in caching for capability checks
- Session storage for temporary data
- Future: Cache compiled alternatives

### JavaScript

- Minimal inline JavaScript
- AMD modules for complex interactions (future)
- Time tracking runs client-side

## Testing

### Unit Tests (Future)

```php
// tests/lib_test.php
class mod_altsolutions_lib_testcase extends advanced_testcase {
    public function test_get_user_progress() {
        // Test progress calculation
    }
}
```

### Manual Testing Checklist

- [ ] Create activity as teacher
- [ ] Add steps with various content
- [ ] Submit solutions as student
- [ ] Explore multiple alternatives
- [ ] Complete reflection
- [ ] View summary
- [ ] Edit existing attempt
- [ ] Delete activity

## Browser Compatibility

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Known Limitations

1. **No auto-grading**: Teacher must manually review
2. **No peer review**: Students can't view others' solutions
3. **No group mode**: Individual work only
4. **No offline mode**: Requires internet connection
5. **Basic editor**: No rich math input (LaTeX support future)

## Future Enhancements

### Phase 2
- Auto-grading with AI
- Rich math editor (MathJax/LaTeX)
- Visualization tools
- Export to PDF

### Phase 3
- Group collaboration mode
- Peer review features
- Analytics dashboard
- Mobile app

## Troubleshooting

### Common Issues

**Issue: Steps not appearing**
- Check `altsolutions_steps` table
- Verify `stepnumber` ordering
- Check activity ID matches

**Issue: Can't submit**
- Verify `mod/altsolutions:submit` capability
- Check minimum alternatives requirement
- Check session key

**Issue: Database errors**
- Check MySQL version (5.7+)
- Verify table creation in install.xml
- Check Moodle debug logs

### Debug Mode

Enable in Moodle:
```php
// config.php
$CFG->debug = E_ALL;
$CFG->debugdisplay = 1;
```

## Contributing

Guidelines for developers:

1. Follow Moodle coding standards
2. Add phpdoc comments
3. Use Moodle DML for database
4. Test on PHP 7.1.9 minimum
5. Support MySQL 5.7+

## License

GPL v3 - See LICENSE file

## Credits

Developed by KAIST Touch Math Academy
Based on research in alternative thinking pedagogy

---

**Version:** 1.0
**Last Updated:** 2025-11-18

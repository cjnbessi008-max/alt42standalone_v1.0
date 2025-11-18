# Student Priority Selection Block for Moodle

A Moodle block plugin that allows students to select their most important learning step, helping them focus on what matters most in their educational journey.

## Features

- **Student-Driven Learning**: Students choose their top priority learning step
- **Visual Interface**: Clean, card-based UI with real-time selection feedback
- **Progress Tracking**: Logs all priority selections and changes for analytics
- **Customizable Steps**: Teachers can define custom learning steps per course
- **Teacher Analytics**: View which learning steps students prioritize
- **Fully Responsive**: Works on desktop, tablet, and mobile devices

## Requirements

- Moodle 3.7 or higher
- MySQL 5.7 or higher
- PHP 7.1.9 or higher

## Installation

### Method 1: Manual Installation

1. Download the plugin files
2. Copy the `block_student_priority` folder to your Moodle's `blocks/` directory:
   ```bash
   cp -r block_student_priority /path/to/moodle/blocks/
   ```

3. Log in to your Moodle site as an administrator

4. Navigate to **Site administration → Notifications**

5. Moodle will detect the new plugin and prompt you to install it

6. Click **Upgrade Moodle database now**

7. Complete the installation process

### Method 2: Using Moodle's Plugin Installer

1. Log in to your Moodle site as an administrator

2. Navigate to **Site administration → Plugins → Install plugins**

3. Upload the ZIP file containing the `block_student_priority` folder

4. Follow the on-screen installation instructions

## Configuration

### Adding the Block to a Course

1. Turn editing on in your course

2. Click **Add a block**

3. Select **Student Priority Selection**

4. The block will appear and students can immediately start selecting their priorities

### Block Settings

To configure the block:

1. Click the gear icon on the block

2. Select **Configure Student Priority Selection block**

Available settings:

- **Custom Learning Steps**: Define your own learning steps (one per line)
- **Allow Changes**: Let students change their priority selection
- **Require Reason**: Ask students to explain their choice
- **Show Analytics**: Display selection statistics to teachers

### Example Custom Steps

```
Understanding Fractions
Adding and Subtracting Fractions
Multiplying Fractions
Dividing Fractions
Real-World Applications
```

## Usage

### For Students

1. View the block in your course
2. Review the available learning steps
3. Click on the step that is most important to you right now
4. Your selection is saved automatically
5. You can change your selection at any time (if enabled by teacher)

### For Teachers

**View Student Priorities:**

1. Add the block to your course
2. Configure **Show Analytics** to see student selections
3. Review which learning steps students prioritize most

**Access Detailed Reports:**

Navigate to: **Site administration → Reports → Student Priority Report**

## Database Schema

The plugin creates two tables:

### `mdl_block_student_priority`
Stores current priority selections:
- `id`: Record ID
- `userid`: Student user ID
- `courseid`: Course ID
- `priority_step`: Selected step number
- `step_name`: Name of selected step
- `reason`: Optional reason for selection
- `timecreated`: When first selected
- `timemodified`: When last modified

### `mdl_block_student_priority_log`
Logs all priority changes:
- `id`: Record ID
- `userid`: Student user ID
- `courseid`: Course ID
- `old_priority_step`: Previous selection
- `new_priority_step`: New selection
- `reason`: Reason for change
- `timecreated`: When changed

## Permissions

The plugin defines these capabilities:

- `block/student_priority:addinstance` - Add block to course pages
- `block/student_priority:myaddinstance` - Add block to Dashboard
- `block/student_priority:setpriority` - Select a priority step
- `block/student_priority:viewreports` - View analytics and reports

## Events

The plugin triggers this event:

- `\block_student_priority\event\priority_selected` - When a student selects or changes their priority

## Customization

### Styling

Modify `styles.css` to customize the appearance:
- Card colors and borders
- Animations and transitions
- Responsive breakpoints
- Typography

### Language Strings

Add translations by creating language files in:
```
lang/[language_code]/block_student_priority.php
```

For example, for Korean:
```
lang/ko/block_student_priority.php
```

## Integration with LMS

This plugin integrates seamlessly with:

- **Course Progress Tracking**: Link priorities to completion data
- **Analytics**: Export data for external analysis
- **Reports**: Built-in Moodle reporting
- **Events API**: Trigger actions when priorities change

## Troubleshooting

### Block doesn't appear
- Verify installation completed successfully
- Check that you have permission to add blocks
- Ensure JavaScript is enabled in your browser

### Selections not saving
- Check browser console for JavaScript errors
- Verify database tables were created correctly
- Ensure sesskey is valid (try logging out and back in)

### Analytics not showing
- Verify "Show Analytics" is enabled in block settings
- Check that you have the `viewreports` capability
- Ensure students have made selections

## Support

For issues, questions, or feature requests:

- **Documentation**: [Moodle Docs](https://docs.moodle.org/)
- **Issue Tracker**: Create an issue in your repository
- **Email**: contact@yourorganization.edu

## License

This plugin is licensed under the GNU GPL v3 or later.

Copyright © 2025 KAIST Touch Math Academy

## Credits

Developed for the KAIST Touch Math Academy AI Education System Pipeline project.

## Changelog

### Version 1.0 (2025-01-18)
- Initial release
- Student priority selection interface
- Teacher configuration options
- Analytics and reporting
- Event logging
- Mobile-responsive design

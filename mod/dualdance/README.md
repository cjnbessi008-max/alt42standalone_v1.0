# Dual Dance - Moodle Activity Module

An interactive Moodle activity module that visualizes exponential and logarithmic functions "dancing" together, helping students understand the relationship between these mathematical concepts.

## Features

- 🎨 **Interactive Visualization**: Watch exponential and logarithmic functions animate in real-time
- 📱 **Virtual Smartphone UI**: Optimized mobile-like interface displayed on desktop
- 🎯 **Adaptive Problem Generation**: Automatic generation of math problems with configurable difficulty
- 📊 **Progress Tracking**: Real-time statistics on student performance
- 🌐 **Multilingual**: Supports English and Korean (extensible to other languages)
- ✅ **Instant Feedback**: Immediate validation and scoring of answers
- 📈 **Gradebook Integration**: Seamless integration with Moodle's grading system

## Requirements

- **Moodle**: 3.7 or higher
- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher
- **Browser**: Modern browser with HTML5 Canvas support (Chrome, Firefox, Safari, Edge)

## Installation

### Method 1: Via Moodle Plugin Installer

1. Download the plugin as a ZIP file
2. Log in to Moodle as an administrator
3. Navigate to **Site administration** → **Plugins** → **Install plugins**
4. Upload the ZIP file and follow the installation wizard
5. Click **Upgrade Moodle database now**

### Method 2: Manual Installation

1. Extract the plugin files
2. Copy the `dualdance` folder to your Moodle installation's `mod` directory:
   ```bash
   cp -r dualdance /path/to/moodle/mod/
   ```
3. Log in to Moodle as an administrator
4. Navigate to **Site administration** → **Notifications**
5. Follow the upgrade process

### Method 3: Via Command Line

```bash
# Navigate to Moodle directory
cd /path/to/moodle

# Copy plugin
cp -r /path/to/dualdance mod/

# Run upgrade CLI script
php admin/cli/upgrade.php
```

## Configuration

### Creating a Dual Dance Activity

1. Turn editing on in your course
2. Click **Add an activity or resource**
3. Select **Dual Dance**
4. Configure settings:
   - **Activity name**: Give your activity a descriptive name
   - **Description**: Explain what students will learn
   - **Difficulty level**: Choose from 1 (Very Easy) to 5 (Very Hard)
   - **Exponential base range**: Set min/max values for exponential bases
   - **Logarithm base range**: Set min/max values for logarithm bases
   - **Animation speed**: Control visualization speed (1-5)
   - **Grade**: Set maximum grade (default: 100)

### Recommended Settings by Student Level

#### Middle School (Grades 7-8)
- **Difficulty**: 1-2
- **Exponential base**: 1.5 - 3.0
- **Logarithm base**: 2.0 - 5.0
- **Animation speed**: 2 (Slow)

#### High School (Grades 9-12)
- **Difficulty**: 3-4
- **Exponential base**: 1.5 - 4.0
- **Logarithm base**: 2.0 - 10.0
- **Animation speed**: 3 (Normal)

#### College/Advanced
- **Difficulty**: 4-5
- **Exponential base**: 1.2 - 5.0
- **Logarithm base**: 2.0 - 20.0
- **Animation speed**: 4 (Fast)

## Usage

### For Students

1. **Start a Problem**: Click the "Start Problem" button
2. **Watch the Visualization**: Observe how the functions "dance" on the graph
   - Red curve = Exponential function
   - Blue curve = Logarithmic function
3. **Solve the Problem**: Enter your answer in the input field
4. **Submit**: Click "Submit Answer" to check your work
5. **Review Feedback**: See if you're correct and view your score
6. **Next Problem**: Continue with the next problem to improve your grade

### For Teachers

1. **Monitor Progress**: View student attempts and grades in the gradebook
2. **Adjust Difficulty**: Modify settings if problems are too easy/hard
3. **View Reports**: Access detailed reports on student performance
4. **Export Data**: Export grades and attempt data for analysis

## Problem Types

The module generates three types of problems:

### 1. Exponential Evaluation
Calculate the value of an exponential expression:
```
Calculate: 1.5 × 2^3
```

### 2. Logarithmic Evaluation
Calculate the value of a logarithmic expression:
```
Calculate: 2.0 × log₂(16)
```

### 3. Intersection Point
Find where exponential and logarithmic functions intersect:
```
At what x value do these functions intersect?
f(x) = 1.5 × 2^x
g(x) = 2.0 × log₃(x)
```

## Grading

- **Correct answers**: Base grade of 100%
- **Time penalty**: Up to 20% deduction for very slow responses
- **Minimum score**: 50% for correct answers
- **Incorrect answers**: 0%
- **Final grade**: Average of all attempts

## Technical Details

### Database Tables

- `mdl_dualdance`: Activity instances
- `mdl_dualdance_problems`: Generated math problems
- `mdl_dualdance_attempts`: Student attempt records
- `mdl_dualdance_grades`: Aggregated student grades

### File Structure

```
mod/dualdance/
├── version.php              # Module version and metadata
├── lib.php                  # Core functions and API
├── mod_form.php             # Activity settings form
├── view.php                 # Student view (main interface)
├── index.php                # List of all instances
├── styles.css               # Module styles
├── README.md                # This file
├── db/
│   ├── install.xml          # Database schema
│   ├── access.php           # Capability definitions
│   └── upgrade.php          # Upgrade scripts
├── lang/
│   ├── en/
│   │   └── dualdance.php    # English language strings
│   └── ko/
│       └── dualdance.php    # Korean language strings
├── classes/
│   └── event/
│       ├── course_module_viewed.php
│       └── course_module_instance_list_viewed.php
├── js/
│   └── dualdance.js         # Main JavaScript application
└── pix/
    └── icon.png             # Module icon
```

### Browser Compatibility

| Browser | Minimum Version | Tested |
|---------|----------------|--------|
| Chrome | 80+ | ✅ |
| Firefox | 75+ | ✅ |
| Safari | 13+ | ✅ |
| Edge | 80+ | ✅ |
| Mobile Safari | iOS 13+ | ✅ |
| Chrome Mobile | 80+ | ✅ |

## Accessibility

- **Keyboard navigation**: Full support
- **Screen readers**: ARIA labels on all interactive elements
- **Color contrast**: WCAG 2.1 AA compliant
- **Reduced motion**: Respects `prefers-reduced-motion` setting
- **High contrast mode**: Automatic adaptation

## Troubleshooting

### Canvas Not Displaying
- Ensure browser supports HTML5 Canvas
- Check JavaScript console for errors
- Clear browser cache

### Problems Not Generating
- Verify database tables were created correctly
- Check PHP error logs
- Ensure base ranges are valid (> 1)

### Slow Performance
- Reduce animation speed in settings
- Check server resources
- Optimize MySQL configuration

### Grade Not Updating
- Verify gradebook permissions
- Check cron job is running
- Manually trigger grade calculation

## Development

### Running in Development Mode

```bash
# Enable debugging in Moodle config.php
$CFG->debug = (E_ALL | E_STRICT);
$CFG->debugdisplay = 1;

# Watch for JavaScript changes
cd mod/dualdance/js
# Use your preferred JS build tool
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This plugin is licensed under the GNU GPL v3 or later.

## Credits

- **Developed by**: AI Education System Team
- **Copyright**: 2025
- **Moodle Version**: 3.7+

## Support

For issues, questions, or contributions:
- **Bug Reports**: [Create an issue](#)
- **Feature Requests**: [Submit a request](#)
- **Documentation**: [Wiki](#)

## Changelog

### Version 1.0 (2025-01-18)
- Initial release
- Interactive dual dance visualization
- Virtual smartphone UI
- Problem generation engine
- Multilingual support (EN/KO)
- Gradebook integration
- Real-time feedback system

## Roadmap

### Version 1.1 (Planned)
- [ ] More problem types
- [ ] Custom function parameters
- [ ] Student progress dashboard
- [ ] Teacher analytics panel
- [ ] Export to PDF

### Version 2.0 (Future)
- [ ] 3D visualizations
- [ ] Collaborative problem solving
- [ ] AI-powered difficulty adjustment
- [ ] Mobile native apps
- [ ] Integration with external LMS platforms

---

**Made with ❤️ for mathematics education**

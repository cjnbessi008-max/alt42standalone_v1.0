# Smooth vs Steps - Moodle Activity Module

An interactive Moodle activity module that demonstrates the difference between continuous and discrete probability distributions through animated visualizations displayed in a virtual smartphone interface.

## Features

- **Interactive Animation**: Real-time animated comparison of continuous (smooth curves) and discrete (step bars) probability distributions
- **Smartphone Frame UI**: Modern virtual smartphone display positioned at bottom-right of screen
- **Configurable Options**:
  - Choose between both, continuous only, or discrete only distributions
  - Adjustable animation speed (slow, medium, fast)
- **Educational Visualizations**:
  - Continuous: Normal distribution (Probability Density Function)
  - Discrete: Binomial distribution (Probability Mass Function)
- **Responsive Design**: Adapts to different screen sizes
- **Moodle Integration**: Full LMS integration with activity tracking

## Requirements

- **Moodle**: 3.7 or higher
- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher
- Modern web browser with HTML5 Canvas support

## Installation

### Method 1: Manual Installation

1. Download the plugin folder `smoothsteps`
2. Copy it to your Moodle installation:
   ```bash
   cp -r smoothsteps /path/to/moodle/mod/
   ```
3. Log in to your Moodle site as administrator
4. Navigate to: **Site administration → Notifications**
5. Moodle will detect the new plugin and prompt you to install it
6. Click **Upgrade Moodle database now**
7. Follow the on-screen instructions to complete installation

### Method 2: Via Moodle Plugin Installer

1. Zip the `smoothsteps` folder
2. Log in to Moodle as administrator
3. Navigate to: **Site administration → Plugins → Install plugins**
4. Upload the zip file
5. Click **Install plugin from the ZIP file**
6. Follow the installation prompts

## Usage

### Adding the Activity to a Course

1. Turn editing on in your course
2. Click **Add an activity or resource**
3. Select **Smooth vs Steps** from the activity list
4. Configure the activity:
   - **Activity name**: Enter a descriptive name
   - **Description**: Add context about probability distributions
   - **Distribution type**: Choose what to display
     - Both (Continuous and Discrete)
     - Continuous only
     - Discrete only
   - **Animation speed**: Select slow, medium, or fast
5. Click **Save and display**

### Student View

Students will see:
- A virtual smartphone display in the bottom right corner
- Interactive controls (Play, Pause, Reset)
- Animated probability distributions:
  - **Continuous (Blue)**: Smooth curve representing normal distribution
  - **Discrete (Orange)**: Step bars representing binomial distribution
- Educational explanations for each distribution type

### Controls

- **Play**: Start the animation
- **Pause**: Pause the current animation
- **Reset**: Return to the initial state

## Technical Details

### File Structure

```
mod/smoothsteps/
├── version.php              # Plugin version information
├── lib.php                  # Core Moodle functions
├── mod_form.php            # Activity settings form
├── view.php                # Main view page
├── animation.js            # JavaScript animation logic
├── styles.css              # Smartphone frame and UI styles
├── README.md               # This file
├── db/
│   └── install.xml         # Database schema
├── lang/
│   └── en/
│       └── smoothsteps.php # English language strings
├── classes/
│   └── event/
│       └── course_module_viewed.php  # Event handler
└── pix/
    └── icon.png            # Activity icon (add your own)
```

### Database Schema

The module creates a `smoothsteps` table with the following fields:
- `id`: Primary key
- `course`: Course ID reference
- `name`: Activity name
- `intro`: Activity description
- `introformat`: Description format
- `distributiontype`: Type of distribution to show
- `animationspeed`: Animation speed setting
- `timecreated`: Creation timestamp
- `timemodified`: Last modification timestamp

### Animation Logic

The animation uses HTML5 Canvas to render:

1. **Continuous Distribution**:
   - Implements normal distribution PDF
   - Renders smooth curve with area filling
   - Animates left-to-right

2. **Discrete Distribution**:
   - Implements binomial distribution PMF
   - Renders individual bars
   - Animates bar-by-bar appearance

### Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Opera 47+

## Customization

### Changing Distributions

To modify the probability distributions, edit `animation.js`:

```javascript
// For continuous - change these parameters
var mean = 180;      // Center of distribution
var stdDev = 50;     // Standard deviation

// For discrete - modify these
var discretePoints = 15;  // Number of bars
var p = 0.5;             // Binomial probability
```

### Styling the Smartphone Frame

Customize the appearance in `styles.css`:

```css
.smartphone-frame {
    width: 380px;          /* Frame width */
    height: 760px;         /* Frame height */
    border-radius: 40px;   /* Corner radius */
    /* Modify gradient, position, etc. */
}
```

### Adding New Distribution Types

1. Add new option to `mod_form.php` in the distribution type select
2. Add language strings to `lang/en/smoothsteps.php`
3. Implement drawing function in `animation.js`
4. Update the view logic in `view.php`

## Educational Context

### Continuous Probability Distributions

- Represent outcomes that can take any value in an interval
- Probability is found by calculating area under the curve
- Examples: Normal, Uniform, Exponential distributions
- Used for: Heights, weights, temperatures, time measurements

### Discrete Probability Distributions

- Represent outcomes that can only take specific values
- Each value has a distinct probability
- Examples: Binomial, Poisson, Geometric distributions
- Used for: Coin flips, dice rolls, counting events

## Troubleshooting

### Animation Not Displaying

1. Check browser console for JavaScript errors
2. Ensure Canvas is supported in the browser
3. Verify JavaScript and CSS files are loading correctly
4. Check file permissions on the module directory

### Database Installation Fails

1. Verify MySQL version compatibility (5.7+)
2. Check database user permissions
3. Review Moodle error logs
4. Try manually installing via XMLDB editor

### Smartphone Frame Not Positioned Correctly

1. Check for CSS conflicts with theme
2. Verify responsive breakpoints for your screen size
3. Adjust position in `styles.css` if needed

## Support

For issues, questions, or contributions:
- Check Moodle forums
- Review Moodle developer documentation
- Submit issues to your project repository

## License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

## Credits

Developed for educational purposes to help students understand probability concepts through visual learning.

## Version History

- **v1.0** (2025-11-18): Initial release
  - Continuous and discrete probability distributions
  - Smartphone frame UI
  - Interactive animation controls
  - Moodle 3.7+ compatibility

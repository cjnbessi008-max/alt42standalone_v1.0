# Blossom Sequence - Moodle Activity Module

An interactive Moodle activity module that teaches mathematical sequences through an engaging flower petal visualization displayed on a virtual smartphone screen.

## Features

- **Interactive Visualization**: Sequences unfold like flower petals in a beautiful animation
- **Virtual Smartphone Display**: Content is displayed in a realistic smartphone interface positioned at the bottom right
- **Multiple Sequence Types**:
  - Fibonacci Sequence
  - Arithmetic Sequences
  - Geometric Sequences
  - Square Numbers
  - Prime Numbers
  - Custom Sequences
- **Adaptive Difficulty**: 5 difficulty levels to match student ability
- **LMS Integration**: Seamlessly integrates with Moodle's gradebook and activity completion
- **Attempt Tracking**: Maintains history of student attempts with scores
- **Responsive Design**: Works on desktop and mobile devices

## Requirements

- **Moodle**: 3.7 or higher
- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher
- Modern web browser with HTML5 Canvas support

## Installation

1. Copy the `mod_blossomsequence` directory to your Moodle installation's `mod/` directory:
   ```bash
   cp -r mod_blossomsequence /path/to/moodle/mod/
   ```

2. Visit your Moodle site administration area to complete the installation:
   ```
   Site administration > Notifications
   ```

3. Follow the on-screen instructions to install the database tables

## Usage

### For Teachers

1. Turn editing on in your course
2. Add an activity or resource
3. Choose "Blossom Sequence" from the activities list
4. Configure the sequence settings:
   - **Activity name**: Give your activity a descriptive name
   - **Sequence type**: Choose from Fibonacci, Arithmetic, Geometric, Square, Prime, or Custom
   - **Number of petals**: Set how many sequence elements to display (recommended: 6-12)
   - **Difficulty level**: Choose from 1 (Very Easy) to 5 (Very Hard)
   - **Custom sequence data** (optional): For custom sequences, enter a JSON array like `[2, 4, 8, 16, 32]`
5. Save and display

### For Students

1. Click on the Blossom Sequence activity
2. Watch the sequence unfold in the virtual smartphone display
3. Study the pattern as each petal appears with a number
4. Predict the next number in the sequence
5. Enter your answer in the input field
6. Submit to receive immediate feedback
7. View your attempt history in the sidebar

## Technical Architecture

### Files Structure

```
mod_blossomsequence/
├── version.php                 # Plugin version and metadata
├── lib.php                     # Core module functions
├── mod_form.php               # Settings form
├── view.php                   # Main view page
├── index.php                  # Course instance list
├── styles.css                 # Module styles
├── README.md                  # This file
├── db/
│   ├── install.xml           # Database schema
│   ├── access.php            # Capability definitions
│   └── services.php          # Web service definitions
├── lang/
│   └── en/
│       └── blossomsequence.php  # English language strings
├── classes/
│   ├── external.php          # External API
│   └── event/
│       ├── course_module_viewed.php
│       └── course_module_instance_list_viewed.php
└── amd/
    └── src/
        └── blossomsequence.js  # JavaScript for visualization
```

### Database Tables

**blossomsequence**
- Stores activity instances with sequence configuration

**blossomsequence_attempts**
- Tracks student attempts and scores

### JavaScript Animation

The module uses HTML5 Canvas to render the blossom visualization:
- Each petal represents a number in the sequence
- Petals unfold one by one in an animated sequence
- Colors are dynamically assigned for visual appeal
- Smooth easing animations create organic motion

## Sequence Types Explained

### Fibonacci Sequence
Each number is the sum of the two preceding ones: 1, 1, 2, 3, 5, 8, 13...

### Arithmetic Sequence
Numbers increase by a constant difference: 2, 4, 6, 8, 10...

### Geometric Sequence
Each number is multiplied by a constant ratio: 2, 4, 8, 16, 32...

### Square Numbers
Perfect squares: 1, 4, 9, 16, 25, 36...

### Prime Numbers
Numbers divisible only by 1 and themselves: 2, 3, 5, 7, 11, 13...

### Custom Sequence
Define your own pattern using JSON array notation

## Grading

The module automatically grades student responses:
- **Correct answer**: 100%
- **Incorrect answer**: 0%
- Grades are automatically sent to the Moodle gradebook
- Students can make multiple attempts
- Best score is recorded

## Customization

### Modifying Colors

Edit the color palette in `amd/src/blossomsequence.js`:

```javascript
colors: [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    // Add your custom colors here
]
```

### Adjusting Animation Speed

Modify the animation duration in `amd/src/blossomsequence.js`:

```javascript
animationDuration: 800,  // milliseconds
```

### Styling the Smartphone

Customize the virtual smartphone appearance in `styles.css`:

```css
.smartphone-frame {
    width: 360px;
    height: 640px;
    background: #2c3e50;
    /* Modify dimensions and colors */
}
```

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- High contrast mode compatible
- Scalable text and interface elements

## Troubleshooting

### Canvas Not Displaying
- Check browser console for JavaScript errors
- Ensure HTML5 Canvas is supported
- Verify BLOSSOM_DATA is being passed correctly

### Grades Not Recording
- Check database permissions
- Verify gradebook settings
- Review capability assignments

### Animations Not Working
- Clear browser cache
- Check JavaScript console for errors
- Ensure CSS is loading correctly

## Support

For issues, questions, or feature requests:
- GitHub: [Your Repository URL]
- Email: support@kaist.ac.kr
- Moodle Forum: [Link to discussion]

## Credits

**Developed by**: KAIST Touch Math Academy
**Copyright**: 2025 KAIST Touch Math Academy
**License**: GNU GPL v3 or later

## Changelog

### Version 1.0 (2025-01-18)
- Initial release
- Support for 6 sequence types
- Virtual smartphone visualization
- Flower petal animation
- Gradebook integration
- Attempt tracking
- Multiple language support (English)

## Future Enhancements

- [ ] Additional sequence types (Tribonacci, Lucas, etc.)
- [ ] Hint system for struggling students
- [ ] Sound effects for correct/incorrect answers
- [ ] Multiplayer competition mode
- [ ] Custom petal shapes and themes
- [ ] Export student progress reports
- [ ] Integration with Moodle badges
- [ ] Adaptive difficulty adjustment

## License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.

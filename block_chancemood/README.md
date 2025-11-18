# Chance Mood Block for Moodle

## 📊 Overview

**Chance Mood** is a Moodle block plugin that analyzes probability and combinatorics problems from your courses and visualizes student performance through emotional colors. The plugin displays a virtual smartphone interface at the bottom-right of the screen, providing an engaging and intuitive way to track learning progress.

### Key Features

- 🎯 **Automatic Problem Detection**: Identifies probability, chance, and combinatorics problems from Moodle quizzes
- 🎨 **Emotional Color Mapping**: Visualizes difficulty and success rates using intuitive color psychology
- 📱 **Virtual Smartphone Display**: Beautiful, mobile-inspired UI positioned at bottom-right of screen
- 📈 **Real-time Analytics**: Tracks success rates and problem distribution across different difficulty levels
- 🌏 **Multilingual Support**: Available in English and Korean (한국어)
- ⚡ **Interactive**: Draggable display, animated charts, and responsive design

## 🎨 Emotion Color System

The plugin uses five emotional states to represent problem difficulty:

| Emotion | Color | Success Rate | Meaning |
|---------|-------|--------------|---------|
| 😊 Joy | Green (#2ecc71) | 80-100% | Easy problems - students are confident |
| 😎 Confidence | Blue (#3498db) | 60-80% | Moderate problems - steady progress |
| 🤔 Challenge | Orange (#f39c12) | 40-60% | Challenging - students need focus |
| 😰 Struggle | Dark Orange (#e67e22) | 20-40% | Difficult - review basics recommended |
| 😫 Frustration | Red (#e74c3c) | 0-20% | Very difficult - teacher help needed |

## 📋 Requirements

- **Moodle**: 3.7 or higher
- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher
- **Browser**: Modern browser with JavaScript enabled

## 🚀 Installation

### Method 1: Via Moodle Plugin Installer (Recommended)

1. Download the latest release ZIP file
2. Login to Moodle as administrator
3. Navigate to: **Site administration** → **Plugins** → **Install plugins**
4. Upload the ZIP file
5. Click **Install plugin from the ZIP file**
6. Follow the on-screen instructions

### Method 2: Manual Installation

1. Download or clone this repository
2. Extract/copy the `block_chancemood` folder to your Moodle installation:
   ```
   /path/to/moodle/blocks/chancemood/
   ```
3. Login to Moodle as administrator
4. Navigate to: **Site administration** → **Notifications**
5. Follow the installation prompts

### Method 3: Git Clone (For Developers)

```bash
cd /path/to/moodle/blocks/
git clone https://github.com/yourusername/moodle-block_chancemood.git chancemood
```

Then complete steps 3-5 from Method 2.

## ⚙️ Configuration

### Global Settings

After installation, configure the block:

1. Navigate to: **Site administration** → **Plugins** → **Blocks** → **Chance Mood**
2. Configure the following settings:

   - **Enable Chance Mood**: Toggle the block on/off globally
   - **Display Position**: Choose where the smartphone appears (bottom-right, bottom-left, top-right, top-left)
   - **Auto-refresh Interval**: How often to refresh mood data (default: 5 minutes)
   - **Use Sample Data**: Enable sample data for testing (useful for development/demo)

### Adding Block to Courses

**For Teachers:**

1. Turn editing on in your course
2. Click **Add a block** from the block drawer
3. Select **Chance Mood**
4. The virtual smartphone will appear at the configured position

**For Students:**

The block automatically appears if added by teachers. Students can:
- View their mood analysis
- See problem distribution
- Track their progress
- Drag the smartphone to reposition it

## 🎯 How It Works

### Problem Detection

The plugin automatically scans quiz questions for probability-related keywords:

**Korean Keywords:**
- 확률 (probability)
- 경우의 수 (number of cases)
- 조합 (combination)
- 순열 (permutation)

**English Keywords:**
- probability
- chance
- combination
- permutation

### Success Rate Calculation

Success rates are calculated based on:
- Student attempt data from `{question_attempts}` table
- Correct answer fractions
- Average performance across all attempts

### Mood Analysis

The system:
1. Fetches all probability problems from the course
2. Analyzes success rates for each problem
3. Assigns emotional categories
4. Generates color-coded visualizations
5. Displays summary statistics

## 📱 User Interface

### Smartphone Display Components

```
┌─────────────────────┐
│   Chance Mood       │ ← Header (colored by overall mood)
│   경우의 수 학습 현황  │
├─────────────────────┤
│       😊            │ ← Mood emoji (animated)
│                     │
│  "훌륭해요! 경우의 수   │ ← Personalized message
│   문제를 잘 이해하고    │
│   있어요! (성공률: 82%) │
├─────────────────────┤
│ 분석된 문제: 15개     │ ← Statistics
│ 평균 성공률: 82%      │
├─────────────────────┤
│ 감정 분포:           │ ← Emotion distribution chart
│ 기쁨     ████████ 8  │   (color-coded bars)
│ 자신감    ████ 4     │
│ 도전     ██ 2        │
│ 고군분투   █ 1       │
└─────────────────────┘
```

### Interactive Features

- **Draggable**: Click and drag the smartphone to reposition
- **Toggle Button**: Show/hide the display with a single click
- **Animated Charts**: Smooth bar chart animations
- **Hover Effects**: Interactive feedback on chart elements
- **Auto-refresh**: Periodic updates without page reload

## 🔧 Technical Details

### Database Queries

The plugin queries the following Moodle tables:
- `{question}` - Quiz question content
- `{question_attempts}` - Student attempt data
- `{quiz_slots}` - Quiz-question relationships
- `{quiz}` - Quiz course associations

### File Structure

```
block_chancemood/
├── block_chancemood.php      # Main block class
├── version.php                # Plugin version and requirements
├── settings.php               # Admin settings
├── README.md                  # This file
├── db/
│   └── access.php            # Capabilities definition
├── lang/
│   ├── en/
│   │   └── block_chancemood.php  # English strings
│   └── ko/
│       └── block_chancemood.php  # Korean strings
├── js/
│   └── smartphone_display.js # JavaScript interactivity
└── styles/
    └── chancemood.css        # Stylesheet
```

### Performance Considerations

- Queries are limited to 50 most recent problems
- Results are cached for the refresh interval (default: 5 minutes)
- Lightweight JavaScript (vanilla JS, no dependencies)
- CSS animations use GPU acceleration
- AJAX updates prevent full page reloads

## 🌍 Localization

Currently supported languages:
- English (en)
- Korean (ko - 한국어)

To add a new language:
1. Create a new folder: `lang/{language_code}/`
2. Copy `lang/en/block_chancemood.php` to the new folder
3. Translate all string values

## 🐛 Troubleshooting

### Block doesn't appear
- Check if the plugin is enabled in settings
- Verify you have the `block/chancemood:viewmood` capability
- Ensure JavaScript is enabled in your browser

### No problems detected
- Verify your course has quizzes with probability questions
- Check that question names/text contain probability keywords
- Enable "Use Sample Data" in settings for testing

### Display position issues
- Try changing the display position in settings
- Clear browser cache and reload
- Check for CSS conflicts with theme

### Database errors
- Verify MySQL version is 5.7 or higher
- Check database table prefixes match your installation
- Review Moodle error logs

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This plugin is licensed under the GNU GPL v3 or later.

See [LICENSE](LICENSE) for the full license text.

## 👥 Credits

**Developed by**: KAIST Touch Math Academy
**Copyright**: 2025
**Contact**: [Your contact information]

### Acknowledgments

- Moodle community for excellent documentation
- Teachers and students who provided feedback
- Color psychology research for emotion mapping

## 📚 Additional Resources

- [Moodle Plugin Development](https://docs.moodle.org/dev/Main_Page)
- [Moodle Blocks Documentation](https://docs.moodle.org/dev/Blocks)
- [Color Psychology in Education](https://www.colorpsychology.org/)

## 🔮 Future Enhancements

Planned features for future releases:
- [ ] Machine learning-based difficulty prediction
- [ ] Personalized study recommendations
- [ ] Export mood reports to PDF
- [ ] Integration with Moodle analytics
- [ ] Support for more problem types (algebra, geometry, etc.)
- [ ] Teacher dashboard for class-wide mood analysis
- [ ] Gamification elements (badges, achievements)
- [ ] Mobile app companion

## 📞 Support

For bug reports, feature requests, or questions:
- **Issues**: [GitHub Issues](https://github.com/yourusername/moodle-block_chancemood/issues)
- **Email**: support@example.com
- **Forum**: [Moodle Plugins Directory](https://moodle.org/plugins/)

---

Made with ❤️ for mathematics education

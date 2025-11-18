# KAIST Touch Math Academy - Trend Glow Feature

**Trend Glow** is a visual learning analytics feature that displays student performance trends with dynamic glow effects on a virtual smartphone interface. This feature integrates with Moodle LMS to provide real-time insights into student progress.

## 🌟 Features

### Core Functionality
- **Real-time Trend Visualization**: Interactive line charts showing student performance over time
- **Dynamic Glow Effects**: Trend lines highlight with animated glow based on performance direction
  - 🟢 Green glow for improving trends
  - 🔴 Red glow for declining trends
  - 🔵 Blue glow for stable performance
- **Virtual Smartphone Display**: App interface displayed in lower-right smartphone mockup
- **LMS Integration**: Connects to Moodle 3.7 with MySQL 5.7 backend

### Visual Effects
- Pulsing glow animations on trend lines
- Color-coded performance indicators
- Smooth transitions and animations
- Responsive design for all screen sizes
- Real-time data updates

## 🖥️ Technology Stack

### Frontend
- **HTML5**: Semantic markup structure
- **CSS3**: Advanced animations and glow effects
- **JavaScript (ES6+)**: Modern modular architecture
- **Chart.js 4.4.0**: Data visualization library

### Backend Integration
- **Moodle**: 3.7
- **PHP**: 7.1.9
- **MySQL**: 5.7

## 📁 Project Structure

```
alt42standalone_v1.0/
├── index.html              # Main application page
├── css/
│   ├── styles.css         # Main stylesheet
│   └── trend-glow.css     # Glow effect animations
├── js/
│   ├── app.js             # Main application logic
│   ├── lms-integration.js # Moodle/LMS data integration
│   └── trend-visualization.js # Chart rendering with glow effects
└── README.md              # This file
```

## 🚀 Quick Start

### Option 1: Direct File Access
Simply open `index.html` in a modern web browser:
```bash
# Navigate to project directory
cd alt42standalone_v1.0

# Open in default browser (Linux)
xdg-open index.html

# Or use any web browser
firefox index.html
chrome index.html
```

### Option 2: Local Web Server
For full functionality, serve via HTTP:

**Using Python:**
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Using PHP:**
```bash
php -S localhost:8000
```

**Using Node.js:**
```bash
npx http-server -p 8000
```

Then visit: `http://localhost:8000`

## 📱 User Interface

### Main Dashboard (Left)
- **LMS Data Controls**: Select student and learning module
- **Trend Glow Toggle**: Enable/disable glow effects
- **Statistics Cards**: Current score, trend direction, average score
- **System Information**: LMS connection status and technical details

### Virtual Smartphone (Lower Right)
- **Trend Chart**: Interactive visualization with glow effects
- **Learning Metrics**: Progress velocity and improvement bars
- **Recent Problems**: Last 5 practice problems with results

## 🎨 Trend Glow Effects

### Glow Colors
| Trend Type | Color | Meaning |
|------------|-------|---------|
| Positive ↗️ | Green (#4caf50) | Performance improving |
| Negative ↘️ | Red (#f44336) | Performance declining |
| Neutral ➡️ | Blue (#667eea) | Stable performance |

### Animation Effects
- **Pulse Animation**: 2-second cycle with intensity variation
- **Drop Shadow**: Multi-layered glow (8px, 16px, 24px)
- **Shimmer Effect**: Moving highlight on trend lines
- **Point Glow**: Animated halos on data points

## 🔧 Configuration

### Glow Intensity Levels
Modify in `js/trend-visualization.js`:
```javascript
const intensities = {
    low: 8,      // Subtle glow
    medium: 12,  // Default
    high: 20     // Dramatic effect
};
```

### Trend Detection Sensitivity
Adjust threshold in `js/lms-integration.js`:
```javascript
if (recentAvg > earlierAvg + 5) return 'up';    // Increase for less sensitive
if (recentAvg < earlierAvg - 5) return 'down';  // Decrease for more sensitive
```

## 📊 LMS Integration

### Mock Data (Current)
The application currently uses mock data for demonstration. Data includes:
- 4 sample students (김철수, 이영희, 박민수, 정수진)
- 4 learning modules (addition, subtraction, multiplication, fractions)
- 10 sessions of historical performance data per student/module

### Real Moodle Integration (Future)
To connect to actual Moodle instance:

1. Update `js/lms-integration.js`:
```javascript
constructor() {
    this.baseURL = 'https://your-moodle-instance.com';
    this.apiToken = 'YOUR_MOODLE_API_TOKEN';
}
```

2. Implement API endpoints:
```javascript
async fetchStudentPerformance(studentId, moduleId) {
    const response = await fetch(
        `${this.baseURL}/webservice/rest/server.php`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wstoken: this.apiToken,
                wsfunction: 'core_grades_get_grades',
                moodlewsrestformat: 'json',
                userid: studentId,
                courseid: moduleId
            })
        }
    );
    return response.json();
}
```

## 🎯 Key Features Explanation

### Trend Detection Algorithm
```javascript
// Compares recent 3 sessions vs earlier 3 sessions
const recent = scores.slice(-3);
const earlier = scores.slice(-6, -3);

const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

// Determine trend direction
if (recentAvg > earlierAvg + 5) return 'positive';
if (recentAvg < earlierAvg - 5) return 'negative';
return 'neutral';
```

### Performance Metrics
- **Current Score**: Latest test/practice score
- **Average Score**: Mean across all sessions
- **Learning Velocity**: Rate of improvement (change per session)
- **Improvement**: Percentage change from first to last session

## 🌐 Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Opera | 76+ | ✅ Full |

**Required Features:**
- CSS Grid & Flexbox
- CSS Custom Properties
- ES6+ JavaScript (Arrow functions, Classes, Async/Await)
- Canvas API
- CSS Animations & Transitions

## 📈 Performance Optimization

### Current Optimizations
- Efficient Chart.js rendering with debouncing
- CSS animations using GPU-accelerated properties (transform, opacity)
- Lazy loading of chart data
- Request throttling for LMS API calls

### Future Improvements
- Service Worker for offline functionality
- Progressive Web App (PWA) features
- WebSocket for real-time updates
- Data caching with IndexedDB

## 🐛 Troubleshooting

### Chart Not Displaying
**Issue**: Blank canvas or no chart visible
**Solution**:
- Check browser console for errors
- Ensure Chart.js loaded: `console.log(Chart)`
- Verify canvas element exists: `document.getElementById('trendChart')`

### Glow Effects Not Working
**Issue**: Trend lines appear flat without glow
**Solution**:
- Verify glow toggle is enabled
- Check CSS `trend-glow.css` is loaded
- Ensure browser supports CSS filters

### No Data Showing
**Issue**: Empty statistics or "-- " values
**Solution**:
- Check LMS connection status
- Verify student/module selection
- Review browser console for API errors
- Click "데이터 새로고침" (Refresh Data) button

## 🔐 Security Considerations

### Current Implementation (Demo)
- Client-side only, no sensitive data
- Mock data for demonstration purposes

### Production Deployment
- **Authentication**: Implement OAuth 2.0 or JWT tokens
- **API Security**: Use HTTPS, validate API tokens
- **Data Privacy**: Encrypt student data in transit and at rest
- **XSS Protection**: Sanitize all user inputs
- **CSRF Protection**: Implement CSRF tokens for state-changing operations

## 📝 License

This project is part of the KAIST Touch Math Academy AI Education System Pipeline.

## 👥 Contributors

- KAIST Touch Math Academy Development Team
- AI Education System Pipeline Project

## 📧 Support

For issues, questions, or contributions, please refer to the main project documentation.

---

**Last Updated**: 2025-11-18
**Version**: 1.0.0
**Status**: ✅ Demo Ready

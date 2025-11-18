# Feature Spotlight - Mathematical Function Analyzer

## Overview
Feature Spotlight is a web application that integrates with Moodle LMS to receive problem information and displays interactive mathematical function analysis on a virtual smartphone screen. It highlights key calculus features including:

- **증감 (Increase/Decrease)**: Intervals where the function is increasing or decreasing
- **극값 (Extrema)**: Local maxima and minima points
- **변곡점 (Inflection Points)**: Points where concavity changes

## Technology Stack
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Math Library**: Math.js for function parsing and evaluation

## Features
1. **Moodle Integration**: Fetches problem data from Moodle database
2. **Function Analysis**: Automatically detects mathematical features using calculus
3. **Visual Highlighting**: Color-coded visualization of key features
4. **Responsive Smartphone Display**: Bottom-right virtual smartphone interface
5. **Interactive**: Click on features to see detailed information

## Directory Structure
```
feature-spotlight/
├── backend/
│   ├── config.php           # Database and Moodle configuration
│   ├── api.php              # REST API endpoints
│   └── MoodleIntegration.php # Moodle integration class
├── frontend/
│   ├── index.html           # Main application page
│   ├── css/
│   │   ├── smartphone.css   # Virtual smartphone styling
│   │   └── spotlight.css    # Feature visualization styles
│   ├── js/
│   │   ├── math-analyzer.js # Mathematical analysis engine
│   │   ├── feature-spotlight.js # Main spotlight component
│   │   └── smartphone-display.js # Smartphone UI controller
│   └── assets/
│       └── smartphone-frame.svg # Smartphone device frame
├── database/
│   └── schema.sql           # Database schema for feature storage
└── docs/
    └── API.md               # API documentation
```

## Installation

### 1. Database Setup
```bash
mysql -u root -p < database/schema.sql
```

### 2. Configuration
Edit `backend/config.php` with your Moodle database credentials:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 3. Deploy Files
Copy the `feature-spotlight` directory to your web server's document root.

### 4. Access
Navigate to: `http://your-server/feature-spotlight/frontend/index.html`

## Usage

### For Students
1. The smartphone display appears in the bottom-right corner
2. When a math problem is loaded, the function graph is displayed
3. Key features are automatically highlighted with different colors:
   - **Red**: Local maxima (극대값)
   - **Blue**: Local minima (극소값)
   - **Green**: Inflection points (변곡점)
   - **Yellow**: Increasing intervals (증가 구간)
   - **Purple**: Decreasing intervals (감소 구간)
4. Click on any highlighted feature to see details

### For Teachers
1. Create problems in Moodle with function expressions
2. The system automatically analyzes the function
3. View student interaction data with highlighted features

## API Endpoints

### GET `/backend/api.php?action=get_problem&id={problem_id}`
Fetch problem data from Moodle

### POST `/backend/api.php?action=analyze_function`
Analyze a mathematical function for key features

### GET `/backend/api.php?action=get_features&problem_id={id}`
Get cached feature data for a problem

## Mathematical Analysis

The Feature Spotlight uses numerical methods to detect:

1. **First Derivative Test**: Identifies critical points for extrema
2. **Second Derivative Test**: Confirms maxima/minima and finds inflection points
3. **Sign Analysis**: Determines increasing/decreasing intervals

## Browser Support
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## License
MIT License

## Authors
KAIST Touch Math Academy Development Team

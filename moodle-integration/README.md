# Moodle LMS Integration WebApp with Cross Wave Effect

## Overview
웹앱 that integrates with Moodle LMS to fetch quiz questions and displays them on a virtual smartphone interface with Cross Wave ripple animation effects.

## Technology Stack
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)

## Features
1. Moodle LMS API integration for quiz data
2. Virtual smartphone display (bottom-right corner)
3. Cross Wave circular ripple animation on correct answers
4. Responsive design

## Directory Structure
```
moodle-integration/
├── backend/
│   ├── config/
│   │   ├── database.php
│   │   └── moodle.php
│   ├── api/
│   │   ├── get_questions.php
│   │   └── submit_answer.php
│   └── models/
│       └── Question.php
├── frontend/
│   ├── css/
│   │   ├── smartphone.css
│   │   └── cross-wave.css
│   ├── js/
│   │   ├── app.js
│   │   ├── smartphone.js
│   │   └── cross-wave.js
│   └── index.html
└── database/
    └── schema.sql
```

## Setup Instructions
1. Configure database connection in `backend/config/database.php`
2. Set Moodle API credentials in `backend/config/moodle.php`
3. Run database schema: `mysql -u root -p < database/schema.sql`
4. Deploy to PHP-enabled web server
5. Access via browser

## Usage
- Open index.html in browser
- Virtual smartphone appears in bottom-right corner
- Questions load from Moodle LMS
- Correct answers trigger Cross Wave animation

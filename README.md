# ALT42 Standalone - Live Graph Application

## Overview
웹앱과 LMS(Moodle 3.7)를 연동하여 문제 정보를 받아 동작하는 애플리케이션입니다.
우측 하단 가상 스마트폰 화면에 표시되며, 그래프가 숨 쉬듯 움직이며 변화량을 보여주는 'Live Graph' 기능을 제공합니다.

## Tech Stack
- **MySQL**: 5.7
- **PHP**: 7.1.9
- **Moodle**: 3.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Animation**: CSS3 Animations + Canvas API

## Features
- 📱 우측 하단 가상 스마트폰 화면
- 📊 Live Graph with breathing animation
- 🔗 Moodle LMS 연동
- 📈 실시간 데이터 시각화

## Project Structure
```
alt42standalone_v1.0/
├── backend/                 # PHP Backend
│   ├── config/             # Configuration files
│   ├── api/                # API endpoints
│   ├── moodle/             # Moodle integration
│   └── database/           # Database utilities
├── frontend/               # Frontend application
│   ├── index.html          # Main entry point
│   ├── css/                # Stylesheets
│   ├── js/                 # JavaScript modules
│   │   ├── live-graph.js   # Live Graph implementation
│   │   ├── smartphone.js   # Smartphone UI controller
│   │   └── moodle-client.js # Moodle API client
│   └── assets/             # Images, icons, etc.
└── docs/                   # Documentation

## Setup
1. Configure MySQL database
2. Set up Moodle connection in `backend/config/config.php`
3. Deploy PHP backend to web server
4. Open `frontend/index.html` in browser

## Live Graph Features
- **Breathing Animation**: 그래프가 부드럽게 확대/축소되며 "숨 쉬는" 효과
- **Real-time Updates**: Moodle에서 받은 데이터를 실시간 반영
- **Smooth Transitions**: CSS3 + Canvas를 활용한 부드러운 애니메이션
- **Interactive**: 마우스 호버 시 상세 정보 표시

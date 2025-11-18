# Zone Breeze - 연립부등식 해 영역 시각화 앱

## 개요 (Overview)
Zone Breeze는 Moodle LMS와 연동하여 연립부등식의 해 영역을 시각적으로 표현하는 교육용 웹 앱입니다.
해 영역을 구역별 "기운(에너지)"으로 표현하여 학생들이 직관적으로 이해할 수 있도록 돕습니다.

Zone Breeze is an educational web app that integrates with Moodle LMS to visualize solution regions
of systems of inequalities using zone-based "energy/breeze" visual effects.

## 기술 스택 (Tech Stack)
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6)
- **Visualization**: Canvas API, SVG

## 주요 기능 (Key Features)
1. Moodle LMS 연동을 통한 문제 정보 수신
2. 연립부등식 자동 해석 및 해 영역 계산
3. 실시간 시각화 (Zone-based energy visualization)
4. 가상 스마트폰 화면 (우측 하단 위치)
5. 인터랙티브 학습 경험

## 디렉토리 구조 (Directory Structure)
```
zone-breeze/
├── backend/              # PHP backend files
│   ├── api.php          # API endpoints
│   ├── moodle_client.php # Moodle integration
│   ├── inequality_solver.php # Inequality solver
│   └── config.php       # Configuration
├── frontend/            # Frontend assets
│   ├── index.html       # Main HTML
│   ├── css/
│   │   ├── main.css     # Main styles
│   │   └── smartphone.css # Smartphone UI styles
│   ├── js/
│   │   ├── app.js       # Main application logic
│   │   ├── visualizer.js # Visualization engine
│   │   └── inequality.js # Inequality parser
│   └── assets/          # Images, icons, etc.
├── database/            # Database scripts
│   └── schema.sql       # MySQL schema
├── config/              # Configuration files
│   └── moodle_config.php
└── docs/                # Documentation
    └── API.md           # API documentation
```

## 설치 방법 (Installation)

### 1. Prerequisites
- PHP 7.1.9 or higher
- MySQL 5.7
- Moodle 3.7
- Apache/Nginx web server

### 2. Database Setup
```bash
mysql -u root -p < database/schema.sql
```

### 3. Configuration
Edit `config/moodle_config.php` with your Moodle credentials and settings.

### 4. Deploy
Copy files to your web server document root or configure a virtual host.

## 사용 방법 (Usage)

### For Teachers (Moodle)
1. Moodle에서 Zone Breeze 활동을 코스에 추가
2. 연립부등식 문제 입력 (예: x + y < 5, x - y > 2)
3. 학생들에게 활동 공개

### For Students
1. Moodle 코스에서 Zone Breeze 활동 접속
2. 우측 하단 가상 스마트폰 화면에서 해 영역 시각화 확인
3. Zone별 에너지 효과를 통해 해의 강도 파악

## API Endpoints

### `POST /api/get_problem`
Moodle로부터 문제 정보 가져오기

**Request:**
```json
{
  "course_id": 123,
  "activity_id": 456,
  "user_id": 789
}
```

**Response:**
```json
{
  "problem_id": "abc123",
  "inequalities": [
    "x + y <= 5",
    "x - y >= 2",
    "x >= 0",
    "y >= 0"
  ],
  "title": "연립부등식 문제 1"
}
```

### `POST /api/solve`
연립부등식 해 영역 계산

**Request:**
```json
{
  "inequalities": [
    "x + y <= 5",
    "x - y >= 2"
  ],
  "bounds": {
    "xMin": -10,
    "xMax": 10,
    "yMin": -10,
    "yMax": 10
  }
}
```

**Response:**
```json
{
  "vertices": [
    {"x": 0, "y": 0},
    {"x": 3.5, "y": 1.5},
    {"x": 5, "y": 0}
  ],
  "regions": [
    {
      "type": "solution",
      "intensity": 1.0,
      "color": "#4CAF50"
    }
  ]
}
```

## 시각화 효과 (Visualization Effects)

### Zone Energy Levels
- **High Energy Zone** (진한 초록): 모든 부등식을 강하게 만족
- **Medium Energy Zone** (연한 초록): 부등식을 만족하는 경계 근처
- **Low Energy Zone** (연한 회색): 일부 부등식만 만족
- **No Energy Zone** (투명): 해당 없음

### Interactive Features
- 마우스 호버: 해당 점의 부등식 만족 여부 표시
- 클릭: 해당 점의 좌표 및 상세 정보 표시
- 줌/팬: 그래프 확대/축소 및 이동

## 라이선스 (License)
MIT License

## 개발자 (Developer)
KAIST Touch Math Academy - AI Education System

## 버전 (Version)
v1.0.0 - Initial Release

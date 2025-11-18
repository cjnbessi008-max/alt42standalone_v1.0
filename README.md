# LMS Thinking Tempo Analysis System

마이크로초 단위 문제 풀이 시간 분석을 통한 사고 템포 지도 생성 시스템

## 시스템 개요

Moodle LMS와 연동하여 학습자의 문제 풀이 과정을 마이크로초 단위로 추적하고 분석하여 사고 패턴을 시각화하는 시스템입니다.

## 기술 스택

- **LMS**: Moodle 3.7
- **서버**: PHP 7.1.9
- **데이터베이스**: MySQL 5.7
- **분석 엔진**: Python 3.x
- **시각화**: JavaScript (D3.js)

## 주요 기능

### 1. 마이크로초 단위 시간 추적
- 키 입력 간격 추적
- 마우스 이동 패턴 분석
- 문제 읽기 시간 측정
- 답안 작성 시간 분석
- 수정/재고 시간 추적

### 2. 사고 템포 분석
- 빠른 응답 구간 (Fast Tempo): < 500ms
- 일반 사고 구간 (Normal Tempo): 500ms - 3s
- 깊은 사고 구간 (Deep Thinking): 3s - 10s
- 막힘 구간 (Stuck): > 10s

### 3. 사고 템포 지도 생성
- 시간축 기반 템포 변화 시각화
- 문제별 사고 패턴 비교
- 학습자별 사고 스타일 프로파일
- 개념 이해도 히트맵

## 디렉토리 구조

```
/
├── moodle-plugin/          # Moodle 플러그인
│   ├── local_thinking_tempo/
│   │   ├── lib.php
│   │   ├── version.php
│   │   ├── db/
│   │   │   ├── install.xml
│   │   │   └── upgrade.php
│   │   ├── classes/
│   │   │   ├── tracker.php
│   │   │   └── api.php
│   │   └── amd/src/
│   │       └── tracker.js
├── analysis-engine/        # Python 분석 엔진
│   ├── tempo_analyzer.py
│   ├── pattern_detector.py
│   ├── ml_models/
│   │   └── tempo_classifier.py
│   └── requirements.txt
├── visualization/          # 시각화 컴포넌트
│   ├── tempo_map.js
│   ├── heatmap.js
│   └── timeline.js
├── api/                   # REST API
│   ├── endpoints.php
│   └── config.php
└── database/             # 데이터베이스 스키마
    └── schema.sql
```

## 설치 방법

### 1. Moodle 플러그인 설치
```bash
cd /path/to/moodle
cp -r moodle-plugin/local_thinking_tempo local/thinking_tempo
php admin/cli/upgrade.php
```

### 2. 데이터베이스 설정
```bash
mysql -u root -p moodle < database/schema.sql
```

### 3. Python 분석 엔진 설정
```bash
cd analysis-engine
pip install -r requirements.txt
python tempo_analyzer.py --setup
```

## 사용 방법

### Moodle에서 활성화
1. Moodle 관리자 로그인
2. Site administration → Plugins → Local plugins → Thinking Tempo Tracker
3. 추적할 퀴즈/활동 선택
4. 자동 추적 시작

### 사고 템포 지도 확인
1. 교사 대시보드 접속
2. "Thinking Tempo Analysis" 메뉴 선택
3. 학습자 및 문제 선택
4. 실시간 템포 지도 확인

## API 엔드포인트

- `POST /api/track/event` - 이벤트 추적
- `GET /api/analysis/{student_id}/{quiz_id}` - 분석 결과 조회
- `GET /api/tempo-map/{student_id}/{question_id}` - 템포 지도 데이터

## 라이선스

MIT License

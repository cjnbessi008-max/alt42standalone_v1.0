# Edge Melody - LMS 연동 3D 학습 웹앱

## 개요
Moodle LMS와 연동하여 문제 정보를 시각화하는 모바일 웹 애플리케이션입니다.
입체의 모서리들이 음악처럼 점등되는 'Edge Melody' 3D 시각화 기능을 제공합니다.

## 기술 스택

### Backend
- PHP 7.1.9
- MySQL 5.7
- Moodle 3.7

### Frontend
- React 18
- Three.js (3D 시각화)
- Responsive Design (모바일 우선)

## 프로젝트 구조

```
edge-melody/
├── frontend/          # React 웹 애플리케이션
│   ├── src/
│   │   ├── components/   # React 컴포넌트
│   │   ├── services/     # API 통신
│   │   └── utils/        # 유틸리티 함수
│   └── public/          # 정적 파일
├── backend/           # PHP API 서버
│   └── api/          # Moodle 연동 API
├── config/           # 설정 파일
└── docs/             # 문서
```

## 주요 기능

### 1. Moodle LMS 연동
- Moodle 데이터베이스에서 문제 정보 조회
- 실시간 문제 업데이트
- 학생 진도 추적

### 2. Edge Melody 3D 시각화
- 3D 입체 모서리 점등 애니메이션
- 음악적 패턴으로 시각화
- 인터랙티브 3D 조작

### 3. 모바일 반응형 UI
- 우측 하단 가상 스마트폰 화면
- 터치 친화적 인터페이스
- 실시간 업데이트

## 설치 및 실행

### Backend 설정
```bash
cd backend
# Moodle config 설정
cp config/moodle_config.example.php config/moodle_config.php
# 설정 파일 편집 후
```

### Frontend 설정
```bash
cd frontend
npm install
npm start
```

## 설정

`config/database.php`에서 Moodle 데이터베이스 연결 설정:
- MySQL 호스트
- 데이터베이스 이름
- 사용자 인증 정보

## 라이선스
MIT License

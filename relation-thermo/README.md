# Relation Thermo - 집합 관계 시각화 앱

## 개요
Relation Thermo는 Moodle 3.7 LMS와 연동하여 집합의 관계를 온도계처럼 시각화하는 교육용 웹 애플리케이션입니다.

## 기술 스택
- **MySQL**: 5.7
- **PHP**: 7.1.9
- **Moodle**: 3.7
- **Frontend**: HTML5, CSS3, JavaScript (ES5 호환)

## 주요 기능
1. Moodle LMS와 연동하여 문제 정보 수신
2. 집합 관계를 온도계 형태로 시각화
3. 가상 스마트폰 화면(우측 하단)에 앱 표시
4. 학생 응답 및 진행 상황 추적

## 디렉토리 구조
```
relation-thermo/
├── moodle-plugin/          # Moodle 플러그인
│   ├── mod_relationthermo/ # 활동 모듈
│   └── blocks/             # 블록 플러그인
├── webapp/                 # 웹 애플리케이션
│   ├── api/               # REST API
│   ├── public/            # 프론트엔드 자산
│   └── config/            # 설정 파일
├── database/              # 데이터베이스 스키마
└── docs/                  # 문서
```

## 설치 방법
(추후 작성)

## 라이선스
MIT License

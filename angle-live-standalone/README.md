# Angle Live Standalone - 독립형 PWA 웹앱

완전히 독립적으로 동작하는 각도 학습 Progressive Web App입니다. 백엔드 서버 없이 브라우저에서 100% 동작하며, 오프라인에서도 사용할 수 있습니다.

## ✨ 주요 기능

### 🚀 Progressive Web App (PWA)
- **오프라인 동작**: Service Worker를 통한 완전한 오프라인 지원
- **앱처럼 설치 가능**: 모바일/데스크톱에 네이티브 앱처럼 설치
- **빠른 로딩**: 캐시 우선 전략으로 즉시 로딩
- **백그라운드 동기화**: 온라인 복귀 시 자동 동기화 (향후 확장 가능)

### 💾 로컬 데이터 저장
- **IndexedDB**: 대용량 세션 데이터, 각도 기록 저장
- **localStorage**: 설정 및 진행 상황 백업
- **자동 저장**: 각도 변경 시 자동으로 데이터 저장
- **데이터 내보내기/가져오기**: JSON 형식으로 백업 및 복원

### 📊 인터랙티브 학습
- **실시간 각도 조절**: 0° ~ 360° 슬라이더
- **Canvas 시각화**: 메인 화면 + 가상 스마트폰 듀얼 디스플레이
- **10가지 각도 분류**: 색상 코딩된 각도 범위
- **키보드 단축키**: 화살표 키로 정밀 조작

### 📈 학습 진행 추적
- **세션 기록**: 모든 각도 조작 히스토리
- **통계 분석**: 각도별 빈도, 학습 패턴 분석
- **진행률 계산**: 0-360도 중 발견한 각도 비율

## 🎯 기술 스택

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Storage**: IndexedDB, localStorage
- **PWA**: Service Worker, Web App Manifest
- **Canvas API**: 실시간 각도 시각화
- **Architecture**: 완전한 클라이언트 사이드, 서버 불필요

## 📦 설치 및 실행

### 로컬 개발 서버

```bash
# 프로젝트 디렉토리로 이동
cd angle-live-standalone

# 간단한 HTTP 서버 실행 (Python)
python3 -m http.server 8000

# 또는 Node.js http-server
npx http-server -p 8000

# 브라우저에서 열기
# http://localhost:8000
```

### 웹 서버 배포

#### Apache 설정

```apache
<VirtualHost *:80>
    ServerName anglelive.yourdomain.com
    DocumentRoot /var/www/angle-live-standalone

    <Directory /var/www/angle-live-standalone>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # Service Worker 캐시 헤더
        <FilesMatch "service-worker\.js$">
            Header set Cache-Control "no-cache, no-store, must-revalidate"
        </FilesMatch>

        # Manifest 파일
        <FilesMatch "manifest\.json$">
            Header set Content-Type "application/manifest+json"
        </FilesMatch>
    </Directory>

    # HTTPS 리다이렉트 (권장)
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]
</VirtualHost>
```

#### Nginx 설정

```nginx
server {
    listen 80;
    server_name anglelive.yourdomain.com;
    root /var/www/angle-live-standalone;
    index index.html;

    # Service Worker 캐시 방지
    location ~ service-worker\.js$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma no-cache;
        add_header Expires 0;
    }

    # Manifest
    location ~ manifest\.json$ {
        add_header Content-Type "application/manifest+json";
    }

    # SPA 폴백
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 정적 파일 캐싱
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📱 PWA 설치 방법

### Android
1. Chrome 브라우저에서 앱 접속
2. 주소창 오른쪽의 "설치" 버튼 클릭
3. 또는 화면 우측 상단의 "📱 앱 설치" 버튼 클릭
4. 홈 화면에 아이콘 추가됨

### iOS (Safari)
1. Safari에서 앱 접속
2. 공유 버튼 (□↑) 탭
3. "홈 화면에 추가" 선택
4. 이름 확인 후 "추가" 탭

### Desktop (Chrome/Edge)
1. 주소창 오른쪽의 "설치" 아이콘 클릭
2. 또는 우측 상단 "📱 앱 설치" 버튼 클릭
3. 독립 창으로 실행됨

## 🎮 사용 방법

### 기본 조작

**마우스/터치**
- 슬라이더를 드래그하여 각도 조절
- 버튼 클릭으로 기능 실행

**키보드 단축키**
- `←` `→`: 1도씩 조절
- `↑` `↓`: 10도씩 조절

### 데이터 관리

**내보내기 (Export)**
1. "📤 내보내기" 버튼 클릭
2. JSON 파일 자동 다운로드
3. 파일명: `angle-live-backup-YYYY-MM-DD.json`

**가져오기 (Import)**
1. "📥 가져오기" 버튼 클릭
2. 백업 JSON 파일 선택
3. 데이터 복원 완료 후 새로고침 권장

**통계 보기**
1. "📊 통계" 버튼 클릭
2. 세션 수, 발견한 각도, 최다 사용 각도 등 확인
3. 각도별 빈도 그래프 (향후 추가 예정)

**설정**
1. "⚙️ 설정" 버튼 클릭
2. 자동 저장, 격자 표시, 디버그 모드 설정

**데이터 삭제**
1. "🗑️ 삭제" 버튼 클릭
2. 확인 후 모든 로컬 데이터 삭제
3. **주의**: 되돌릴 수 없음!

## 🏗 프로젝트 구조

```
angle-live-standalone/
├── index.html              # 메인 HTML
├── manifest.json           # PWA Manifest
├── service-worker.js       # Service Worker (오프라인 캐싱)
├── css/
│   ├── style.css          # 메인 스타일
│   └── pwa-styles.css     # PWA 추가 스타일
├── js/
│   ├── config.js          # 설정 및 유틸리티
│   ├── db.js              # IndexedDB 관리
│   ├── storage.js         # 통합 저장소 관리
│   ├── angle-visualizer.js # Canvas 시각화
│   └── app.js             # 메인 앱 로직
├── assets/
│   └── icons/             # PWA 아이콘 (72x72 ~ 512x512)
└── docs/
    └── user-guide.md      # 사용자 가이드
```

## 💡 핵심 기능 설명

### IndexedDB 스키마

**sessions**: 각도 조작 세션 기록
```javascript
{
    id: 1,
    angle: 45.5,
    status: "중간 크기 예각",
    description: "중간 크기의 예각입니다.",
    timestamp: 1730000000000,
    date: "2025-11-18"
}
```

**progress**: 학습 진행 상황
```javascript
{
    id: "main",
    totalSessions: 150,
    anglesDiscovered: 120,
    uniqueAngles: [0, 1, 2, ..., 360],
    completionPercentage: 33.24,
    lastAngle: 90,
    updatedAt: 1730000000000
}
```

**angleHistory**: 각도 변경 히스토리
```javascript
{
    id: 1,
    angle: 90,
    status: "직각",
    description: "직각입니다!",
    color: "color-yellow",
    timestamp: 1730000000000
}
```

### Service Worker 캐싱 전략

**정적 자산**: 설치 시 사전 캐싱
- HTML, CSS, JavaScript
- Manifest, 아이콘

**동적 콘텐츠**: 캐시 우선 (Cache First)
- 캐시에 있으면 즉시 반환
- 없으면 네트워크 요청 후 캐싱

**오프라인 폴백**
- 네트워크 실패 시 캐시된 페이지 반환

## 🔒 데이터 보안

### 로컬 저장소만 사용
- 모든 데이터는 브라우저 로컬에만 저장
- 서버로 전송되는 데이터 없음
- 개인정보 보호 완벽

### 데이터 위치
- **IndexedDB**: `%APPDATA%/Browser/IndexedDB/` (Windows)
- **localStorage**: `%APPDATA%/Browser/Local Storage/` (Windows)
- 브라우저 데이터 삭제 시 함께 삭제됨

## 🐛 문제 해결

### Service Worker가 등록되지 않음
- **원인**: HTTPS 또는 localhost가 아님
- **해결**: HTTPS로 배포하거나 localhost에서 테스트

### 데이터가 저장되지 않음
- **원인**: IndexedDB 또는 localStorage 비활성화
- **해결**: 브라우저 설정에서 쿠키/저장소 허용

### 오프라인에서 동작하지 않음
- **원인**: Service Worker 미등록 또는 캐시 실패
- **해결**: 온라인 상태에서 최소 1회 접속 필요

### 앱이 느림
- **원인**: 대량의 세션 데이터
- **해결**: "🗑️ 삭제" 버튼으로 오래된 데이터 정리

## 📊 브라우저 호환성

| 브라우저 | 버전 | 지원 여부 |
|---------|------|---------|
| Chrome | 67+ | ✅ 완전 지원 |
| Firefox | 63+ | ✅ 완전 지원 |
| Safari | 11.1+ | ✅ 완전 지원 |
| Edge | 79+ | ✅ 완전 지원 |
| Opera | 54+ | ✅ 완전 지원 |
| IE11 | - | ❌ 미지원 |

**필요한 기능**
- Service Worker
- IndexedDB
- Canvas API
- ES6+ JavaScript

## 🚀 향후 계획

### v2.1 (예정)
- [ ] 각도별 빈도 차트 시각화
- [ ] 학습 목표 설정 기능
- [ ] 다크 모드 지원
- [ ] 다국어 지원 (영어, 일본어)

### v2.2 (예정)
- [ ] 게임 모드 추가
- [ ] 도전 과제 시스템
- [ ] 공유 기능 (스크린샷)
- [ ] 음성 피드백

### v3.0 (예정)
- [ ] P2P 동기화 (WebRTC)
- [ ] 클라우드 백업 (선택적)
- [ ] 선생님-학생 모드
- [ ] AI 피드백

## 🤝 기여

버그 리포트, 기능 제안, Pull Request 환영합니다!

## 📄 라이선스

Copyright © 2025 KAIST Touch Math Academy
All rights reserved.

---

**Version**: 2.0.0-standalone
**Last Updated**: 2025-11-18
**작성자**: KAIST Touch Math Academy Team

## 📞 지원

- **이슈**: GitHub Issues
- **문서**: `docs/` 디렉토리
- **이메일**: support@anglelive.app (가상)

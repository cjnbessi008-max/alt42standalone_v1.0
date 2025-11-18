# Moodle ASMR & Sound Effects Plugin

멘탈 안정을 위한 ASMR과 짧은 효과음을 Moodle LMS에 제공하는 플러그인입니다.

## 🎯 주요 기능

- **ASMR 사운드 라이브러리**: 자연, 앰비언트, 명상, 집중 사운드
- **효과음**: 성공, 알림, 피드백용 짧은 효과음
- **오디오 플레이어**: 재생, 일시정지, 볼륨 조절, 반복, 셔플
- **사용자 설정**: 개인별 볼륨, 즐겨찾기, 재생목록
- **활동 연동**: 퀴즈 제출, 과제 채점 시 자동 효과음
- **사용 분석**: 학생 웰빙 데이터 수집 및 리포트

## 📋 요구사항

- **Moodle**: 3.7+
- **PHP**: 7.1.9+
- **MySQL**: 5.7+
- **브라우저**: HTML5 Audio API 지원 (Chrome, Firefox, Safari 최신 버전)

## 🚀 설치 방법

### 1. 플러그인 다운로드 및 설치

```bash
# Moodle 디렉토리로 이동
cd /path/to/moodle

# 플러그인 복사
cp -r /path/to/moodle-plugin/local/asmr local/

# 권한 설정
chmod -R 755 local/asmr
chown -R www-data:www-data local/asmr
```

### 2. Moodle 관리자 페이지에서 설치

1. Moodle 관리자 계정으로 로그인
2. **사이트 관리 > 알림** 으로 이동
3. "플러그인 설치" 버튼 클릭
4. 데이터베이스 업그레이드 실행

### 3. 사운드 파일 디렉토리 생성

```bash
# moodledata 디렉토리에 사운드 저장 폴더 생성
mkdir -p /path/to/moodledata/asmr/sounds
chmod 777 /path/to/moodledata/asmr/sounds
```

### 4. 권한 설정

**사이트 관리 > 사용자 > 권한 > 역할 정의** 에서 다음 권한을 설정:

- `local/asmr:view` - 모든 사용자 (학생, 교사)
- `local/asmr:manage` - 교사, 관리자
- `local/asmr:upload` - 관리자만

## 📖 사용 방법

### 학생용

1. **ASMR 플레이어 접근**
   - 메뉴에서 "ASMR & 효과음" 클릭
   - 또는 URL: `https://your-moodle.com/local/asmr/`

2. **사운드 재생**
   - 카테고리에서 원하는 사운드 선택
   - 재생 버튼 클릭
   - 볼륨 조절, 반복 재생, 셔플 설정 가능

3. **즐겨찾기 관리**
   - 사운드 카드에서 ⭐ 아이콘 클릭
   - 즐겨찾기 섹션에서 빠른 접근

### 교사용

1. **사운드 업로드**
   - 관리 페이지로 이동: `/local/asmr/manage.php`
   - "새 사운드 업로드" 버튼 클릭
   - MP3, OGG, WAV, M4A 파일 업로드

2. **활동에 사운드 연결**
   - 코스 설정에서 "ASMR 설정" 탭 선택
   - 활동 선택 (퀴즈, 과제 등)
   - 트리거 이벤트 설정 (제출 시, 채점 시 등)
   - 재생할 사운드 선택

3. **사용 분석 확인**
   - 대시보드에서 학생별 청취 시간 확인
   - 인기 사운드 및 카테고리 분석
   - 웰빙 리포트 생성

## 🎵 사운드 카테고리 구조

```
ASMR (장시간 배경음)
├── 자연 (nature)
│   ├── 빗소리 (rain)
│   ├── 파도소리 (ocean)
│   ├── 숲소리 (forest)
│   └── 계곡물소리 (stream)
├── 앰비언트 (ambient)
│   ├── 카페 (cafe)
│   ├── 도서관 (library)
│   ├── 백색소음 (white_noise)
│   └── 핑크노이즈 (pink_noise)
├── 명상 (meditation)
│   ├── 싱잉볼 (singing_bowl)
│   ├── 차임벨 (chimes)
│   └── 호흡가이드 (breathing)
└── 집중 (focus)
    ├── 로파이 (lo-fi)
    ├── 클래식 (classical)
    └── 바이노럴 비트 (binaural)

효과음 (짧은 피드백)
├── 성공 (success)
├── 알림 (notification)
├── 상호작용 (interaction)
└── 피드백 (feedback)
```

## 🔧 설정

### 관리자 설정

**사이트 관리 > 플러그인 > 로컬 플러그인 > ASMR & 효과음**

- **최대 파일 크기**: 기본 50MB
- **허용 파일 형식**: MP3, OGG, WAV, M4A
- **자동 재생 활성화**: 기본값 비활성화
- **사용 로그 보관 기간**: 기본 6개월

### 사용자 설정

- **볼륨**: 0-100%
- **자동 재생**: 페이지 로드 시 자동 재생
- **반복 재생**: 사운드 반복
- **셔플**: 랜덤 재생

## 🔌 API 엔드포인트

### GET /local/asmr/ajax/get_sounds.php
사운드 목록 조회

**Parameters:**
- `category` (optional): 'asmr' or 'effect'
- `subcategory` (optional): 세부 카테고리
- `limit` (optional): 결과 제한 (기본 50)

### POST /local/asmr/ajax/save_preference.php
사용자 설정 저장

**Parameters:**
- `key`: 설정 키 (volume, auto_play, favorites)
- `value`: 설정 값

### POST /local/asmr/ajax/log_usage.php
사용 로그 기록

**Parameters:**
- `soundid`: 사운드 ID
- `action`: 'play', 'pause', 'stop', 'complete'
- `duration`: 청취 시간 (초)

## 📊 데이터베이스 구조

- `mdl_asmr_sounds` - 사운드 라이브러리
- `mdl_asmr_user_prefs` - 사용자 설정
- `mdl_asmr_activity_sounds` - 활동-사운드 연결
- `mdl_asmr_usage_log` - 사용 로그
- `mdl_asmr_playlists` - 재생목록

상세 스키마는 `db/install.xml` 참조

## 🐛 문제 해결

### 사운드가 재생되지 않을 때

1. 브라우저 콘솔에서 오류 확인
2. 파일 경로 권한 확인 (`chmod 755`)
3. 파일 형식이 지원되는지 확인 (MP3, OGG, WAV)

### 업로드가 실패할 때

1. PHP `upload_max_filesize` 확인 (php.ini)
2. Moodle `maxbytes` 설정 확인
3. moodledata 디렉토리 권한 확인 (`chmod 777`)

### 데이터베이스 오류

```bash
# Moodle 캐시 클리어
php admin/cli/purge_caches.php

# 데이터베이스 업그레이드 강제 실행
php admin/cli/upgrade.php
```

## 🔐 보안

- 모든 파일 업로드는 MIME 타입 검증
- XSS 방지를 위한 입력 값 sanitization
- SQL 인젝션 방지 (Moodle DML 사용)
- CSRF 토큰 검증 (sesskey)
- 권한 기반 접근 제어

## 📄 라이선스

GPL v3 or later (Moodle 플러그인 요구사항)

## 👨‍💻 개발자

KAIST Touch Math Academy - 2025

## 📞 지원

- **이슈 리포트**: GitHub Issues
- **문서**: `/docs/moodle-asmr-integration-design.md`
- **이메일**: support@example.com

## 🔄 업데이트 내역

### v1.0.0 (2025-01-18)
- 초기 릴리즈
- ASMR 사운드 플레이어
- 사용자 설정 관리
- 활동 연동
- 사용 분석

## 🚧 향후 계획

- [ ] 모바일 앱 지원
- [ ] 재생목록 공유 기능
- [ ] AI 기반 사운드 추천
- [ ] 바이노럴 비트 생성기
- [ ] 음성 가이드 명상
- [ ] 실시간 협업 청취
- [ ] 커뮤니티 사운드 마켓플레이스

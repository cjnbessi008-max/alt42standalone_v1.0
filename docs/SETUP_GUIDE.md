# Geo Spiral 설치 가이드

이 문서는 Geo Spiral을 처음부터 설치하고 설정하는 방법을 단계별로 설명합니다.

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [개발 환경 설치](#개발-환경-설치)
3. [Moodle 설치 및 설정](#moodle-설치-및-설정)
4. [Geo Spiral 플러그인 설치](#geo-spiral-플러그인-설치)
5. [프론트엔드 빌드 및 배포](#프론트엔드-빌드-및-배포)
6. [검증 및 테스트](#검증-및-테스트)

---

## 시스템 요구사항

### 하드웨어
- **CPU**: 2코어 이상
- **RAM**: 4GB 이상 (권장 8GB)
- **디스크**: 10GB 이상 여유 공간

### 소프트웨어
- **Docker**: 20.10 이상
- **Docker Compose**: 1.29 이상
- **Git**: 2.0 이상
- **Node.js**: 16 이상 (프론트엔드 빌드용)

### 지원 운영체제
- Linux (Ubuntu 20.04+, CentOS 8+)
- macOS (10.15+)
- Windows 10/11 (WSL2 사용)

---

## 개발 환경 설치

### 1. Docker 설치

#### Ubuntu/Debian
```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 설치 확인
docker --version
docker-compose --version
```

#### macOS
```bash
# Homebrew로 설치
brew install --cask docker

# Docker Desktop 실행 후
docker --version
docker-compose --version
```

### 2. 프로젝트 클론

```bash
git clone https://github.com/your-org/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### 3. 환경 변수 설정

```bash
# 루트 디렉토리
cp .env.example .env

# 프론트엔드
cp src/frontend/.env.example src/frontend/.env
```

`.env` 파일 편집:
```bash
nano .env
```

필수 설정:
- `DB_PASSWORD`: 안전한 비밀번호로 변경
- `MOODLE_URL`: 실제 도메인으로 변경 (프로덕션)

---

## Moodle 설치 및 설정

### 1. Docker 컨테이너 시작

```bash
docker-compose up -d
```

컨테이너 상태 확인:
```bash
docker-compose ps
```

모든 컨테이너가 `Up` 상태여야 합니다.

### 2. Moodle 초기 설정

브라우저에서 `http://localhost:8081` 접속

#### 설치 단계:
1. **언어 선택**: 한국어 또는 English
2. **데이터베이스 설정**:
   - 유형: `mysqli` (MySQL)
   - 호스트: `mysql`
   - 데이터베이스: `moodle_geospiral`
   - 사용자: `moodle`
   - 비밀번호: `moodle123` (또는 .env에서 설정한 값)
3. **관리자 계정 생성**:
   - 사용자명: `admin`
   - 비밀번호: (안전한 비밀번호)
   - 이메일: 유효한 이메일
4. **사이트 정보 입력**

### 3. Moodle 기본 설정

**관리 > 사이트 관리 > 플러그인 > 블록 관리**
- 블록 추가/제거 권한 확인

---

## Geo Spiral 플러그인 설치

### 1. 플러그인 파일 복사

```bash
# Moodle 컨테이너에 플러그인 복사
docker cp src/moodle-plugin/. geospiral_moodle:/var/www/html/blocks/geospiral/

# 권한 설정
docker exec geospiral_moodle chown -R www-data:www-data /var/www/html/blocks/geospiral
```

### 2. Moodle에서 플러그인 설치

1. Moodle 관리자로 로그인
2. **사이트 관리 > 알림**으로 이동
3. "Geo Spiral" 플러그인이 감지되면 **업그레이드** 클릭
4. 설치 완료 확인

### 3. 데이터베이스 테이블 확인

```bash
docker exec -it geospiral_mysql mysql -u moodle -pmoodle123 moodle_geospiral

# MySQL 쉘에서
SHOW TABLES LIKE 'mdl_geospiral%';
```

다음 테이블들이 보여야 합니다:
- `mdl_geospiral_sequences`
- `mdl_geospiral_progress`
- `mdl_geospiral_interactions`
- `mdl_geospiral_config`

### 4. 샘플 데이터 확인

```sql
SELECT * FROM mdl_geospiral_sequences;
```

4개의 샘플 수열이 있어야 합니다.

---

## 프론트엔드 빌드 및 배포

### 1. 의존성 설치

```bash
cd src/frontend
npm install
```

### 2. 개발 모드 실행

```bash
# Mock 데이터 사용
npm start
```

브라우저에서 `http://localhost:3000` 접속하여 확인

### 3. 프로덕션 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 파일을 Moodle 플러그인에 복사
cp -r build/* ../moodle-plugin/frontend/

# Docker 컨테이너에 복사
docker cp ../moodle-plugin/frontend/. geospiral_moodle:/var/www/html/blocks/geospiral/frontend/
```

### 4. API 연동 확인

프론트엔드 `.env` 수정:
```bash
REACT_APP_USE_MOCK=false
REACT_APP_API_URL=http://localhost:8081/blocks/geospiral
```

빌드 후 재배포.

---

## 검증 및 테스트

### 1. 블록 추가

1. Moodle 코스 생성
2. 코스 페이지에서 **블록 추가** > **Geo Spiral**
3. 블록이 표시되는지 확인

### 2. 기능 테스트

#### 수열 목록 조회
```bash
curl "http://localhost:8081/blocks/geospiral/api.php?action=get_sequences&courseid=1"
```

예상 결과: JSON 형식의 수열 목록

#### 프론트엔드 접속
1. Geo Spiral 블록에서 **"Geo Spiral 시작"** 클릭
2. 수열 선택
3. 가상 스마트폰 화면에 나선 표시 확인
4. 애니메이션, 확대/축소, 회전 테스트

### 3. 로그 확인

```bash
# PHP 에러 로그
docker logs geospiral_php

# Moodle 로그
docker logs geospiral_moodle

# MySQL 로그
docker logs geospiral_mysql

# 프론트엔드 로그
docker logs geospiral_frontend
```

---

## 문제 해결

### 데이터베이스 연결 실패

**증상**: "Database connection failed" 오류

**해결**:
```bash
# MySQL 컨테이너 상태 확인
docker-compose ps mysql

# MySQL 로그 확인
docker logs geospiral_mysql

# 컨테이너 재시작
docker-compose restart mysql
```

### Moodle 플러그인이 감지되지 않음

**해결**:
```bash
# 권한 확인 및 수정
docker exec geospiral_moodle chown -R www-data:www-data /var/www/html/blocks/geospiral

# Moodle 캐시 삭제
docker exec geospiral_moodle rm -rf /var/www/moodledata/cache/*

# 컨테이너 재시작
docker-compose restart moodle
```

### 프론트엔드가 표시되지 않음

**해결**:
```bash
# Node 모듈 재설치
cd src/frontend
rm -rf node_modules package-lock.json
npm install

# 개발 서버 재시작
npm start
```

### API 연동 오류

**해결**:
1. 브라우저 개발자 도구 > 콘솔 확인
2. CORS 에러인 경우:
   - Moodle `config.php`에 CORS 헤더 추가
   - 또는 개발 중에는 `REACT_APP_USE_MOCK=true` 사용

---

## 프로덕션 배포

### 1. 환경 변수 업데이트

`.env` 파일:
```bash
APP_ENV=production
APP_DEBUG=false
MOODLE_URL=https://yourdomain.com/moodle
```

### 2. HTTPS 설정

Nginx 또는 Apache에 SSL 인증서 설치 (Let's Encrypt 권장)

### 3. 보안 강화

- 데이터베이스 비밀번호 변경
- Moodle 관리자 비밀번호 강화
- 방화벽 설정
- 백업 자동화 설정

### 4. 성능 최적화

- PHP OpCache 활성화
- Moodle 캐싱 활성화
- CDN 설정 (선택사항)

---

## 다음 단계

- [사용자 가이드](./USER_GUIDE.md)
- [개발자 가이드](./DEVELOPER_GUIDE.md)
- [API 문서](./API_DOCUMENTATION.md)

---

설치 중 문제가 발생하면 GitHub Issues를 통해 문의해주세요.

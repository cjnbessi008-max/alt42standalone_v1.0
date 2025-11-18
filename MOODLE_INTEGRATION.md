# Moodle 3.7 LMS 연동 가이드

이 문서는 Mental Stamina 측정 시스템을 Moodle 3.7 LMS와 연동하는 방법을 설명합니다.

## 시스템 요구사항

- **Moodle**: 3.7
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Mental Stamina API**: Node.js 백엔드 실행 중

## LTI 연동 방식

Mental Stamina 시스템은 **LTI (Learning Tools Interoperability)** 표준을 사용하여 Moodle과 통합됩니다.

### LTI의 장점
- ✅ 표준 프로토콜로 안전한 연동
- ✅ 자동 사용자 인증 (SSO)
- ✅ 성적 자동 동기화
- ✅ Moodle 코어 수정 불필요

## 1단계: Mental Stamina API 서버 설정

### 1.1 서버 실행

```bash
# Docker Compose 사용
cd mental-stamina-lms
docker-compose up -d

# 또는 직접 실행
cd backend
npm install
npm start
```

### 1.2 환경 변수 확인

`backend/.env` 파일에서 다음 설정을 확인하세요:

```env
# LTI 설정
LTI_KEY=mental-stamina-key
LTI_SECRET=your_secure_secret_here
API_URL=http://your-server-domain:3001
FRONTEND_URL=http://your-frontend-domain:3000

# Moodle URL
MOODLE_URL=https://your-moodle-site.com
```

⚠️ **중요**: `LTI_SECRET`은 강력한 랜덤 문자열로 설정하세요!

```bash
# 랜덤 시크릿 생성 (Linux/Mac)
openssl rand -base64 32
```

## 2단계: Moodle에서 External Tool 설정

### 2.1 관리자 권한으로 Moodle 접속

### 2.2 External Tool 플러그인 활성화

1. **사이트 관리** > **플러그인** > **활동 모듈** > **External tool** 이동
2. "도구 관리" 클릭

### 2.3 새 External Tool 추가

"도구 수동 구성" 버튼을 클릭하고 다음 정보를 입력하세요:

#### 기본 설정

| 필드 | 값 |
|------|-----|
| **도구 이름** | Mental Stamina - 사고 체력 측정 |
| **도구 URL** | `http://your-api-server:3001/lti/launch` |
| **도구 설명** | 학생들의 사고 체력을 실시간으로 측정하고 분석합니다 |
| **도구 구성 사용** | LTI 1.1 |

#### 소비자 키 및 비밀

| 필드 | 값 |
|------|-----|
| **소비자 키 (Consumer Key)** | `mental-stamina-key` |
| **공유 비밀 (Shared Secret)** | `.env`에 설정한 `LTI_SECRET` 값 |

#### 개인정보 설정

다음 항목을 **모두 체크**하세요:
- ✅ 실행자 이름을 도구와 공유
- ✅ 실행자 이메일을 도구와 공유
- ✅ 이름을 도구에 전달 수락

#### 서비스 설정

- ✅ IMS LTI Assignment and Grade Services (성적 동기화 활성화)

### 2.4 저장

"변경 사항 저장" 클릭

## 3단계: 코스에 Mental Stamina 도구 추가

### 3.1 코스 편집 모드 활성화

1. 원하는 Moodle 코스로 이동
2. 우측 상단의 **편집 모드 켜기** 클릭

### 3.2 활동 추가

1. 원하는 섹션에서 **활동 또는 리소스 추가** 클릭
2. **External tool** 선택
3. **추가** 클릭

### 3.3 External Tool 설정

#### 일반 설정

| 필드 | 값 |
|------|-----|
| **활동 이름** | 사고 체력 측정 테스트 |
| **사전 구성된 도구** | "Mental Stamina - 사고 체력 측정" 선택 |

#### 성적 설정 (선택사항)

| 필드 | 값 |
|------|-----|
| **성적 유형** | 점수 (최대 100점) |
| **최대 점수** | 100 |

### 3.4 저장 및 표시

"저장하고 코스로 돌아가기" 클릭

## 4단계: 테스트

### 4.1 학생으로 테스트

1. 학생 계정으로 로그인
2. Mental Stamina 활동 클릭
3. 자동으로 Mental Stamina 웹앱으로 리다이렉트됨
4. 문제 풀이 시작

### 4.2 교사로 테스트

1. 교사 계정으로 로그인
2. Mental Stamina 활동 클릭
3. 교사 대시보드로 리다이렉트됨
4. 학생들의 사고 체력 데이터 확인

## 5단계: 성적 동기화 확인

Mental Stamina에서 학습 세션을 완료하면:

1. 사고 체력 점수가 자동으로 계산됨
2. LTI Grade Passback을 통해 Moodle 성적부로 전송
3. Moodle 성적부에서 확인 가능

### 성적 확인 방법

1. 코스 > **성적** 클릭
2. "사고 체력 측정 테스트" 열에서 학생 성적 확인

## 고급 설정

### Custom Parameters (선택사항)

특정 설정을 전달하려면 Custom Parameters를 사용할 수 있습니다:

```
difficulty_level=2
max_questions=20
show_feedback=true
```

### Deep Linking (향후 지원 예정)

LTI 1.3 Deep Linking을 사용하면:
- 코스 콘텐츠를 더 쉽게 추가
- 다양한 문제 세트 선택 가능

## 문제 해결

### 1. "도구 실행 실패" 오류

**원인**: LTI 인증 실패

**해결책**:
- Moodle의 Consumer Key가 백엔드 `.env`의 `LTI_KEY`와 일치하는지 확인
- Shared Secret이 `.env`의 `LTI_SECRET`과 일치하는지 확인
- API 서버가 실행 중인지 확인: `curl http://your-server:3001/health`

### 2. "CORS 오류" 발생

**원인**: Cross-Origin 정책 위반

**해결책**:
```env
# backend/.env
CORS_ORIGIN=https://your-moodle-site.com
```

### 3. 성적이 Moodle로 전송되지 않음

**원인**: Grade Passback 설정 오류

**해결책**:
- Moodle External Tool 설정에서 "IMS LTI Assignment and Grade Services" 활성화 확인
- 백엔드 로그 확인: `docker-compose logs backend`
- `grade_passbacks` 테이블에서 상태 확인:
  ```sql
  SELECT * FROM grade_passbacks WHERE passback_status = 'failed';
  ```

### 4. SSL/HTTPS 관련 오류

**원인**: Moodle이 HTTPS를 사용하는데 API가 HTTP

**해결책**:
- API 서버에 SSL 인증서 설정 (Let's Encrypt 권장)
- Nginx 또는 Apache를 리버스 프록시로 사용

## 보안 권장사항

### 1. HTTPS 사용

프로덕션 환경에서는 반드시 HTTPS를 사용하세요:
```bash
# Nginx 설정 예시
server {
    listen 443 ssl;
    server_name your-api-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
    }
}
```

### 2. 강력한 LTI Secret

```bash
# 최소 32자 이상의 랜덤 문자열
LTI_SECRET=$(openssl rand -base64 32)
```

### 3. 방화벽 설정

API 서버는 Moodle 서버에서만 접근 가능하도록 설정:
```bash
# iptables 예시
iptables -A INPUT -p tcp --dport 3001 -s moodle-server-ip -j ACCEPT
iptables -A INPUT -p tcp --dport 3001 -j DROP
```

## 데이터 프라이버시

### GDPR/개인정보보호법 준수

1. **데이터 수집 동의**
   - Moodle 코스 설명에 데이터 수집 내용 명시
   - 학생들에게 사전 동의 받기

2. **수집되는 데이터**
   - 이름, 이메일 (Moodle에서 전달)
   - 문제 풀이 시간
   - 정답/오답 여부
   - 클릭/키보드 입력 패턴
   - 포커스 손실 빈도

3. **데이터 보관 정책**
   - 데이터베이스에서 주기적으로 오래된 데이터 삭제
   - 예: 1년 이상 된 세션 데이터 아카이빙

## 성능 최적화

### 대규모 코스 (100명 이상)

1. **Database Connection Pooling**
   ```javascript
   // backend/src/config/database.js
   max: 50,  // 최대 연결 수 증가
   ```

2. **Redis 캐싱 추가** (선택사항)
   ```bash
   # docker-compose.yml에 Redis 추가
   redis:
     image: redis:7-alpine
     ports:
       - "6379:6379"
   ```

3. **CDN 사용**
   - 프론트엔드 정적 파일을 CDN에서 제공

## 모니터링

### 1. API 서버 상태 확인

```bash
curl http://your-server:3001/health
```

응답:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. 로그 확인

```bash
# Docker Compose 사용 시
docker-compose logs -f backend

# 직접 실행 시
tail -f backend/logs/combined.log
```

## 지원

문제가 발생하면:
1. 이 가이드의 "문제 해결" 섹션 확인
2. GitHub Issues에 문제 등록
3. 이메일: support@your-domain.com

---

**참고 문서**:
- [IMS LTI 1.1 Specification](https://www.imsglobal.org/specs/ltiv1p1)
- [Moodle External Tool Documentation](https://docs.moodle.org/37/en/External_tool)

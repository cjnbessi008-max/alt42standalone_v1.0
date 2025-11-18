# Moodle 3.7 LTI 연동 상세 가이드

## 📚 Moodle 3.7 + PHP 7.1.9 + MySQL 5.7 환경

이 가이드는 Moodle 3.7 환경에서 Composition Puzzle 앱을 LTI 1.1로 연동하는 상세 절차를 설명합니다.

---

## 🔧 1단계: Composition Puzzle 서버 준비

### 서버 요구사항

- Node.js 18+
- MySQL 5.7
- 공개적으로 접근 가능한 URL (Moodle이 접근할 수 있어야 함)

### 서버 설정

```bash
# 프로젝트 디렉토리로 이동
cd alt42standalone_v1.0

# 백엔드 의존성 설치
cd backend
npm install

# 환경 변수 설정
cp .env.example .env
nano .env
```

`.env` 파일 수정:

```env
PORT=3000
NODE_ENV=production

# MySQL 설정 (Moodle과 같은 서버 또는 별도 서버)
DB_HOST=localhost
DB_PORT=3306
DB_USER=puzzle_user
DB_PASSWORD=secure_password
DB_NAME=composition_puzzle

# LTI 설정 - 중요!
LTI_KEY=composition_puzzle_key
LTI_SECRET=moodle_shared_secret_12345

# Moodle URL
MOODLE_URL=http://your-moodle-domain.com

# 프론트엔드 URL (Moodle이 리다이렉트할 주소)
FRONTEND_URL=http://your-app-domain.com

# CORS 설정
ALLOWED_ORIGINS=http://your-moodle-domain.com,http://your-app-domain.com
```

### 데이터베이스 초기화

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 및 사용자 생성
CREATE DATABASE composition_puzzle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'puzzle_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON composition_puzzle.* TO 'puzzle_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 스키마 적용
cd ../database
mysql -u puzzle_user -p composition_puzzle < schema.sql
```

### 서버 실행

```bash
cd ../backend
npm run build
npm start

# 또는 PM2 사용 (권장)
npm install -g pm2
pm2 start dist/index.js --name composition-puzzle
pm2 save
pm2 startup
```

### LTI 연동 테스트

브라우저에서 확인:

- Health Check: `http://your-server:3000/health`
- LTI Config: `http://your-server:3000/lti/config.xml`

---

## 🎓 2단계: Moodle 관리자 설정

### A. 외부 도구 활성화 확인

1. **Moodle 관리자로 로그인**

2. **사이트 관리 → 플러그인 → 활동 모듈 → 활동 모듈 관리**

3. **외부 도구 (External Tool)** 가 활성화되어 있는지 확인
   - 눈 아이콘이 열려있어야 함

### B. 외부 도구 등록

#### 방법 1: 수동 설정 (권장)

1. **사이트 관리 → 플러그인 → 활동 모듈 → 외부 도구 → 도구 관리**

2. **외부 도구 구성** 클릭

3. 다음 정보 입력:

   | 필드 | 값 |
   |------|-----|
   | **도구 이름** | Composition Puzzle |
   | **도구 기본 URL** | `http://your-server:3000/lti/launch` |
   | **보안 통신** | 론치 URL 일치 |
   | **소비자 키** | `composition_puzzle_key` |
   | **공유 비밀** | `moodle_shared_secret_12345` |
   | **커스텀 파라미터** | (비워둠 또는 아래 참조) |

4. **개인정보 보호** 섹션:
   - ✅ **론치 컨테이너 ID 공유**
   - ✅ **론처의 ID 공유**
   - ✅ **론처의 이름 공유**
   - ✅ **론처의 이메일 공유**

5. **서비스** 섹션:
   - ✅ **IMS LTI Assignment and Grade Services** (성적 보고용)
   - ✅ **성적 공유** 활성화

6. **기타 설정**:
   - **아이콘 URL**: (선택사항) `http://your-server:3000/icon.png`
   - **보안 아이콘 URL**: (선택사항)

7. **변경사항 저장**

#### 방법 2: 자동 설정 (Moodle 3.7+ 지원)

1. **사이트 관리 → 플러그인 → 활동 모듈 → 외부 도구 → 도구 관리**

2. **URL에서 자동으로 구성** 클릭

3. 다음 입력:
   - **도구 URL**: `http://your-server:3000/lti/config.xml`
   - **소비자 키**: `composition_puzzle_key`
   - **공유 비밀**: `moodle_shared_secret_12345`

4. **도구 이름 확인** 후 **저장**

### C. 커스텀 파라미터 설정 (선택사항)

특정 문제를 지정하려면 커스텀 파라미터를 추가:

```
problem_id=1
```

여러 파라미터:

```
problem_id=1
difficulty=hard
```

---

## 📝 3단계: 과정에 활동 추가

### A. 외부 도구 활동 생성

1. **원하는 과정 선택**

2. **편집 모드 켜기** (우측 상단 톱니바퀴 → 편집 모드 켜기)

3. 원하는 섹션에서 **활동 또는 리소스 추가** 클릭

4. **외부 도구** 선택 → **추가**

### B. 활동 설정

1. **일반** 섹션:
   - **활동 이름**: `합성함수 퍼즐 - 기초`
   - **사전 구성된 도구**: `Composition Puzzle` 선택

2. **개인정보 보호** (이미 설정되어 있음):
   - ID 공유, 이름 공유, 이메일 공유 확인

3. **성적** 섹션:
   - **유형**: 점수
   - **최대 성적**: `100`
   - **성적 통과하기**: `60` (선택사항)

4. **커스텀 파라미터** (선택사항):
   ```
   problem_id=1
   ```

5. **저장 후 표시** 또는 **저장 후 과정으로 돌아가기**

---

## 🧪 4단계: 연동 테스트

### A. 학생 계정으로 테스트

1. **학생 계정으로 로그인** (또는 새 브라우저/시크릿 모드 사용)

2. **과정 → 추가한 활동** 클릭

3. **확인사항**:
   - ✅ Composition Puzzle 앱이 로드됨
   - ✅ 학생 이름이 표시됨
   - ✅ 문제가 올바르게 표시됨
   - ✅ 우측 하단에 스마트폰 시뮬레이터가 표시됨

4. **문제 풀이 테스트**:
   - 함수 블록 드래그 앤 드롭
   - 합성함수 조립
   - 계산 테스트
   - 답안 제출

### B. 성적 보고 확인

1. **교사 계정으로 로그인**

2. **과정 → 성적** 클릭

3. **확인사항**:
   - ✅ 학생의 제출 기록이 있음
   - ✅ 점수가 자동으로 기록됨 (0~100점)
   - ✅ 제출 시간이 표시됨

---

## 🔍 5단계: 문제 해결

### LTI 론치 실패

**증상**: "Invalid LTI request" 또는 "Forbidden" 오류

**원인 및 해결**:

1. **소비자 키/시크릿 불일치**
   ```bash
   # Moodle 설정 확인
   # 백엔드 .env 확인
   cat backend/.env | grep LTI_
   ```

2. **서버 시간 불일치** (OAuth 타임스탬프 검증 실패)
   ```bash
   # 서버 시간 확인
   date

   # NTP 동기화
   sudo apt install ntp
   sudo systemctl start ntp
   sudo ntpdate -s time.nist.gov
   ```

3. **URL 불일치**
   - Moodle 설정: `http://server:3000/lti/launch`
   - 실제 서버: 동일한 URL인지 확인
   - http vs https 확인

### 성적 보고 안됨

**증상**: 문제는 풀리지만 Moodle 성적부에 기록 안됨

**해결**:

1. **Moodle에서 성적 공유 활성화 확인**
   - 외부 도구 설정 → 서비스 → IMS LTI Assignment and Grade Services

2. **백엔드 로그 확인**
   ```bash
   pm2 logs composition-puzzle
   # 또는
   docker-compose logs backend
   ```

3. **LTI Outcome Service URL 확인**
   - 백엔드 로그에 `lis_outcome_service_url` 있는지 확인
   - 없으면 Moodle 설정에서 성적 공유 활성화

### 스마트폰 시뮬레이터 안보임

**증상**: 우측 하단에 스마트폰 화면이 안보임

**해결**:

1. **브라우저 콘솔 확인** (F12)
   - JavaScript 오류 있는지 확인

2. **화면 크기 확인**
   - 스마트폰 시뮬레이터는 최소 1200px 너비에서 보임
   - 브라우저 확대/축소 확인

3. **CSS 로딩 확인**
   - 네트워크 탭에서 CSS 파일 로딩 확인

### CORS 오류

**증상**: 브라우저 콘솔에 CORS 에러

**해결**:

```bash
# backend/.env 수정
ALLOWED_ORIGINS=http://your-moodle-domain.com,http://your-app-domain.com

# 서버 재시작
pm2 restart composition-puzzle
```

---

## 📊 6단계: 고급 설정

### 여러 문제 만들기

각 문제별로 별도의 외부 도구 활동을 만들되, 커스텀 파라미터로 구분:

**활동 1: 기초 문제**
```
problem_id=1
```

**활동 2: 중급 문제**
```
problem_id=2
```

**활동 3: 고급 문제**
```
problem_id=3
```

### API로 문제 추가

```bash
# 새 문제 추가
curl -X POST http://localhost:3000/api/problems \
  -H "Content-Type: application/json" \
  -d '{
    "title": "역함수 합성",
    "description": "역함수를 포함한 합성함수를 만드세요",
    "availableFunctions": ["f1", "g1", "m1"],
    "targetComposition": "custom",
    "testCases": [
      {"input": 1, "expectedOutput": 2},
      {"input": 2, "expectedOutput": 4}
    ],
    "maxAttempts": 10,
    "timeLimit": 600
  }'
```

### 통계 확인

```bash
# 문제별 통계
curl http://localhost:3000/api/statistics?problemId=1

# 학생별 통계
curl http://localhost:3000/api/statistics?studentId=student123
```

---

## 🔐 보안 고려사항

### 1. HTTPS 사용 (프로덕션 필수)

```bash
# Let's Encrypt 인증서 설치
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# nginx에서 SSL 설정
# (SETUP.md 참조)
```

### 2. 방화벽 설정

```bash
# UFW 설정 (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Backend (내부 네트워크만)
sudo ufw enable
```

### 3. 데이터베이스 보안

```sql
-- 원격 접근 제한
CREATE USER 'puzzle_user'@'localhost' IDENTIFIED BY 'strong_password';

-- 최소 권한 부여
GRANT SELECT, INSERT, UPDATE ON composition_puzzle.* TO 'puzzle_user'@'localhost';
```

---

## 📞 지원

문제가 계속되면:

1. **로그 확인**
   ```bash
   # 백엔드 로그
   pm2 logs composition-puzzle

   # Moodle 로그
   # Moodle → 사이트 관리 → 보고서 → 로그
   ```

2. **GitHub Issues**: <repository-url>/issues

3. **Moodle 커뮤니티**: https://moodle.org/mod/forum/

---

## 📚 참고 자료

- [Moodle 3.7 문서](https://docs.moodle.org/37/en/)
- [IMS LTI 1.1 스펙](http://www.imsglobal.org/specs/ltiv1p1)
- [외부 도구 설정 가이드](https://docs.moodle.org/37/en/External_tool_settings)

# 인지 부하 팁 플러그인 설치 가이드

## Moodle 3.7 + MySQL 5.7 + PHP 7.1.9 환경 설치

### 사전 준비사항

1. **서버 접속 권한** (SSH 또는 FTP)
2. **Moodle 관리자 계정**
3. **웹 서버 재시작 권한** (선택사항)

---

## 📦 1단계: 파일 업로드

### SSH 사용 시

```bash
# Moodle 디렉토리로 이동
cd /var/www/html/moodle  # 또는 실제 Moodle 경로

# 플러그인 디렉토리 복사
cp -r /path/to/moodle_plugin/local/cognitiveloadtips ./local/

# 권한 설정
chown -R www-data:www-data ./local/cognitiveloadtips
chmod -R 755 ./local/cognitiveloadtips
```

### FTP 사용 시

1. FTP 클라이언트 (FileZilla 등) 실행
2. `moodle_plugin/local/cognitiveloadtips` 폴더를
3. `moodle/local/` 디렉토리에 업로드

---

## 🔧 2단계: 데이터베이스 업그레이드

### 웹 인터페이스에서

1. 브라우저에서 Moodle 사이트 접속
2. 관리자로 로그인
3. **자동으로 리다이렉트**되어 플러그인 설치 페이지 표시
4. "데이터베이스 업그레이드" 또는 "Continue" 버튼 클릭

**또는 수동으로:**
```
사이트 주소/admin/index.php
```
접속하여 업그레이드 실행

### CLI에서 (고급 사용자용)

```bash
cd /var/www/html/moodle
sudo -u www-data php admin/cli/upgrade.php
```

---

## ✅ 3단계: 설치 확인

### 플러그인 설치 확인

```
사이트 관리 → 플러그인 → 플러그인 개요
→ "로컬 플러그인" 섹션에서 "Cognitive Load Tips" 찾기
```

### 테이블 생성 확인 (MySQL)

```sql
mysql -u root -p moodle_db

USE moodle_db;  -- 실제 DB 이름으로 변경

SHOW TABLES LIKE 'mdl_local_clt_%';

-- 다음 4개 테이블이 표시되어야 함:
-- mdl_local_clt_tips
-- mdl_local_clt_question_difficulty
-- mdl_local_clt_user_interactions
-- mdl_local_clt_quiz_settings
```

### 기본 팁 생성 확인

```sql
SELECT COUNT(*) FROM mdl_local_clt_tips;
-- 결과: 14 (한국어 7개 + 영어 7개)

SELECT title, language FROM mdl_local_clt_tips;
```

---

## 🎯 4단계: 퀴즈 설정

### 기존 퀴즈에 적용

1. **코스로 이동** → 퀴즈 선택
2. ⚙️ **설정** 클릭
3. 아래로 스크롤하여 **"인지 부하 최소화 팁"** 섹션 찾기
4. 다음 설정:

```
☑ 인지 부하 팁 사용
```

**난이도 기준**: 어려움 (★★★★☆) 이상
- → 난이도 4, 5인 문제에만 팁 표시

**무작위 팁**: ☑ 체크
- → 여러 팁 중 하나만 랜덤 표시

**학생이 건너뛰기 허용**: ☑ 체크
- → 학생이 원하면 팁 건너뛰기 가능

5. **저장** 클릭

---

## 🎚️ 5단계: 문제 난이도 설정

### 방법 A: 수동 설정 (권장)

1. **문제 은행** 접속
2. 문제 편집 (✏️ 아이콘 클릭)
3. **"난이도"** 필드 찾기
4. 1-5 중 선택:
   - ★☆☆☆☆ (1) = 매우 쉬움
   - ★★☆☆☆ (2) = 쉬움
   - ★★★☆☆ (3) = 보통
   - ★★★★☆ (4) = 어려움
   - ★★★★★ (5) = 매우 어려움
5. 저장

### 방법 B: SQL로 일괄 설정

```sql
-- 모든 문제를 보통(3)으로 설정
INSERT INTO mdl_local_clt_question_difficulty
(questionid, difficulty_level, auto_calculated, timecreated, timemodified)
SELECT id, 3, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdl_question
ON DUPLICATE KEY UPDATE difficulty_level = 3;

-- 특정 퀴즈의 문제를 어려움(4)으로 설정
INSERT INTO mdl_local_clt_question_difficulty
(questionid, difficulty_level, auto_calculated, timecreated, timemodified)
SELECT q.id, 4, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
FROM mdl_question q
JOIN mdl_quiz_slots qs ON qs.questionid = q.id
WHERE qs.quizid = 123  -- 실제 퀴즈 ID로 변경
ON DUPLICATE KEY UPDATE difficulty_level = 4;
```

---

## 🧪 6단계: 테스트

### 학생 계정으로 테스트

1. **학생 계정으로 로그인** (또는 역할 전환)
2. 퀴즈 시작
3. 고난도 문제 전에 **팁 표시 확인**

예상 화면:
```
┌─────────────────────────────────────┐
│ 난이도: ★★★★☆                      │
│ 문제를 풀기 전에 잠깐!              │
├─────────────────────────────────────┤
│ 🫁 심호흡하기                        │
│ 어려운 문제를 풀기 전에...         │
└─────────────────────────────────────┘
```

4. **"도움됨" 피드백** 클릭
5. **"문제 풀러 가기"** 클릭
6. 문제 풀이 진행

### 관리자로 통계 확인

```
사이트 관리 → 플러그인 → 로컬 플러그인 → 인지 부하 팁
→ "통계" 탭
```

확인 사항:
- ✅ 전체 상호작용 수 > 0
- ✅ 표시된 팁 수 증가
- ✅ 평균 조회 시간 기록

---

## 🔍 문제 해결

### 문제 1: 팁이 표시되지 않음

**원인**: 문제 난이도 미설정

**해결**:
```sql
-- 문제 난이도 확인
SELECT questionid, difficulty_level
FROM mdl_local_clt_question_difficulty
WHERE questionid = [문제ID];

-- 없으면 추가
INSERT INTO mdl_local_clt_question_difficulty
(questionid, difficulty_level, timecreated, timemodified)
VALUES ([문제ID], 4, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
```

### 문제 2: 한국어 팁이 안 보임

**원인**: 사용자 언어 설정

**해결**:
1. 사용자 프로필 → 언어 설정 → 한국어 선택
2. 또는 코스 설정에서 강제 언어 지정

```sql
-- 한국어 팁 확인
SELECT COUNT(*) FROM mdl_local_clt_tips WHERE language = 'ko';
-- 결과: 7
```

### 문제 3: JavaScript 오류

**원인**: 캐시 문제

**해결**:
```bash
# CLI에서 캐시 삭제
cd /var/www/html/moodle
sudo -u www-data php admin/cli/purge_caches.php
```

또는 웹에서:
```
사이트 관리 → 개발 → 캐시 삭제
```

### 문제 4: 권한 오류

**원인**: 파일 권한 문제

**해결**:
```bash
cd /var/www/html/moodle/local
chown -R www-data:www-data cognitiveloadtips
chmod -R 755 cognitiveloadtips
```

### 문제 5: 데이터베이스 연결 오류

**확인**:
```bash
# Moodle config.php 확인
cat config.php | grep dbname
cat config.php | grep dbuser
cat config.php | grep dbpass

# MySQL 연결 테스트
mysql -u [dbuser] -p[dbpass] [dbname]
```

---

## 📊 고급 설정

### 웹 서비스 API 활성화

외부 시스템과 연동하려면:

1. **사이트 관리 → 플러그인 → 웹 서비스 → 개요**
2. 다음 항목 활성화:
   - ✅ 웹 서비스 활성화
   - ✅ REST 프로토콜 활성화
3. **외부 서비스** 생성:
   - 이름: "Cognitive Load Tips API"
   - 축약 이름: "clt_api"
   - 활성화: ✅
4. **함수 추가**:
   - `local_cognitiveloadtips_get_tips`
   - `local_cognitiveloadtips_record_interaction`
   - `local_cognitiveloadtips_submit_feedback`
5. **토큰 생성**:
   - 사용자 선택
   - 서비스 선택
   - 토큰 저장

### API 사용 예시

```bash
# 난이도 4 한국어 팁 가져오기
curl -X GET "https://your-moodle.com/webservice/rest/server.php" \
  -d "wstoken=YOUR_TOKEN" \
  -d "wsfunction=local_cognitiveloadtips_get_tips" \
  -d "moodlewsrestformat=json" \
  -d "difficulty=4" \
  -d "language=ko" \
  -d "random=1"
```

---

## 🔐 보안 체크리스트

설치 후 확인:

- [ ] 파일 권한이 755 이하인가?
- [ ] config.php가 외부에서 접근 불가능한가?
- [ ] 웹 서비스가 필요한 경우에만 활성화되어 있는가?
- [ ] API 토큰이 안전하게 보관되어 있는가?
- [ ] SSL/TLS가 활성화되어 있는가?

---

## 📞 지원

문제가 계속될 경우:

1. **Moodle 로그 확인**:
   ```
   사이트 관리 → 리포트 → 로그
   ```

2. **PHP 에러 로그**:
   ```bash
   tail -f /var/log/apache2/error.log
   # 또는
   tail -f /var/log/php7.1-fpm.log
   ```

3. **디버그 모드 활성화**:
   ```php
   // config.php에 추가
   $CFG->debug = 32767;
   $CFG->debugdisplay = 1;
   ```

4. **문의**: KAIST Touch Math Academy

---

## ✨ 다음 단계

설치 완료! 이제:

1. ✅ 모든 퀴즈에 설정 적용
2. ✅ 문제 난이도 검토 및 설정
3. ✅ 학생들에게 새 기능 안내
4. ✅ 1-2주 후 통계 확인
5. ✅ 피드백 기반으로 팁 내용 개선

**즐거운 학습 되세요!** 🎓

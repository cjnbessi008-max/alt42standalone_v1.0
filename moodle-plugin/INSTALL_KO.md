# Problem Explanation 모듈 설치 가이드

## 빠른 설치 (Quick Install)

### 1단계: 파일 복사

```bash
# Moodle 서버에 SSH 접속
cd /var/www/html/moodle  # Moodle 루트 디렉토리

# 플러그인 파일 복사
cp -r /path/to/mod_problemexplain ./mod/

# 권한 설정
chown -R www-data:www-data mod/problemexplain
chmod -R 755 mod/problemexplain
```

### 2단계: 데이터베이스 설치

1. Moodle 관리자로 로그인
2. 브라우저에서 `https://your-moodle-site.com` 방문
3. **"사이트 관리 > 알림"** 또는 **"Site administration > Notifications"** 페이지 이동
4. "지금 업그레이드" 또는 "Upgrade now" 클릭
5. 설치 완료 확인

### 3단계: Claude API 설정 (AI 평가 사용 시)

1. **사이트 관리 > 플러그인 > 활동 모듈 > Problem Explanation** 이동
2. "Claude API Key" 필드에 API 키 입력
   - API 키 발급: https://console.anthropic.com/
3. "Claude Model" 선택 (권장: Claude 3 Sonnet)
4. "변경사항 저장" 클릭

## 상세 설치 (Detailed Installation)

### 시스템 요구사항 확인

#### PHP 버전 확인
```bash
php -v
# PHP 7.1.9 이상이어야 함
```

#### MySQL 버전 확인
```bash
mysql --version
# MySQL 5.7 이상이어야 함
```

#### Moodle 버전 확인
- 관리자 > 사이트 관리 > 알림
- Moodle 3.7 이상이어야 함

### 수동 데이터베이스 설치 (문제 발생 시)

웹 인터페이스를 통한 설치가 실패하는 경우:

```bash
# MySQL에 접속
mysql -u moodle_user -p moodle_database

# SQL 파일 실행 (플러그인 디렉토리에서)
# install.xml을 SQL로 변환 후 실행
```

또는 Moodle CLI 사용:

```bash
php admin/cli/upgrade.php
```

### 플러그인 활성화 확인

```bash
# Moodle의 config.php 파일 확인
cat config.php | grep problemexplain

# 플러그인 목록에서 확인
php admin/cli/plugin_info.php
```

## 설정 가이드

### 기본 설정

1. **AI 평가 기본값**
   - 경로: 사이트 관리 > 플러그인 > 활동 모듈 > Problem Explanation
   - "Enable AI evaluation by default" 체크박스 설정
   - 새로 만드는 활동에 기본적으로 AI 평가가 활성화됨

2. **Claude 모델 선택**
   - **Claude 3 Opus**: 가장 정확하지만 느리고 비쌈
   - **Claude 3 Sonnet**: 균형잡힌 성능 (권장)
   - **Claude 3 Haiku**: 빠르고 저렴하지만 정확도 낮음

### 코스별 설정

각 코스에 활동을 추가할 때:

1. **코스 편집 모드** 활성화
2. **"활동 또는 리소스 추가"** 클릭
3. **"Problem Explanation"** 선택
4. 다음 설정:

#### 필수 설정
- **활동 이름**: 학생들에게 표시될 제목
- **문제 텍스트**: 학생들이 설명할 문제
- **문제 유형**: 산술, 대수, 기하 등

#### 선택 설정
- **최소 단계 수**: 3 (권장)
- **최대 단계 수**: 10 (권장)
- **AI 평가 활성화**: 권장
- **동료 평가 활성화**: 선택사항
- **최대 점수**: 100 (기본값)

## 테스트

### 기능 테스트 체크리스트

- [ ] 학생 계정으로 활동 접근 가능
- [ ] 설명 작성 및 임시 저장 가능
- [ ] 단계 추가/제거 기능 작동
- [ ] 최종 제출 가능
- [ ] AI 평가 결과 표시 (API 설정 시)
- [ ] 교사 계정으로 제출물 목록 확인
- [ ] 개별 제출물 채점 가능
- [ ] 성적부에 점수 반영

### 샘플 테스트 시나리오

#### 학생 테스트
```
1. 학생 계정으로 로그인
2. 테스트 코스 > Problem Explanation 활동 클릭
3. 문제 읽기
4. "설명 제목" 입력: "분수의 덧셈 방법"
5. 3개 이상의 단계 작성
6. "설명 제출" 클릭
7. AI 평가 결과 확인
```

#### 교사 테스트
```
1. 교사 계정으로 로그인
2. Problem Explanation 활동 > "모든 제출물" 클릭
3. 제출 현황 확인
4. 학생 제출물 클릭 > "채점" 선택
5. 학생의 설명 검토
6. 점수 입력 (0-100)
7. 피드백 작성
8. "성적 저장" 클릭
```

## 문제 해결

### 플러그인이 목록에 나타나지 않음

```bash
# 캐시 삭제
php admin/cli/purge_caches.php

# 또는 웹에서: 사이트 관리 > 개발 > 캐시 삭제
```

### 데이터베이스 테이블이 생성되지 않음

```bash
# 데이터베이스 연결 확인
php admin/cli/check_database_schema.php

# 강제 업그레이드
php admin/cli/upgrade.php --non-interactive
```

### AI 평가가 작동하지 않음

#### API Key 확인
```bash
# config.php 또는 플러그인 설정에서 확인
# API key는 sk-ant-로 시작해야 함
```

#### 네트워크 연결 테스트
```bash
# 서버에서 Claude API 접근 가능 여부 확인
curl -I https://api.anthropic.com/v1/messages
```

#### 오류 로그 확인
```bash
# Moodle 디버그 모드 활성화
# config.php에 추가:
$CFG->debug = (E_ALL | E_STRICT);
$CFG->debugdisplay = 1;

# 로그 파일 확인
tail -f /var/log/apache2/error.log
# 또는
tail -f /var/log/nginx/error.log
```

### 권한 오류

```bash
# 파일 권한 재설정
chown -R www-data:www-data /var/www/html/moodle/mod/problemexplain
chmod -R 755 /var/www/html/moodle/mod/problemexplain
```

## 성능 최적화

### 대용량 환경 (100+ 학생)

1. **데이터베이스 인덱스 확인**
   - install.xml에 정의된 모든 인덱스가 생성되었는지 확인

2. **PHP 메모리 제한 증가**
   ```php
   // php.ini에서
   memory_limit = 256M
   ```

3. **AI 평가 비동기 처리**
   - Moodle의 scheduled task 사용 고려
   - 대량 제출 시 즉시 평가 대신 큐 사용

### 캐싱 설정

```php
// config.php에 추가
$CFG->cachejs = true;
$CFG->cachetemplates = true;
```

## 업그레이드

추후 버전 업그레이드 시:

```bash
# 1. 백업
cp -r mod/problemexplain mod/problemexplain.backup

# 2. 새 버전 복사
cp -r /path/to/new/mod_problemexplain ./mod/

# 3. 권한 재설정
chown -R www-data:www-data mod/problemexplain

# 4. 업그레이드 실행
php admin/cli/upgrade.php
```

## 지원

문제가 해결되지 않으면:

1. **Moodle 로그 확인**: 사이트 관리 > 보고서 > 로그
2. **PHP 오류 로그 확인**: 서버의 error.log 파일
3. **GitHub Issues**: 버그 리포트 제출
4. **이메일 문의**: KAIST Touch Math Academy

---

**설치 완료 후 첫 번째 활동을 만들어보세요!** 🎉

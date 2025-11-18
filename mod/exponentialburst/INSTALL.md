# Exponential Burst - 설치 가이드 (Installation Guide)

## 빠른 설치 (Quick Installation)

### 전제 조건 (Prerequisites)

- Moodle 3.3 이상 (권장: 3.7)
- PHP 7.1.9 이상
- MySQL 5.7 이상
- 관리자 권한

## 단계별 설치 (Step-by-Step Installation)

### 1. 파일 준비

#### 옵션 A: Git 사용
```bash
cd /path/to/moodle/mod
git clone https://github.com/your-org/exponentialburst.git
```

#### 옵션 B: 수동 다운로드
1. 플러그인 ZIP 파일 다운로드
2. `/path/to/moodle/mod/exponentialburst` 폴더에 압축 해제

### 2. 파일 구조 확인

설치 후 다음 구조가 되어야 합니다:

```
moodle/
└── mod/
    └── exponentialburst/
        ├── classes/
        │   └── event/
        │       └── course_module_viewed.php
        ├── db/
        │   ├── access.php
        │   └── install.xml
        ├── lang/
        │   └── en/
        │       └── exponentialburst.php
        ├── pix/
        │   └── icon.png (optional)
        ├── ajax.php
        ├── index.php
        ├── lib.php
        ├── mod_form.php
        ├── module.js
        ├── README.md
        ├── styles.css
        ├── version.php
        └── view.php
```

### 3. 권한 설정

```bash
# Linux/Unix 시스템
cd /path/to/moodle
chown -R www-data:www-data mod/exponentialburst
chmod -R 755 mod/exponentialburst

# 특정 파일 실행 권한
chmod 644 mod/exponentialburst/*.php
chmod 644 mod/exponentialburst/*.js
chmod 644 mod/exponentialburst/*.css
```

### 4. Moodle 플러그인 설치

1. **자동 감지**
   - Moodle에 관리자로 로그인
   - Moodle이 자동으로 새 플러그인을 감지
   - "알림" 페이지로 자동 리디렉션

2. **수동 설치**
   - 사이트 관리 > 알림 방문
   - "데이터베이스 업그레이드" 버튼 클릭

3. **설치 진행**
   - 플러그인 정보 확인
   - "계속" 버튼 클릭
   - 데이터베이스 테이블 생성 완료 대기

4. **설치 완료 확인**
   - 성공 메시지 확인
   - "계속" 클릭

### 5. 플러그인 검증

#### 데이터베이스 테이블 확인
```sql
-- MySQL에서 실행
SHOW TABLES LIKE 'mdl_exponentialburst%';

-- 다음 테이블이 있어야 함:
-- mdl_exponentialburst
-- mdl_exponentialburst_attempts
-- mdl_exponentialburst_progress
```

#### 플러그인 목록 확인
- 사이트 관리 > 플러그인 > 플러그인 개요
- 활동 모듈 섹션에서 "Exponential Burst" 확인

#### 권한 확인
- 사이트 관리 > 사용자 > 권한 > 권한 정의
- "exponentialburst" 검색
- 다음 권한 확인:
  - `mod/exponentialburst:addinstance`
  - `mod/exponentialburst:view`
  - `mod/exponentialburst:submit`
  - `mod/exponentialburst:viewreports`

## 첫 번째 활동 만들기

### 1. 코스 접속
- 교사 또는 관리자로 코스 접속

### 2. 편집 모드
- "편집 모드 켜기" 클릭

### 3. 활동 추가
1. 원하는 섹션에서 "활동 또는 리소스 추가" 클릭
2. "Exponential Burst" 선택
3. "추가" 클릭

### 4. 설정 구성

#### 일반 설정
- **이름**: "지수 함수 연습"
- **설명**: 활동 설명 입력

#### Exponential Burst 설정
- **난이도**: 1 (초급)
- **최대값**: 100
- **그래프 표시**: 체크

### 5. 저장
- "저장하고 표시" 클릭

### 6. 테스트
1. 학생 계정으로 로그인 (또는 학생 역할 전환)
2. 활동 클릭
3. 우측 하단 스마트폰 화면 확인
4. 문제 풀기 및 불꽃 효과 확인

## 고급 설정 (Advanced Configuration)

### PHP 설정 최적화

#### php.ini 설정
```ini
; 메모리 제한 (대량 파티클 처리용)
memory_limit = 256M

; 실행 시간 제한
max_execution_time = 60

; 업로드 제한
upload_max_filesize = 20M
post_max_size = 20M
```

### MySQL 최적화

#### 인덱스 확인
```sql
-- 인덱스가 제대로 생성되었는지 확인
SHOW INDEX FROM mdl_exponentialburst_attempts;
SHOW INDEX FROM mdl_exponentialburst_progress;
```

### Apache/Nginx 설정

#### Apache (.htaccess)
```apache
# 정적 파일 캐싱
<FilesMatch "\.(js|css|png|jpg|gif)$">
    Header set Cache-Control "max-age=31536000, public"
</FilesMatch>
```

#### Nginx
```nginx
# 정적 파일 캐싱
location ~* \.(js|css|png|jpg|gif)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 문제 해결 (Troubleshooting)

### 설치 중 오류

#### "Plugin validation failed"
**원인**: 파일 구조 또는 권한 문제
**해결**:
```bash
# 권한 재설정
chmod -R 755 mod/exponentialburst
chown -R www-data:www-data mod/exponentialburst

# 파일 구조 확인
ls -la mod/exponentialburst/
```

#### "Database error"
**원인**: MySQL 권한 또는 연결 문제
**해결**:
```sql
-- Moodle DB 사용자 권한 확인
SHOW GRANTS FOR 'moodle_user'@'localhost';

-- CREATE, ALTER 권한 있어야 함
GRANT ALL PRIVILEGES ON moodle_db.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;
```

#### "Version mismatch"
**원인**: Moodle 버전 호환성
**해결**: `version.php`에서 `requires` 값 확인 및 조정
```php
$plugin->requires  = 2017051500;  // Moodle 3.3
// 또는
$plugin->requires  = 2019052000;  // Moodle 3.7
```

### 런타임 오류

#### JavaScript 로드 실패
**확인**:
```javascript
// 브라우저 콘솔에서
console.log(typeof EXPONENTIALBURST_CONFIG);
// "object"가 출력되어야 함
```

**해결**:
- 브라우저 캐시 클리어
- Moodle 캐시 퍼지 (사이트 관리 > 개발 > 캐시 퍼지)

#### Canvas 렌더링 문제
**확인**: 브라우저가 HTML5 Canvas 지원하는지 확인
**해결**: 최신 브라우저로 업그레이드

#### AJAX 요청 실패
**확인**:
```bash
# 브라우저 네트워크 탭에서 ajax.php 요청 확인
# 403/404 오류 시 경로 확인
```

**해결**:
```bash
# ajax.php 권한 확인
chmod 644 mod/exponentialburst/ajax.php

# SELinux 문제 (CentOS/RHEL)
setsebool -P httpd_can_network_connect on
```

## 제거 (Uninstallation)

### 1. Moodle UI에서 제거
1. 사이트 관리 > 플러그인 > 플러그인 개요
2. "Exponential Burst" 찾기
3. "제거" 클릭
4. 확인 후 "계속"

### 2. 데이터베이스 정리 확인
```sql
-- 테이블이 삭제되었는지 확인
SHOW TABLES LIKE 'mdl_exponentialburst%';
-- 결과가 없어야 함
```

### 3. 파일 삭제
```bash
rm -rf /path/to/moodle/mod/exponentialburst
```

## 업그레이드 (Upgrade)

### 1. 백업
```bash
# 파일 백업
cp -r mod/exponentialburst mod/exponentialburst.backup

# DB 백업
mysqldump -u root -p moodle_db \
  mdl_exponentialburst \
  mdl_exponentialburst_attempts \
  mdl_exponentialburst_progress \
  > exponentialburst_backup.sql
```

### 2. 새 버전 설치
```bash
# 기존 파일 삭제 (백업 제외)
rm -rf mod/exponentialburst

# 새 버전 복사
cp -r /path/to/new/exponentialburst mod/
```

### 3. Moodle 업그레이드
- 사이트 관리 > 알림
- "데이터베이스 업그레이드" 클릭

### 4. 검증
- 기존 활동이 정상 작동하는지 확인
- 학생 진행 데이터 보존 확인

## 지원 (Support)

문제가 계속되면:
- GitHub Issues: https://github.com/your-org/exponentialburst/issues
- 이메일: support@kaist-touchmath.edu
- Moodle 포럼: https://moodle.org/mod/forum/

## 체크리스트 (Installation Checklist)

- [ ] Moodle 3.3+ 설치됨
- [ ] PHP 7.1.9+ 설치됨
- [ ] MySQL 5.7+ 설치됨
- [ ] 파일이 올바른 위치에 복사됨
- [ ] 파일 권한 설정됨 (755/644)
- [ ] Moodle 알림 페이지 방문
- [ ] 데이터베이스 업그레이드 완료
- [ ] 3개 테이블 생성 확인
- [ ] 플러그인 목록에 표시됨
- [ ] 권한 4개 생성됨
- [ ] 테스트 활동 생성
- [ ] 학생 역할로 테스트
- [ ] 스마트폰 UI 표시됨
- [ ] 불꽃 효과 작동함
- [ ] 진행 상황 저장됨

---

설치 완료! 🎉

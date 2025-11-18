# Shape Morph Animation - 설치 가이드

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
3. [Moodle 플러그인 설치](#moodle-플러그인-설치)
4. [데이터베이스 설정](#데이터베이스-설정)
5. [프론트엔드 빌드](#프론트엔드-빌드)
6. [통합 및 테스트](#통합-및-테스트)
7. [문제 해결](#문제-해결)

---

## 시스템 요구사항

### 서버 환경
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 이상
- **웹 서버**: Apache 2.4 또는 Nginx 1.14+

### 개발 환경
- **Node.js**: 16.x 이상
- **npm**: 8.x 이상
- **Git**: 2.x 이상

### 브라우저 호환성
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 로컬 개발 환경 설정

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속하여 테스트

### 4. 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

---

## Moodle 플러그인 설치

### 1. Moodle 디렉토리 확인

```bash
cd /path/to/moodle
```

### 2. Shape Morph 플러그인 디렉토리 생성

```bash
mkdir -p local/shape_morph
```

### 3. 백엔드 파일 복사

```bash
# 저장소의 백엔드 파일을 Moodle 플러그인 디렉토리로 복사
cp -r /path/to/alt42standalone_v1.0/src/backend/moodle-integration/* local/shape_morph/
```

### 4. 권한 설정

```bash
# Moodle 웹 서버 사용자 (예: www-data)에게 권한 부여
chown -R www-data:www-data local/shape_morph
chmod -R 755 local/shape_morph
```

### 5. 프론트엔드 빌드 파일 복사

```bash
# 빌드된 파일을 Moodle 플러그인 디렉토리로 복사
mkdir -p local/shape_morph/dist
cp -r /path/to/alt42standalone_v1.0/dist/* local/shape_morph/dist/
```

---

## 데이터베이스 설정

### 1. Moodle 데이터베이스 접속

```bash
mysql -u moodle_user -p moodle_db
```

### 2. Shape Morph 스키마 실행

```bash
mysql -u moodle_user -p moodle_db < /path/to/alt42standalone_v1.0/src/backend/moodle-integration/db/schema.sql
```

### 3. 스키마 확인

```sql
-- 테이블 생성 확인
SHOW TABLES LIKE 'mdl_shape_morph%';
SHOW TABLES LIKE 'mdl_concept%';
SHOW TABLES LIKE 'mdl_student_shape%';

-- 초기 데이터 확인
SELECT COUNT(*) FROM mdl_concept_shapes;
SELECT COUNT(*) FROM mdl_concept_transitions;
```

예상 결과:
- `mdl_concept_shapes`: 10개 레코드 (분수 5개, 기하학 5개)
- `mdl_concept_transitions`: 10개 레코드

### 4. 데이터베이스 사용자 권한 확인

```sql
-- Moodle 사용자에게 필요한 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON moodle_db.mdl_shape_morph_config TO 'moodle_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON moodle_db.mdl_concept_shapes TO 'moodle_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON moodle_db.mdl_concept_transitions TO 'moodle_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON moodle_db.mdl_student_shape_progress TO 'moodle_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON moodle_db.mdl_shape_morph_events TO 'moodle_user'@'localhost';

FLUSH PRIVILEGES;
```

---

## 프론트엔드 빌드

### 개발 모드

```bash
npm run dev
```

- HMR (Hot Module Replacement) 활성화
- 소스맵 생성
- 포트: 3000

### 프로덕션 빌드

```bash
npm run build
```

출력:
- `dist/shape-morph.js` - 메인 JavaScript 번들
- `dist/shape-morph.css` - 스타일시트

### 빌드 최적화

```bash
# 번들 크기 분석
npm run build -- --analyze

# 타입 체크
npm run type-check

# 린트
npm run lint
```

---

## 통합 및 테스트

### 1. Moodle 테마에 통합

Moodle 테마의 푸터에 Shape Morph 스크립트 추가:

**방법 1: 테마 파일 직접 수정**

`theme/yourtheme/layout/includes/footer.php`:

```php
<!-- Shape Morph Animation -->
<script src="<?php echo $CFG->wwwroot; ?>/local/shape_morph/dist/shape-morph.js"></script>
<link rel="stylesheet" href="<?php echo $CFG->wwwroot; ?>/local/shape_morph/dist/shape-morph.css">
```

**방법 2: Moodle 설정에서 추가**

1. Moodle 관리자 로그인
2. `Site administration` > `Appearance` > `Additional HTML`
3. `Within BODY` 섹션에 추가:

```html
<script src="/local/shape_morph/dist/shape-morph.js"></script>
<link rel="stylesheet" href="/local/shape_morph/dist/shape-morph.css">
```

### 2. 플러그인 활성화

1. Moodle 관리자 로그인
2. `Site administration` > `Notifications`
3. Shape Morph 플러그인 설치 알림 확인
4. "Upgrade Moodle database now" 클릭

### 3. 코스별 설정

```sql
-- 특정 코스에 Shape Morph 활성화
INSERT INTO mdl_shape_morph_config (moodle_course_id, animation_speed, transition_duration, is_active)
VALUES (2, 1.00, 2000, TRUE);
```

### 4. 테스트

#### 기본 표시 테스트

1. Moodle 코스 페이지 접속
2. 우측 하단에 스마트폰 프레임 표시 확인
3. 초기 개념 (원 또는 분수) 표시 확인

#### 애니메이션 테스트

개발자 콘솔에서:

```javascript
// 현재 개념 확인
window.shapeMorphAPI.getCurrentConcept();

// 개념 전환 테스트 (예: 개념 ID 2로 전환)
window.shapeMorphAPI.transitionToConcept(2);

// 재로드
window.shapeMorphAPI.reloadConcept();
```

#### API 테스트

```bash
# 현재 개념 조회
curl "http://your-moodle-url/local/shape_morph/api/problem-provider.php?action=get_current_concept&courseid=1" \
  --cookie "MoodleSession=your-session-id"

# 모든 개념 조회
curl "http://your-moodle-url/local/shape_morph/api/problem-provider.php?action=get_all_concepts" \
  --cookie "MoodleSession=your-session-id"
```

---

## 문제 해결

### 문제 1: 스마트폰 프레임이 표시되지 않음

**원인**: JavaScript 번들이 로드되지 않음

**해결방법**:
1. 브라우저 개발자 도구 (F12) > Console 탭 확인
2. `shape-morph.js` 로드 에러 확인
3. 파일 경로 확인:
   ```bash
   ls -la /path/to/moodle/local/shape_morph/dist/
   ```
4. 웹 서버 권한 확인

### 문제 2: 데이터베이스 연결 오류

**원인**: MySQL 테이블이 생성되지 않았거나 권한 부족

**해결방법**:
1. 테이블 존재 확인:
   ```sql
   SHOW TABLES LIKE 'mdl_shape_morph%';
   ```
2. 스키마 재실행:
   ```bash
   mysql -u moodle_user -p moodle_db < src/backend/moodle-integration/db/schema.sql
   ```
3. 권한 확인:
   ```sql
   SHOW GRANTS FOR 'moodle_user'@'localhost';
   ```

### 문제 3: 애니메이션이 작동하지 않음

**원인**: Canvas API 미지원 또는 JavaScript 오류

**해결방법**:
1. 브라우저 콘솔 에러 확인
2. Canvas 지원 확인:
   ```javascript
   document.createElement('canvas').getContext('2d');
   ```
3. 캐시 삭제 후 새로고침 (Ctrl+Shift+R)

### 문제 4: CORS 오류

**원인**: API 요청이 차단됨

**해결방법**:

Apache `.htaccess`:
```apache
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type"
```

Nginx `nginx.conf`:
```nginx
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
add_header Access-Control-Allow-Headers "Content-Type";
```

### 문제 5: 빌드 실패

**원인**: Node.js 버전 불일치 또는 의존성 문제

**해결방법**:
1. Node.js 버전 확인:
   ```bash
   node --version  # v16 이상
   npm --version   # v8 이상
   ```
2. 의존성 재설치:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. TypeScript 오류 확인:
   ```bash
   npx tsc --noEmit
   ```

---

## 성능 최적화

### 1. CDN 사용

```html
<!-- React를 CDN에서 로드하여 번들 크기 감소 -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
```

### 2. Gzip 압축 활성화

Apache:
```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>
```

### 3. 브라우저 캐싱

```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
</IfModule>
```

---

## 추가 리소스

- [Moodle 공식 문서](https://docs.moodle.org/)
- [React 문서](https://react.dev/)
- [TypeScript 문서](https://www.typescriptlang.org/)
- [Canvas API 문서](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

## 문의 및 지원

문제가 해결되지 않으면:
- GitHub Issues: [이슈 등록]
- 이메일: support@example.com
- 문서: `/docs/shape-morph-animation-spec.md`

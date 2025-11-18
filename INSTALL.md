# 3D Line Seq 설치 가이드

이 문서는 3D Line Seq 플러그인의 상세한 설치 가이드입니다.

## 사전 준비

### 시스템 요구사항 확인

```bash
# PHP 버전 확인 (7.1.9 이상 필요)
php -v

# MySQL 버전 확인 (5.7 이상 필요)
mysql --version

# Moodle 버전 확인
cat /path/to/moodle/version.php | grep release
```

## 단계별 설치

### 1단계: 파일 준비

```bash
# 저장소 클론
git clone <repository-url> alt42standalone_v1.0
cd alt42standalone_v1.0
```

### 2단계: Moodle 플러그인 설치

```bash
# Moodle 디렉토리 확인
MOODLE_DIR="/var/www/html/moodle"  # 실제 경로로 변경

# 플러그인 복사
sudo cp -r moodle-plugin/3dlineseq $MOODLE_DIR/mod/

# 권한 설정
sudo chown -R www-data:www-data $MOODLE_DIR/mod/3dlineseq
sudo chmod -R 755 $MOODLE_DIR/mod/3dlineseq
```

### 3단계: Three.js 라이브러리 다운로드

```bash
# webapp 디렉토리로 이동
cd webapp/lib

# Three.js 다운로드 (r128)
wget https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js

# 또는 curl 사용
curl -o three.min.js https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js

# 파일 확인
ls -lh three.min.js
```

**대안: CDN 사용**

`webapp/index.html`과 `moodle-plugin/3dlineseq/view.php`에서 CDN 링크를 사용할 수도 있습니다:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

### 4단계: 웹앱 파일 배포 (Moodle 내)

```bash
# Moodle 플러그인 내 webapp 디렉토리로 복사
sudo cp -r webapp $MOODLE_DIR/mod/3dlineseq/

# 권한 설정
sudo chown -R www-data:www-data $MOODLE_DIR/mod/3dlineseq/webapp
sudo chmod -R 755 $MOODLE_DIR/mod/3dlineseq/webapp
```

### 5단계: 데이터베이스 업그레이드

#### 방법 A: 웹 인터페이스 (권장)

1. 브라우저에서 Moodle 사이트 접속
2. 관리자로 로그인
3. 알림 메시지가 표시되면 **"데이터베이스 업그레이드"** 클릭
4. 업그레이드 완료 확인

#### 방법 B: CLI 사용

```bash
# Moodle 디렉토리로 이동
cd $MOODLE_DIR

# 업그레이드 실행
sudo -u www-data php admin/cli/upgrade.php --non-interactive

# 플러그인 목록 확인
sudo -u www-data php admin/cli/plugin_info.php mod_3dlineseq
```

### 6단계: 플러그인 확인

```bash
# Moodle CLI로 플러그인 상태 확인
cd $MOODLE_DIR
sudo -u www-data php admin/cli/plugin_info.php mod_3dlineseq
```

**출력 예시:**
```
Component: mod_3dlineseq
Name: 3D Line Seq
Type: Activity module
Release: 1.0
Maturity: Stable
Requires: Moodle 3.7
Installed: Yes
```

### 7단계: 웹 서비스 활성화 (선택사항)

Moodle 웹 서비스를 통한 외부 접근이 필요한 경우:

1. **사이트 관리** > **서버** > **웹 서비스** > **웹 서비스 관리**
2. **웹 서비스 활성화** 체크
3. **프로토콜 활성화**: REST 프로토콜 활성화
4. **외부 서비스**: "3D Line Seq Service" 추가
5. **토큰 생성**: 특정 사용자에 대한 토큰 생성

### 8단계: 테스트

#### 기본 테스트

1. 코스 생성 또는 기존 코스 접속
2. **편집 모드** 활성화
3. 섹션에서 **활동 또는 리소스 추가**
4. **3D Line Seq** 선택
5. 테스트 활동 생성:
   - **이름**: 테스트 수열
   - **수열 유형**: Fibonacci
   - **수열 데이터**: `1, 1, 2, 3, 5, 8, 13`
   - **시각화 스타일**: Spiral
6. **저장 후 표시**
7. 우측 하단 스마트폰 화면에서 3D 시각화 확인

#### 브라우저 콘솔 확인

F12를 눌러 개발자 도구 열기:

```javascript
// Three.js 로드 확인
console.log(THREE);

// 시각화 초기화 확인
console.log(scene, camera, renderer);
```

## 문제 해결

### 문제 1: "Cannot find module 'three'"

**원인**: Three.js 라이브러리가 없음

**해결**:
```bash
cd $MOODLE_DIR/mod/3dlineseq/webapp/lib
wget https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
```

### 문제 2: "Permission denied"

**원인**: 파일 권한 문제

**해결**:
```bash
sudo chown -R www-data:www-data $MOODLE_DIR/mod/3dlineseq
sudo chmod -R 755 $MOODLE_DIR/mod/3dlineseq
```

### 문제 3: 데이터베이스 테이블이 생성되지 않음

**원인**: 업그레이드가 제대로 실행되지 않음

**해결**:
```bash
# 플러그인 재설치
cd $MOODLE_DIR
sudo -u www-data php admin/cli/uninstall_plugins.php --plugins=mod_3dlineseq
sudo -u www-data php admin/cli/upgrade.php
```

### 문제 4: 스마트폰 화면이 검은색으로 표시됨

**원인**: WebGL 미지원 또는 Three.js 초기화 실패

**해결**:

1. 브라우저 WebGL 지원 확인: https://get.webgl.org/
2. 브라우저 콘솔에서 오류 확인
3. Three.js 버전 확인

### 문제 5: CORS 오류

**원인**: 외부 도메인에서 접근 시 CORS 정책

**해결** (`config.php`에 추가):
```php
// CORS 헤더 추가 (필요시)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
```

## 고급 설정

### 커스텀 테마 적용

`webapp/css/style.css`를 수정하여 커스텀 테마 적용:

```css
/* 커스텀 컬러 스킴 */
body {
    background: linear-gradient(135deg, #your-color1 0%, #your-color2 100%);
}

.smartphone-frame {
    background: linear-gradient(145deg, #your-color3, #your-color4);
}
```

### 성능 최적화

#### PHP OpCache 활성화

`php.ini`:
```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
```

#### MySQL 쿼리 캐싱

`my.cnf`:
```ini
[mysqld]
query_cache_type = 1
query_cache_size = 64M
```

#### Moodle 캐싱

Moodle 관리자 > **사이트 관리** > **플러그인** > **캐싱** > **캐시 저장소 설정**

### 백업 및 복원

#### 데이터 백업

```bash
# 데이터베이스 백업
mysqldump -u root -p moodle mdl_3dlineseq mdl_3dlineseq_attempts > 3dlineseq_backup.sql

# 파일 백업
tar -czf 3dlineseq_files.tar.gz $MOODLE_DIR/mod/3dlineseq
```

#### 데이터 복원

```bash
# 데이터베이스 복원
mysql -u root -p moodle < 3dlineseq_backup.sql

# 파일 복원
cd $MOODLE_DIR/mod
tar -xzf 3dlineseq_files.tar.gz
```

## 프로덕션 체크리스트

- [ ] PHP 버전 7.1.9 이상 확인
- [ ] MySQL 버전 5.7 이상 확인
- [ ] Moodle 버전 3.7 이상 확인
- [ ] Three.js 라이브러리 설치 확인
- [ ] 파일 권한 올바르게 설정 확인
- [ ] 데이터베이스 테이블 생성 확인
- [ ] 플러그인 활성화 확인
- [ ] 테스트 활동 생성 및 동작 확인
- [ ] 브라우저 호환성 테스트
- [ ] 모바일 디바이스 테스트
- [ ] 성능 테스트 (동시 접속 시뮬레이션)
- [ ] 백업 시스템 구축

## 지원

문제가 발생하면:

1. **로그 확인**: `$MOODLE_DIR/moodledata/` 디렉토리의 로그 파일
2. **브라우저 콘솔**: F12 개발자 도구에서 JavaScript 오류 확인
3. **Moodle 디버깅 활성화**: 사이트 관리 > 개발 > 디버깅

---

설치 완료! 🎉

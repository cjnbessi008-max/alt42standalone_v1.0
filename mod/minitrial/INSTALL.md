# Mini Trial Game - 설치 가이드

## 📋 사전 요구사항

설치 전 다음 사항을 확인하세요:

- ✅ Moodle 3.7 이상
- ✅ PHP 7.1.9 이상
- ✅ MySQL 5.7 이상
- ✅ Moodle 관리자 권한

## 📦 설치 과정

### 옵션 1: Moodle 웹 인터페이스를 통한 설치 (권장)

1. **플러그인 ZIP 파일 준비**
   ```bash
   cd /path/to/alt42standalone_v1.0
   zip -r mod_minitrial.zip mod/minitrial/
   ```

2. **Moodle 관리 페이지 접속**
   - Moodle 사이트에 관리자로 로그인
   - **사이트 관리 > 플러그인 > 플러그인 설치**로 이동

3. **ZIP 파일 업로드**
   - "파일 선택" 버튼 클릭
   - `mod_minitrial.zip` 파일 선택
   - "이 ZIP 파일에서 플러그인 설치" 버튼 클릭

4. **설치 확인**
   - 플러그인 유형 확인: "활동 모듈 (mod)"
   - 플러그인 이름 확인: "minitrial"
   - "플러그인 설치 계속" 버튼 클릭

5. **데이터베이스 업그레이드**
   - 자동으로 데이터베이스 테이블 생성
   - "계속" 버튼 클릭

6. **설치 완료**
   - 성공 메시지 확인
   - "계속" 버튼 클릭하여 플러그인 목록으로 이동

### 옵션 2: 수동 설치 (서버 접근 가능 시)

1. **파일 복사**
   ```bash
   # Moodle 설치 디렉토리로 이동
   cd /var/www/html/moodle  # 또는 귀하의 Moodle 경로

   # minitrial 폴더 복사
   cp -r /path/to/alt42standalone_v1.0/mod/minitrial ./mod/

   # 권한 설정
   chown -R www-data:www-data mod/minitrial
   chmod -R 755 mod/minitrial
   ```

2. **Moodle 웹 인터페이스 접속**
   - 브라우저에서 Moodle 사이트 접속
   - 관리자로 로그인

3. **자동 감지 및 설치**
   - Moodle이 새 플러그인을 자동으로 감지
   - **사이트 관리 > 알림**으로 자동 리다이렉트
   - "데이터베이스 업그레이드" 버튼 클릭

4. **설치 완료**
   - 데이터베이스 테이블 생성 확인
   - "계속" 버튼 클릭

### 옵션 3: Git을 사용한 설치 (개발자용)

1. **Moodle mod 디렉토리로 이동**
   ```bash
   cd /var/www/html/moodle/mod
   ```

2. **Git 클론**
   ```bash
   git clone [repository-url] minitrial
   ```

3. **권한 설정**
   ```bash
   chown -R www-data:www-data minitrial
   chmod -R 755 minitrial
   ```

4. **Moodle 관리 페이지에서 설치 진행**
   - 웹 브라우저로 Moodle 접속
   - **사이트 관리 > 알림**에서 업그레이드 진행

## ✅ 설치 확인

설치가 제대로 되었는지 확인:

1. **플러그인 목록 확인**
   - **사이트 관리 > 플러그인 > 플러그인 개요**
   - "미니 시행 게임" (Mini Trial Game) 검색
   - 버전: v1.0.0 확인

2. **데이터베이스 테이블 확인**
   ```sql
   SHOW TABLES LIKE 'mdl_minitrial%';
   ```

   다음 테이블이 존재해야 함:
   - `mdl_minitrial`
   - `mdl_minitrial_attempts`
   - `mdl_minitrial_progress`

3. **활동 추가 테스트**
   - 아무 코스로 이동
   - "편집 모드 켜기"
   - "활동 또는 리소스 추가" 클릭
   - "미니 시행 게임" 옵션 확인

## 🔧 문제 해결

### 문제: 플러그인이 목록에 나타나지 않음

**해결책:**
```bash
# 캐시 삭제
php admin/cli/purge_caches.php

# 또는 웹 인터페이스에서:
# 사이트 관리 > 개발 > 캐시 삭제
```

### 문제: 권한 오류

**해결책:**
```bash
# 올바른 권한 설정
chown -R www-data:www-data /var/www/html/moodle/mod/minitrial
chmod -R 755 /var/www/html/moodle/mod/minitrial
```

### 문제: 데이터베이스 오류

**해결책:**
1. MySQL 로그 확인:
   ```bash
   tail -f /var/log/mysql/error.log
   ```

2. Moodle 데이터베이스 사용자 권한 확인:
   ```sql
   SHOW GRANTS FOR 'moodleuser'@'localhost';
   ```

3. 필요 시 권한 추가:
   ```sql
   GRANT ALL PRIVILEGES ON moodle.* TO 'moodleuser'@'localhost';
   FLUSH PRIVILEGES;
   ```

### 문제: PHP 버전 호환성

**확인:**
```bash
php -v
```

**요구사항:** PHP 7.1.9 이상

**업그레이드 (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install php7.4
```

## 🔄 업그레이드

기존 버전에서 업그레이드:

1. **백업 생성**
   ```bash
   cp -r /var/www/html/moodle/mod/minitrial /var/www/html/moodle/mod/minitrial.backup
   ```

2. **데이터베이스 백업**
   ```bash
   mysqldump -u root -p moodle mdl_minitrial mdl_minitrial_attempts mdl_minitrial_progress > minitrial_backup.sql
   ```

3. **새 파일로 교체**
   ```bash
   rm -rf /var/www/html/moodle/mod/minitrial
   cp -r /path/to/new/minitrial /var/www/html/moodle/mod/
   ```

4. **Moodle 업그레이드 실행**
   - 웹 브라우저로 Moodle 접속
   - **사이트 관리 > 알림**
   - 업그레이드 진행

## 🗑️ 제거

플러그인 제거 방법:

1. **웹 인터페이스를 통한 제거 (권장)**
   - **사이트 관리 > 플러그인 > 플러그인 개요**
   - "미니 시행 게임" 찾기
   - "제거" 클릭
   - 확인 후 진행

2. **수동 제거**
   ```bash
   # 파일 삭제
   rm -rf /var/www/html/moodle/mod/minitrial

   # 데이터베이스 테이블 삭제 (주의!)
   mysql -u root -p moodle <<EOF
   DROP TABLE IF EXISTS mdl_minitrial_progress;
   DROP TABLE IF EXISTS mdl_minitrial_attempts;
   DROP TABLE IF EXISTS mdl_minitrial;
   EOF
   ```

   ⚠️ **경고:** 수동 제거 시 모든 데이터가 영구 삭제됩니다!

## 📞 지원

설치 중 문제가 발생하면:

1. Moodle 로그 확인: **사이트 관리 > 보고서 > 로그**
2. PHP 오류 로그 확인: `/var/log/apache2/error.log` 또는 `/var/log/nginx/error.log`
3. README.md의 문제 해결 섹션 참조
4. Moodle 포럼 또는 개발팀에 문의

## 📚 다음 단계

설치 완료 후:

1. [README.md](README.md)에서 사용 방법 확인
2. 테스트 코스에서 활동 생성 및 테스트
3. 학생들에게 배포 전 충분한 테스트 진행

---

**버전:** 1.0.0
**최종 업데이트:** 2025-01-18
**라이선스:** GPL v3 or later

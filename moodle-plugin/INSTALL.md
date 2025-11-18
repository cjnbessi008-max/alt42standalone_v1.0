# Concept Detection Plugin - 빠른 설치 가이드

## 1단계: 파일 복사

```bash
# Moodle 루트 디렉토리로 이동
cd /var/www/html/moodle  # 또는 실제 Moodle 경로

# 플러그인 복사
cp -r /path/to/moodle-plugin/local/conceptdetection ./local/

# 권한 설정
chown -R www-data:www-data ./local/conceptdetection
chmod -R 755 ./local/conceptdetection
```

## 2단계: Moodle 업그레이드

### 방법 A: 웹 인터페이스 (권장)

1. Moodle에 관리자로 로그인
2. 자동으로 업그레이드 알림이 표시됨
3. "Upgrade Moodle database now" 클릭
4. 완료될 때까지 대기

### 방법 B: CLI

```bash
cd /var/www/html/moodle
php admin/cli/upgrade.php --non-interactive
```

## 3단계: 플러그인 설정

1. **Site administration → Plugins → Local plugins → Concept Detection**
2. 설정값 조정 (선택사항):
   - Time threshold: 60초 (기본값)
   - Attempts threshold: 3회 (기본값)
   - Score threshold: 60% (기본값)
3. "Save changes" 클릭

## 4단계: 권한 확인

1. **Site administration → Users → Permissions → Define roles**
2. "Teacher" 역할 편집
3. 다음 권한이 활성화되어 있는지 확인:
   - `local/conceptdetection:view`
   - `local/conceptdetection:viewreports`

## 5단계: 테스트

1. 교사 계정으로 로그인
2. `/local/conceptdetection/` URL 접속
3. 테스트 코스 선택
4. "Analyze Students Now" 클릭

## 문제 해결

### 플러그인이 인식되지 않음
```bash
# 캐시 제거
php admin/cli/purge_caches.php
```

### 데이터베이스 오류
```bash
# 로그 확인
tail -f /var/log/apache2/error.log  # Apache
tail -f /var/log/nginx/error.log    # Nginx
```

### 권한 문제
```bash
# 웹 서버 사용자 확인
ps aux | grep -E 'apache|nginx'

# 권한 재설정
chown -R [웹서버사용자]:[웹서버그룹] ./local/conceptdetection
```

## 완료!

설치가 완료되었습니다. README.md를 참조하여 사용 방법을 확인하세요.

# Roll Along - 빠른 시작 가이드

5분 안에 Roll Along 앱을 실행하는 방법입니다.

## 🚀 옵션 1: 자동 설치 (권장)

```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 설치 스크립트 실행
sudo ./install.sh
```

설치 스크립트가 자동으로 다음을 수행합니다:
- 시스템 요구사항 확인
- 파일을 웹 서버 디렉토리에 복사
- 권한 설정
- 데이터베이스 설정
- 웹 서버 설정 (선택사항)

## 📦 옵션 2: 수동 설치

### 1단계: 파일 복사

```bash
sudo cp -r public /var/www/html/roll-along
```

### 2단계: 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# Moodle 데이터베이스 선택
USE moodle;

# 테이블 생성
source moodle-integration/setup-database.sql
```

### 3단계: 설정 파일 수정

```bash
nano /var/www/html/roll-along/config/db-config.php
```

다음 값을 수정:
- `DB_HOST`: 데이터베이스 호스트
- `DB_NAME`: 데이터베이스 이름
- `DB_USER`: 사용자명
- `DB_PASS`: 비밀번호

### 4단계: 권한 설정

```bash
sudo chown -R www-data:www-data /var/www/html/roll-along
sudo chmod -R 755 /var/www/html/roll-along
```

## 🎮 테스트 실행

브라우저에서 다음 URL로 접속:

```
http://localhost/roll-along/demo.html
```

또는 직접 앱 실행:

```
http://localhost/roll-along/
```

## 🔧 문제 해결

### 페이지가 표시되지 않음
```bash
# Apache 재시작
sudo systemctl restart apache2

# 로그 확인
sudo tail -f /var/log/apache2/error.log
```

### 데이터베이스 연결 오류
- `config/db-config.php` 파일의 데이터베이스 설정 확인
- MySQL 서비스 실행 상태 확인:
  ```bash
  sudo systemctl status mysql
  ```

### Canvas가 보이지 않음
- 브라우저 개발자 도구(F12) 콘솔 확인
- JavaScript 오류 확인

## 📱 Moodle 연동

### URL 파라미터 방식:
```
http://localhost/roll-along/?problemId=1&userId=123&courseId=456
```

### LTI 연동:
1. Moodle 관리자 패널 접속
2. 사이트 관리 → 플러그인 → 활동 모듈 → 외부 도구
3. 새 외부 도구 추가:
   - 도구 URL: `http://your-server/roll-along/`
   - 소비자 키: `roll-along`
   - 공유 비밀: (생성된 키)

## 📊 샘플 데이터 확인

데이터베이스에 샘플 문제가 자동으로 추가됩니다:
- 문제 1: 일차함수
- 문제 2: 이차함수
- 문제 3: 삼차함수
- 문제 4: 사인함수
- 문제 5: 코사인함수
- 문제 6: 사용자 정의

## 🎯 다음 단계

1. ✅ 데모 페이지 확인
2. ✅ 기본 기능 테스트
3. 📝 문제 추가
4. 🔗 Moodle 연동
5. 🎨 커스터마이징

## 💡 유용한 팁

### 새 문제 추가:
```sql
INSERT INTO roll_along_problems
(title, instructions, function_type, x_min, x_max, y_min, y_max, difficulty_level)
VALUES
('새 문제', '설명', 'quadratic', -10, 10, -10, 10, 2);
```

### 학생 진도 확인:
```sql
SELECT * FROM roll_along_student_stats WHERE user_id = 123;
```

### 문제 통계 확인:
```sql
SELECT * FROM roll_along_problem_stats;
```

## 📚 추가 자료

- 📖 전체 문서: [README.md](README.md)
- 🗄️ API 문서: API 엔드포인트 목록 참조
- 💾 데이터베이스 스키마: [setup-database.sql](moodle-integration/setup-database.sql)

## 🆘 지원

문제가 발생하면:
1. 로그 파일 확인 (`/var/log/apache2/error.log`)
2. 브라우저 콘솔 확인 (F12)
3. README.md의 문제 해결 섹션 참조

---

**즐거운 학습 되세요! 🎓**

# 전제지식 체크 시스템 (Prerequisite Knowledge Checker)

Moodle 3.7 LMS와 연동하여 학생의 전제지식을 자동으로 체크하고 학습 경로를 추천하는 독립형 웹 애플리케이션입니다.

## 🎯 주요 기능

- **Moodle LMS 연동**: Moodle 3.7 Web Services API를 통한 데이터 동기화
- **전제지식 그래프**: 지식 개념 간의 선후행 관계 정의 및 관리
- **자동 평가 엔진**: Moodle 성적 데이터를 기반으로 학생의 지식 수준 자동 평가
- **스마트 추천**: 부족한 전제지식 파악 및 학습 자료 추천
- **시각화 대시보드**: 직관적인 웹 인터페이스로 전제지식 확인 및 관리

## 🛠 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: Bootstrap 4, jQuery
- **LMS Integration**: Moodle 3.7 REST API

## 📋 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- Moodle 3.7 (Web Services 활성화 필요)
- cURL 확장 모듈

## 🚀 설치 가이드

### 1. 파일 다운로드 및 배치

```bash
# 프로젝트를 웹 서버 디렉토리에 복사
cp -r alt42standalone_v1.0 /var/www/html/prerequisite-checker
cd /var/www/html/prerequisite-checker
```

### 2. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
mysql -u root -p
```

```sql
CREATE DATABASE prerequisite_checker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'prereq_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON prerequisite_checker.* TO 'prereq_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# 스키마 적용
mysql -u prereq_user -p prerequisite_checker < database/schema.sql

# 샘플 데이터 삽입
mysql -u prereq_user -p prerequisite_checker < database/seed.sql
```

### 3. 설정 파일 구성

```bash
# 설정 파일 복사 및 편집
cp config/config.example.php config/config.php
nano config/config.php
```

**config/config.php** 편집:

```php
<?php
return [
    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'prerequisite_checker',
        'username' => 'prereq_user',
        'password' => 'your_secure_password',
        // ... 나머지 설정
    ],

    'moodle' => [
        'url' => 'https://your-moodle-site.com',
        'token' => 'your_moodle_webservice_token',
        'service' => 'moodle_mobile_app',
        // ... 나머지 설정
    ],
];
```

### 4. Moodle Web Services 설정

Moodle 관리자로 로그인 후:

1. **사이트 관리 > 고급 기능**
   - "웹 서비스 활성화" 체크

2. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
   - 새 서비스 추가 또는 기존 서비스 사용 (예: moodle_mobile_app)
   - 필요한 기능 추가:
     - `core_course_get_courses`
     - `core_course_get_contents`
     - `core_enrol_get_enrolled_users`
     - `core_user_get_users_by_field`
     - `core_grades_get_grades`
     - `mod_quiz_get_user_attempts`
     - `mod_assign_get_submissions`
     - `mod_assign_get_grades`

3. **사이트 관리 > 사용자 > 권한 > 역할 정의**
   - 웹 서비스 전용 역할 생성 및 권한 부여

4. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
   - 새 토큰 생성
   - 생성된 토큰을 config.php에 입력

### 5. 권한 설정

```bash
# 로그 디렉토리 권한 설정
chmod 755 logs
chmod 644 logs/.gitkeep

# 웹 서버가 로그 파일을 쓸 수 있도록 설정
chown -R www-data:www-data logs
```

### 6. 웹 서버 설정

**Apache (.htaccess)** - 이미 public 디렉토리에 포함됨

**Nginx 설정 예시:**

```nginx
server {
    listen 80;
    server_name prerequisite-checker.yourdomain.com;
    root /var/www/html/prerequisite-checker/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

### 7. 설치 확인

브라우저에서 접속:
```
http://your-server/prerequisite-checker/
```

시스템 상태 확인:
```
http://your-server/prerequisite-checker/api.php/test
```

Moodle 연결 확인:
```
http://your-server/prerequisite-checker/api.php/moodle/test
```

## 📖 사용 가이드

### 학생 전제지식 체크

1. 대시보드에서 "학생 전제지식 체크" 카드로 이동
2. 학생의 Moodle ID 입력
3. 확인할 지식 개념 선택
4. "전제지식 확인" 버튼 클릭
5. 결과 확인:
   - ✅ **준비 완료**: 학습 가능
   - ⚠️ **준비 부족**: 부족한 전제지식 표시

### 코스 전체 평가

1. "코스 평가" 카드에서 Moodle 코스 선택
2. "전체 학생 평가" 버튼 클릭
3. 모든 학생의 성적 데이터를 분석하여 지식 수준 업데이트

### 지식 개념 관리

- 하단 테이블에서 모든 지식 개념 확인
- "보기" 버튼으로 전제지식 관계 트리 확인

## 🔌 API 엔드포인트

### 시스템 상태

```
GET /api.php/test
GET /api.php/moodle/test
GET /api.php/moodle/siteinfo
```

### Moodle 데이터

```
GET /api.php/moodle/courses
GET /api.php/moodle/course/{id}
GET /api.php/moodle/course/{id}/users
```

### 지식 개념

```
GET /api.php/concepts
GET /api.php/concept/{id}
GET /api.php/concept/{id}/tree
```

### 학생 평가

```
GET /api.php/student/{user_id}/knowledge
GET /api.php/student/{user_id}/concept/{concept_id}/check
GET /api.php/student/{user_id}/concept/{concept_id}/path
POST /api.php/assess/student
POST /api.php/assess/course
```

### 추천

```
GET /api.php/recommendations/{user_id}/{module_id}
```

## 📊 데이터베이스 구조

### 주요 테이블

- **knowledge_concepts**: 지식 개념 정의
- **concept_prerequisites**: 전제지식 관계 그래프
- **student_knowledge**: 학생별 지식 숙달 수준
- **moodle_courses**: Moodle 코스 캐시
- **moodle_modules**: Moodle 모듈/활동 정보
- **module_concepts**: 모듈과 지식 개념 매핑
- **recommendations**: 학습 추천 내역

## 🔧 문제 해결

### Moodle 연결 실패

1. Moodle URL 확인 (https:// 포함)
2. Web Services 토큰 유효성 확인
3. Moodle Web Services 활성화 상태 확인
4. 방화벽/네트워크 설정 확인

### 데이터베이스 연결 오류

1. MySQL 서비스 실행 상태 확인
2. 데이터베이스 사용자 권한 확인
3. config.php의 데이터베이스 설정 확인

### 로그 확인

```bash
# 데이터베이스 에러 로그
tail -f logs/database_errors.log

# Moodle API 로그
tail -f logs/moodle_api.log
```

## 🔐 보안 고려사항

- **config.php 보호**: 웹에서 직접 접근 불가능하도록 설정
- **SQL Injection 방지**: PDO Prepared Statements 사용
- **XSS 방지**: 출력 데이터 이스케이프
- **HTTPS 사용**: 프로덕션 환경에서 필수
- **토큰 관리**: Moodle 토큰을 안전하게 보관

## 📝 라이선스

MIT License

## 👥 기여

기여를 환영합니다! Issue나 Pull Request를 자유롭게 제출해주세요.

## 📞 지원

문의사항이 있으시면 이슈를 등록해주세요.

---

**버전**: 1.0.0
**최종 업데이트**: 2025-11-18

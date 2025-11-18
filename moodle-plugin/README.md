# Fluid Geometry Moodle Plugin

Moodle 3.7+ 플러그인으로 Fluid Geometry 웹앱과 연동됩니다.

## 설치 방법

### 1. 파일 복사

```bash
# Moodle 설치 디렉토리로 이동
cd /var/www/html/moodle  # 실제 Moodle 경로로 변경

# 플러그인 복사
cp -r local/fluidgeometry /var/www/html/moodle/local/
```

### 2. 데이터베이스 업그레이드

1. Moodle 관리자로 로그인
2. **사이트 관리 > 알림**으로 이동
3. "데이터베이스 업그레이드" 버튼 클릭
4. 플러그인 설치 확인

### 3. Web Services 설정

#### 3.1 Web Services 활성화

1. **사이트 관리 > 고급 기능**
   - ✅ "Enable web services" 체크
   - 저장

2. **사이트 관리 > 플러그인 > Web services > 개요**
   - 모든 단계 확인 및 설정

#### 3.2 REST Protocol 활성화

1. **사이트 관리 > 플러그인 > Web services > 프로토콜 관리**
   - REST protocol 활성화

#### 3.3 외부 서비스 생성

1. **사이트 관리 > 서버 > Web services > 외부 서비스**
2. "외부 서비스 추가" 클릭
3. 다음 정보 입력:
   - **이름**: Fluid Geometry Service
   - **짧은 이름**: fluidgeometry
   - **활성화**: 체크
   - **승인된 사용자만**: 체크 해제 (또는 필요에 따라)
   - **파일 다운로드**: 체크 해제
   - **파일 업로드**: 체크 해제

4. "함수 추가" 클릭하여 다음 함수들 추가:
   - `local_fluidgeometry_get_problem`
   - `local_fluidgeometry_get_problems`
   - `local_fluidgeometry_submit_attempt`
   - `local_fluidgeometry_get_attempts`

#### 3.4 토큰 생성

1. **사이트 관리 > 서버 > Web services > 토큰 관리**
2. "토큰 생성" 클릭
3. 다음 정보 입력:
   - **사용자**: 웹앱에서 사용할 사용자 선택
   - **서비스**: Fluid Geometry Service
4. 생성된 토큰 복사 (이 토큰을 프론트엔드 `.env` 파일에 사용)

### 4. 권한 설정

필요한 경우 사용자 역할에 다음 권한 추가:

- `local/fluidgeometry:view` - 문제 보기
- `local/fluidgeometry:submit` - 답안 제출

### 5. 테스트 데이터 추가

데이터베이스에 직접 테스트 문제 추가:

```sql
INSERT INTO mdl_fluidgeometry_problems
(name, intro, shapetype, difficulty, timecreated, timemodified)
VALUES
('삼각형의 성질', '삼각형이 물처럼 흐를 때 면적과 둘레를 관찰하세요', 'triangle', 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
('사각형의 변환', '사각형의 기하학적 불변량을 탐구하세요', 'rectangle', 2, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
('원의 특성', '원이 움직일 때 성질이 어떻게 유지되는지 확인하세요', 'circle', 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
('다각형 탐구', '육각형의 대칭성과 성질을 학습하세요', 'polygon', 3, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
```

## API 테스트

### cURL을 이용한 테스트

```bash
# 문제 목록 가져오기
curl -X POST "https://your-moodle-site.com/webservice/rest/server.php" \
  -d "wstoken=YOUR_TOKEN_HERE" \
  -d "wsfunction=local_fluidgeometry_get_problems" \
  -d "moodlewsrestformat=json"

# 특정 문제 가져오기
curl -X POST "https://your-moodle-site.com/webservice/rest/server.php" \
  -d "wstoken=YOUR_TOKEN_HERE" \
  -d "wsfunction=local_fluidgeometry_get_problem" \
  -d "problemid=1" \
  -d "moodlewsrestformat=json"
```

## 문제 해결

### 플러그인이 보이지 않음
- Moodle 캐시 삭제: **사이트 관리 > 개발 > 캐시 삭제**
- 파일 권한 확인: `chown -R www-data:www-data local/fluidgeometry`

### Web Service 오류
- 오류 로그 확인: **사이트 관리 > 서버 > Web services > 기능 테스트**
- 디버깅 활성화: **사이트 관리 > 개발 > 디버깅**

### 데이터베이스 오류
- 수동 설치: Moodle 데이터베이스에서 `install.xml` 참조하여 테이블 생성

## 데이터베이스 스키마

### fluidgeometry_problems
- `id` (int): Primary Key
- `name` (varchar 255): 문제 이름
- `intro` (text): 문제 설명
- `shapetype` (varchar 50): 도형 유형 (triangle, rectangle, circle, polygon)
- `difficulty` (int): 난이도 (1-3)
- `timecreated` (int): 생성 시간
- `timemodified` (int): 수정 시간

### fluidgeometry_attempts
- `id` (int): Primary Key
- `problemid` (int): Foreign Key → fluidgeometry_problems
- `userid` (int): Foreign Key → mdl_user
- `starttime` (int): 시작 시간
- `endtime` (int): 종료 시간
- `area` (decimal): 측정된 면적
- `perimeter` (decimal): 측정된 둘레
- `vertices` (int): 꼭짓점 개수
- `score` (decimal): 점수

## 지원

이슈가 있을 경우:
1. Moodle 오류 로그 확인
2. 웹 서버 오류 로그 확인 (`/var/log/apache2/error.log`)
3. GitHub Issues에 보고

## 라이선스

GPL v3

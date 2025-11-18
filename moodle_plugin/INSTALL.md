# Alternative Solutions for Moodle 3.7 - Installation Guide

## 시스템 요구사항

- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹서버**: Apache 2.4+ 또는 Nginx 1.14+

## 설치 방법

### 1. 플러그인 파일 복사

Moodle 설치 디렉토리의 `mod/` 폴더에 플러그인을 복사합니다:

```bash
cd /path/to/moodle
cp -r /path/to/moodle_plugin/mod/altsolutions mod/
```

### 2. 권한 설정

웹서버가 파일을 읽을 수 있도록 권한을 설정합니다:

```bash
chown -R www-data:www-data mod/altsolutions
chmod -R 755 mod/altsolutions
```

### 3. Moodle 업그레이드

웹 브라우저에서 Moodle 사이트에 관리자로 로그인하면 자동으로 플러그인 설치 화면이 표시됩니다.

또는 다음 URL을 직접 방문:
```
https://your-moodle-site.com/admin/index.php
```

### 4. 데이터베이스 설치

Moodle이 자동으로 다음 테이블을 생성합니다:

- `mdl_altsolutions` - 활동 인스턴스
- `mdl_altsolutions_steps` - 문제 해결 단계
- `mdl_altsolutions_attempts` - 학생 시도 기록
- `mdl_altsolutions_alternatives` - 대안적 접근 방법
- `mdl_altsolutions_reflections` - 성찰 기록

### 5. 플러그인 활성화 확인

**사이트 관리 > 플러그인 > 활동 모듈 > Alternative Solutions** 에서 플러그인이 정상적으로 설치되었는지 확인합니다.

## 사용 방법

### 교사용

1. 코스로 이동
2. "활동 또는 리소스 추가" 클릭
3. "대안적 풀이" 선택
4. 활동 설정:
   - 활동 이름 입력
   - 문제 설명 작성
   - 최소 단계 수 설정 (기본값: 3)
   - 최소 대안 수 설정 (기본값: 2)
5. 저장 후 "단계 관리"에서 각 단계 추가/편집

### 학생용

1. 활동 페이지 접속
2. "풀이 시작" 클릭
3. 각 단계마다:
   - 최소 2개 이상의 대안적 접근 방법 탐색
   - 선택한 접근 방법으로 풀이 작성
   - 자신감 수준 표시
4. 모든 단계 완료 후 성찰 작성
5. 요약 페이지에서 전체 풀이 과정 확인

## 주요 기능

### 1. 대안적 사고 유도
학생들이 각 단계에서 여러 접근 방법을 고려하도록 강제합니다.

### 2. 단계별 문제 해결
복잡한 문제를 관리 가능한 단계로 분해합니다.

### 3. 메타인지 개발
성찰 활동을 통해 자신의 문제 해결 과정을 돌아봅니다.

### 4. 진행 상황 추적
교사는 학생들의 사고 과정과 대안 탐색을 모니터링할 수 있습니다.

## 문제 해결

### 플러그인이 목록에 나타나지 않는 경우

1. 파일 권한 확인:
   ```bash
   ls -la mod/altsolutions
   ```

2. Moodle 캐시 삭제:
   **사이트 관리 > 개발 > 캐시 제거**

3. version.php의 버전 번호 확인

### 데이터베이스 오류

MySQL 버전 확인:
```sql
SELECT VERSION();
```

MySQL 5.7 이상이어야 합니다.

### 권한 오류

학생이 제출할 수 없는 경우:
**활동 설정 > 권한 > mod/altsolutions:submit** 확인

## 업그레이드

새 버전으로 업그레이드:

1. 기존 플러그인 백업
2. 새 파일로 덮어쓰기
3. Moodle 업그레이드 프로세스 실행

## 삭제

플러그인 완전 제거:

1. **사이트 관리 > 플러그인 > 활동 모듈 > Alternative Solutions > 삭제**
2. 모든 데이터와 테이블이 자동으로 제거됩니다

## 지원

문제가 발생하면 다음을 확인하세요:

- Moodle 로그: **사이트 관리 > 리포트 > 로그**
- PHP 오류 로그: `/var/log/php/error.log`
- Moodle 디버그 모드 활성화

## 라이선스

GPL v3 - GNU General Public License version 3

## 개발자

KAIST Touch Math Academy
Copyright 2025

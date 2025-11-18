# Goal Writing Activity Module for Moodle 3.7

## 개요 (Overview)

Goal Writing은 Moodle 3.7을 위한 활동 모듈로, 학생들이 문제의 학습 목표를 스스로 문장으로 작성할 수 있게 해줍니다. 이를 통해 학생들은 자신의 학습 목표를 명확히 이해하고 표현하는 능력을 기를 수 있습니다.

The Goal Writing activity module for Moodle 3.7 enables students to articulate their learning objectives in their own words. This helps students develop a clear understanding of what they aim to achieve and improves their ability to express learning goals.

## 주요 기능 (Key Features)

### 학생용 기능 (Student Features)
- 📝 학습 목표를 자유롭게 작성
- 💾 임시 저장 기능
- ✅ 제출 전 단어 수 검증
- 📊 실시간 단어 수 표시
- 🔄 재제출 기능 (선택적)
- 📨 교사 피드백 확인

### 교사용 기능 (Teacher Features)
- 👥 모든 학생 제출물 조회
- 💬 개별 피드백 제공
- 📈 성적 부여 (0-100)
- 📋 제출 상태 추적
- ⚙️ 최소/최대 단어 수 설정
- 🔒 재제출 허용 여부 설정

## 시스템 요구사항 (System Requirements)

- **Moodle**: 3.7 or higher
- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher
- **Browser**: Modern browsers (Chrome, Firefox, Safari, Edge)

## 설치 방법 (Installation)

### 방법 1: 수동 설치 (Manual Installation)

1. 이 저장소를 복제하거나 다운로드합니다:
```bash
cd /path/to/moodle
git clone <repository-url> mod/goalwriting
```

2. Moodle 관리자로 로그인합니다.

3. 사이트 관리 > 알림(Notifications)으로 이동합니다.

4. Moodle이 자동으로 새 플러그인을 감지하고 설치 과정을 안내합니다.

5. "데이터베이스 업그레이드" 버튼을 클릭하여 설치를 완료합니다.

### 방법 2: ZIP 파일을 통한 설치

1. 이 모듈을 ZIP 파일로 다운로드합니다.

2. Moodle 관리자로 로그인합니다.

3. 사이트 관리 > 플러그인 > 플러그인 설치로 이동합니다.

4. ZIP 파일을 업로드하고 "ZIP 파일에서 플러그인 설치" 버튼을 클릭합니다.

5. 설치 과정을 따라 완료합니다.

## 사용 방법 (Usage)

### 교사용 가이드 (Teacher Guide)

#### 1. 활동 추가하기
1. 코스 페이지로 이동합니다
2. "활동 또는 리소스 추가"를 클릭합니다
3. "목표 작성 (Goal Writing)"을 선택합니다
4. 활동 설정을 구성합니다:
   - **활동 이름**: 활동의 이름을 입력합니다
   - **소개**: 활동에 대한 설명을 작성합니다
   - **문제 설명**: 학생들이 목표를 작성할 문제나 주제를 설명합니다
   - **최소 단어 수**: 필요한 최소 단어 수 (기본값: 10)
   - **최대 단어 수**: 허용되는 최대 단어 수 (기본값: 500)
   - **재제출 허용**: 체크하면 학생들이 피드백 후 재제출 가능
5. "저장하고 코스로 돌아가기" 또는 "저장하고 표시"를 클릭합니다

#### 2. 학생 제출물 검토하기
1. Goal Writing 활동을 엽니다
2. "제출물 보기" 버튼을 클릭합니다
3. 학생 목록과 제출 상태를 확인합니다
4. "제출물 보기"를 클릭하여 개별 학생의 작성 내용을 확인합니다

#### 3. 피드백 제공하기
1. 학생의 제출물을 엽니다
2. 학생이 작성한 학습 목표를 검토합니다
3. "피드백 제공" 섹션에서:
   - 교사 피드백을 작성합니다
   - 성적을 부여합니다 (0-100)
4. "피드백 저장" 버튼을 클릭합니다

### 학생용 가이드 (Student Guide)

#### 1. 학습 목표 작성하기
1. Goal Writing 활동을 엽니다
2. 문제 설명을 읽습니다
3. 텍스트 영역에 학습 목표를 작성합니다
4. 실시간으로 표시되는 단어 수를 확인합니다
5. "임시 저장" 또는 "목표 제출"을 클릭합니다

#### 2. 제출 전 확인사항
- 최소 단어 수 요구사항을 충족하는지 확인
- 최대 단어 수를 초과하지 않는지 확인
- 학습 목표가 명확하고 구체적인지 검토

#### 3. 피드백 확인하기
1. Goal Writing 활동을 다시 방문합니다
2. 교사가 제공한 피드백과 성적을 확인합니다
3. 재제출이 허용된 경우, 피드백을 반영하여 수정할 수 있습니다

## 데이터베이스 구조 (Database Structure)

### goalwriting 테이블
메인 활동 인스턴스 정보를 저장합니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 고유 식별자 |
| course | INT | 코스 ID |
| name | VARCHAR | 활동 이름 |
| intro | TEXT | 활동 소개 |
| problemtext | TEXT | 문제 설명 |
| minwords | INT | 최소 단어 수 |
| maxwords | INT | 최대 단어 수 |
| allowresubmit | INT | 재제출 허용 여부 |
| timecreated | INT | 생성 시간 |
| timemodified | INT | 수정 시간 |

### goalwriting_submissions 테이블
학생 제출물을 저장합니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 고유 식별자 |
| goalwritingid | INT | 활동 ID |
| userid | INT | 학생 ID |
| goaltext | TEXT | 학생이 작성한 목표 |
| wordcount | INT | 단어 수 |
| status | VARCHAR | 상태 (draft/submitted/reviewed) |
| teacherfeedback | TEXT | 교사 피드백 |
| grade | INT | 성적 (0-100) |
| timecreated | INT | 생성 시간 |
| timemodified | INT | 수정 시간 |
| timesubmitted | INT | 제출 시간 |

## 권한 (Capabilities)

- `mod/goalwriting:addinstance` - 새 활동 추가
- `mod/goalwriting:view` - 활동 보기
- `mod/goalwriting:submit` - 목표 제출
- `mod/goalwriting:grade` - 제출물 채점
- `mod/goalwriting:viewallsubmissions` - 모든 제출물 보기

## 다국어 지원 (Language Support)

이 모듈은 다음 언어를 지원합니다:
- 한국어 (Korean)
- 영어 (English)

추가 언어 번역은 `mod/goalwriting/lang/` 디렉토리에 추가할 수 있습니다.

## 문제 해결 (Troubleshooting)

### 설치 오류
- Moodle 버전이 3.7 이상인지 확인하세요
- PHP 버전이 7.1.9 이상인지 확인하세요
- 파일 권한이 올바르게 설정되어 있는지 확인하세요

### 데이터베이스 오류
- Moodle의 알림 페이지에서 데이터베이스 업그레이드를 실행했는지 확인하세요
- MySQL 버전이 5.7 이상인지 확인하세요

### 제출이 되지 않을 때
- 최소/최대 단어 수 요구사항을 확인하세요
- 브라우저의 JavaScript가 활성화되어 있는지 확인하세요

## 개발자 정보 (Developer Information)

### 파일 구조
```
mod/goalwriting/
├── db/
│   ├── access.php          # 권한 정의
│   └── install.xml         # 데이터베이스 스키마
├── lang/
│   ├── en/                 # 영어 언어 파일
│   │   └── goalwriting.php
│   └── ko/                 # 한국어 언어 파일
│       └── goalwriting.php
├── index.php               # 코스 내 모든 인스턴스 목록
├── lib.php                 # 핵심 함수
├── mod_form.php            # 활동 설정 폼
├── styles.css              # CSS 스타일
├── submissions.php         # 교사용 제출물 조회 페이지
├── version.php             # 버전 정보
├── view.php                # 학생용 메인 페이지
└── README.md               # 이 파일
```

### API 함수

주요 함수들:
- `goalwriting_add_instance()` - 새 인스턴스 생성
- `goalwriting_update_instance()` - 인스턴스 업데이트
- `goalwriting_delete_instance()` - 인스턴스 삭제
- `goalwriting_get_user_submission()` - 사용자 제출물 조회
- `goalwriting_save_submission()` - 제출물 저장
- `goalwriting_count_words()` - 단어 수 계산
- `goalwriting_update_grades()` - 성적 업데이트

## 라이선스 (License)

이 프로그램은 자유 소프트웨어입니다. GNU General Public License v3 이상의 조건에 따라 재배포 및/또는 수정할 수 있습니다.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

## 기여하기 (Contributing)

버그 리포트, 기능 제안, 풀 리퀘스트를 환영합니다!

## 지원 (Support)

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.

## 제작 (Credits)

**Copyright**: 2025 KAIST Touch Math Academy
**Developer**: AI Education System Team

## 버전 히스토리 (Version History)

### v1.0.0 (2025-01-18)
- 초기 릴리스
- 학생 목표 작성 기능
- 교사 피드백 및 채점 기능
- 한국어/영어 지원
- Moodle 3.7 호환

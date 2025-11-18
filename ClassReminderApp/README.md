# 수업 알리미 (Class Reminder App) 📚

LMS에서 시간표 정보를 가져와 **수업 1시간 전에 재미있고 기괴한 방식으로 알림을 보내는** 안드로이드 앱입니다!

## ✨ 주요 기능

### 🎭 다양한 알림 모드
수업 알림을 7가지 재미있는 모드로 받아보세요!

1. **👻 공포 모드**: 섬뜩하고 오싹한 메시지로 수업을 알려줍니다
   - "후후후... 컴퓨터과학개론 수업이 1시간 뒤에 너를 기다리고 있다..."

2. **😱 놀람 모드**: 깜짝 놀랄 만한 강렬한 알림!
   - "띠링!!! 수업이야!!! 1시간 남았어!!!"

3. **🌱 신선 모드**: 상큼하고 긍정적인 메시지
   - "상큼한 아침! 수업이 1시간 뒤에 시작돼요 🌅"

4. **🎨 기분환기 모드**: 창의적이고 재미있는 컨셉
   - "우주에서 온 메시지: 컴퓨터과학 행성 도착까지 1시간 🚀"

5. **🐱 귀여움 모드**: 사랑스럽고 귀여운 메시지
   - "냥냥! 수업이 1시간 뒤옹~ 😺"

6. **📚 진지 모드**: 정확하고 명확한 정보 전달
   - "컴퓨터과학개론 수업이 1시간 후 시작됩니다."

7. **💪 동기부여 모드**: 열정적이고 격려하는 메시지
   - "할 수 있다! 컴퓨터과학으로 미래를 개척하자! 🔥"

### 🎨 10가지 테마/스킨

앱 디자인을 자신의 취향에 맞게 커스터마이징하세요!

- 🦇 다크 호러
- ⚡ 네온 사이버
- 🌸 파스텔 드림
- 🌊 오션 블루
- 🌲 포레스트 그린
- 🌅 선셋 오렌지
- 🌌 갤럭시 퍼플
- 🎮 레트로 게임
- 🍭 캔디 팝
- ⚪ 미니멀리스트

### 📅 시간표 관리

- LMS 자동 동기화 (LMS API 지원 필요)
- 샘플 데이터로 테스트 가능
- 수업별 색상 지정
- 요일, 시간, 강의실 정보 표시

### ⏰ 스마트 알림 시스템

- 수업 시작 1시간 전 자동 알림
- 주간 반복 스케줄링
- 진동, 소리 커스터마이징
- 부팅 시 자동 알람 재설정

## 🚀 시작하기

### 요구사항

- Android 7.0 (API 24) 이상
- 인터넷 연결 (LMS 동기화 시)
- 알림 권한

### 설치 방법

1. 프로젝트 클론
```bash
git clone <repository-url>
cd ClassReminderApp
```

2. Android Studio에서 프로젝트 열기

3. Gradle 동기화 대기

4. 앱 실행 (에뮬레이터 또는 실제 기기)

### 첫 사용 가이드

1. **샘플 데이터로 시작하기** (추천)
   - 메인 화면에서 "LMS 동기화" 버튼 클릭
   - "샘플 데이터 사용" 버튼 클릭
   - 5개의 샘플 수업이 자동으로 추가됩니다

2. **LMS 연동하기**
   - 설정(톱니바퀴 아이콘) 클릭
   - LMS URL, 사용자 ID, 비밀번호 입력
   - "LMS 동기화" 버튼으로 시간표 가져오기

3. **알림 모드 선택**
   - 메인 화면 상단의 "알림 모드" 드롭다운에서 원하는 모드 선택

4. **테마 변경**
   - 메인 화면 상단의 "앱 테마" 드롭다운에서 원하는 테마 선택

5. **알림 테스트**
   - "알림 테스트" 버튼으로 알림 미리보기

## 📱 화면 구성

### 메인 화면
- 시간표 목록 표시
- 알림 모드 선택
- 테마 선택
- LMS 동기화 버튼
- 알림 테스트 버튼

### 설정 화면
- 알림 활성화/비활성화
- 진동 설정
- 소리 설정
- LMS 연동 정보 입력

### LMS 로그인 화면
- LMS URL 입력
- 사용자 인증 정보 입력
- 샘플 데이터 로드 옵션

## 🔧 기술 스택

- **Language**: Kotlin
- **UI**: Material Design Components
- **Architecture**: MVVM (추천), 현재는 Simple Activity-based
- **Local Storage**: SharedPreferences + Gson
- **Networking**: Retrofit2 + OkHttp3
- **Async**: Coroutines
- **Notification**: AlarmManager + NotificationCompat

## 📂 프로젝트 구조

```
com.classreminder/
├── activities/          # 액티비티들
│   ├── MainActivity
│   ├── SettingsActivity
│   └── LmsLoginActivity
├── adapters/            # RecyclerView 어댑터
│   └── CourseAdapter
├── models/              # 데이터 모델
│   ├── Course
│   ├── NotificationMode
│   └── AppTheme
├── notifications/       # 알림 관련
│   ├── NotificationHelper
│   └── AlarmReceiver
├── services/            # 백그라운드 서비스
│   ├── NotificationSchedulerService
│   └── BootReceiver
└── utils/               # 유틸리티
    ├── PreferencesManager
    ├── AlarmScheduler
    └── LmsParser
```

## 🔌 LMS 연동 가이드

현재 `LmsParser` 클래스는 일반적인 LMS 구조를 가정한 예시입니다.
실제 사용하는 LMS에 맞게 커스터마이징이 필요합니다.

### 커스터마이징 방법

1. `utils/LmsParser.kt` 파일 열기

2. `login()` 메서드 수정
   - 실제 LMS 로그인 API 엔드포인트에 맞게 수정
   - 인증 방식 조정 (Form, OAuth, etc.)

3. `fetchTimetable()` 메서드 수정
   - 시간표 조회 API 엔드포인트에 맞게 수정
   - 응답 JSON 파싱 로직 조정

4. HTML 파싱이 필요한 경우
   - Jsoup 라이브러리 추가
   ```gradle
   implementation 'org.jsoup:jsoup:1.16.1'
   ```
   - HTML 파싱 로직 구현

### 예상 JSON 형식

```json
[
  {
    "id": "CS101",
    "name": "컴퓨터과학개론",
    "instructor": "홍길동",
    "room": "공학관 101",
    "dayOfWeek": "MONDAY",
    "startTime": "09:00",
    "endTime": "10:30"
  }
]
```

## 🎯 주요 클래스 설명

### NotificationMode
알림 모드별 메시지를 관리하는 Enum 클래스
- 각 모드마다 8개 이상의 다양한 메시지 보유
- 랜덤 메시지 선택 기능
- 수업 정보를 동적으로 삽입

### AppTheme
앱 테마를 관리하는 Enum 클래스
- 10가지 프리셋 테마
- 색상 값을 Int로 변환하는 헬퍼 메서드

### AlarmScheduler
수업 알람 스케줄링 담당
- 주간 반복 알람 설정
- 다음 알람 시간 자동 계산
- 알람 취소 기능

### PreferencesManager
앱 설정 및 데이터 저장 관리
- 싱글톤 패턴
- SharedPreferences 래퍼
- Gson을 이용한 객체 직렬화

## 🔔 알림 권한 안내

Android 13 (API 33) 이상에서는 런타임에 알림 권한을 요청해야 합니다.
현재 버전은 자동으로 권한을 처리하지만, 사용자가 설정에서 권한을 거부한 경우
앱 설정으로 이동하여 권한을 허용해야 합니다.

## 🐛 알려진 이슈

1. LMS 파서는 샘플 구현이므로 실제 LMS에 맞게 수정 필요
2. Android 12 이상에서 정확한 알람을 위해 `SCHEDULE_EXACT_ALARM` 권한 필요
3. 배터리 최적화로 인해 알림이 지연될 수 있음 (설정에서 배터리 최적화 제외 필요)

## 🚀 향후 개발 계획

- [ ] Room Database 도입 (SQLite)
- [ ] ViewModel + LiveData 패턴 적용
- [ ] 수업 추가/수정 UI
- [ ] 위젯 지원
- [ ] 출석 체크 기능
- [ ] 과제 마감일 알림
- [ ] 다크모드 완전 지원
- [ ] 다국어 지원
- [ ] 커스텀 알림 사운드
- [ ] 알림 히스토리

## 📄 라이선스

이 프로젝트는 교육 목적으로 만들어졌습니다.

## 🤝 기여하기

버그 리포트, 기능 제안, Pull Request를 환영합니다!

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

**즐거운 학교생활 되세요!** 🎓✨

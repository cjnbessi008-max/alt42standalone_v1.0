# Moodle ASMR & Sound Effects Integration - 설계 문서

## 1. 개요

### 목적
Moodle 3.7 LMS에 멘탈 안정을 위한 ASMR과 짧은 효과음을 제공하는 플러그인 개발

### 타겟 환경
- **Moodle 버전**: 3.7
- **PHP 버전**: 7.1.9
- **데이터베이스**: MySQL 5.7
- **브라우저**: Chrome, Firefox, Safari (최신 2개 버전)

### 주요 기능
1. **ASMR 사운드 라이브러리**: 집중력, 휴식, 명상용 사운드
2. **짧은 효과음**: 알림, 성취, 피드백용 효과음
3. **학생 맞춤 설정**: 개인별 볼륨, 선호 사운드 저장
4. **코스/활동 통합**: 교사가 특정 활동에 사운드 연결
5. **사용 분석**: 학생 웰빙 데이터 수집

---

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│              Moodle Frontend (JavaScript)           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Audio Player│  │ Control Panel│  │ Preference │ │
│  │   Widget    │  │   (Teachers) │  │   (Students)│ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
└───────────────────────┬─────────────────────────────┘
                        │ AJAX API Calls
┌───────────────────────▼─────────────────────────────┐
│         Moodle Local Plugin (PHP 7.1)               │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │Sound Library │  │ User Prefs  │  │ Analytics  │ │
│  │   Manager    │  │   Manager   │  │  Tracker   │ │
│  └──────────────┘  └─────────────┘  └────────────┘ │
└───────────────────────┬─────────────────────────────┘
                        │ SQL Queries
┌───────────────────────▼─────────────────────────────┐
│              MySQL 5.7 Database                     │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │mdl_asmr_     │  │mdl_asmr_    │  │mdl_asmr_   │ │
│  │sounds        │  │user_prefs   │  │usage_log   │ │
│  └──────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────┐
│         Audio Files Storage (moodledata)            │
│  /moodledata/asmr/ambient/   (ASMR sounds)          │
│  /moodledata/asmr/effects/   (Short effects)        │
└─────────────────────────────────────────────────────┘
```

---

## 3. 데이터베이스 스키마

### 3.1 mdl_asmr_sounds (사운드 라이브러리)
```sql
CREATE TABLE mdl_asmr_sounds (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT '사운드 이름',
    category ENUM('asmr', 'effect') NOT NULL DEFAULT 'asmr',
    subcategory VARCHAR(100) DEFAULT NULL COMMENT '세부 카테고리 (rain, forest, success, notification)',
    filename VARCHAR(255) NOT NULL COMMENT '파일명 (mp3, ogg, wav)',
    filepath TEXT NOT NULL COMMENT '파일 경로',
    duration INT(10) DEFAULT 0 COMMENT '재생 시간 (초)',
    filesize BIGINT(20) DEFAULT 0 COMMENT '파일 크기 (bytes)',
    mimetype VARCHAR(100) DEFAULT 'audio/mpeg',
    description TEXT DEFAULT NULL COMMENT '설명',
    tags TEXT DEFAULT NULL COMMENT 'JSON 배열 형식 태그',
    isactive TINYINT(1) DEFAULT 1 COMMENT '활성화 여부',
    playcount BIGINT(20) DEFAULT 0 COMMENT '총 재생 횟수',
    rating DECIMAL(3,2) DEFAULT 0.00 COMMENT '평점 (0-5)',
    uploadedby BIGINT(10) UNSIGNED DEFAULT NULL COMMENT '업로드한 사용자 ID',
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,

    INDEX idx_category (category),
    INDEX idx_subcategory (subcategory),
    INDEX idx_active (isactive),
    FOREIGN KEY (uploadedby) REFERENCES mdl_user(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ASMR 및 효과음 라이브러리';
```

### 3.2 mdl_asmr_user_prefs (사용자 선호도)
```sql
CREATE TABLE mdl_asmr_user_prefs (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL,
    prefkey VARCHAR(100) NOT NULL COMMENT '설정 키 (volume, auto_play, favorite_sounds)',
    prefvalue TEXT DEFAULT NULL COMMENT '설정 값 (JSON 형식)',
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,

    UNIQUE KEY userid_prefkey (userid, prefkey),
    INDEX idx_userid (userid),
    FOREIGN KEY (userid) REFERENCES mdl_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자별 ASMR 설정';
```

### 3.3 mdl_asmr_activity_sounds (활동-사운드 연결)
```sql
CREATE TABLE mdl_asmr_activity_sounds (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    courseid BIGINT(10) UNSIGNED NOT NULL,
    cmid BIGINT(10) UNSIGNED DEFAULT NULL COMMENT 'Course module ID (특정 활동)',
    soundid BIGINT(10) UNSIGNED NOT NULL,
    trigger_event VARCHAR(100) NOT NULL COMMENT 'mod_viewed, quiz_submitted, assignment_graded',
    auto_play TINYINT(1) DEFAULT 0 COMMENT '자동 재생 여부',
    loop_play TINYINT(1) DEFAULT 0 COMMENT '반복 재생 여부',
    volume INT(3) DEFAULT 70 COMMENT '기본 볼륨 (0-100)',
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    createdby BIGINT(10) UNSIGNED NOT NULL,

    INDEX idx_course (courseid),
    INDEX idx_cm (cmid),
    INDEX idx_sound (soundid),
    INDEX idx_trigger (trigger_event),
    FOREIGN KEY (courseid) REFERENCES mdl_course(id) ON DELETE CASCADE,
    FOREIGN KEY (cmid) REFERENCES mdl_course_modules(id) ON DELETE CASCADE,
    FOREIGN KEY (soundid) REFERENCES mdl_asmr_sounds(id) ON DELETE CASCADE,
    FOREIGN KEY (createdby) REFERENCES mdl_user(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='코스/활동별 사운드 설정';
```

### 3.4 mdl_asmr_usage_log (사용 분석)
```sql
CREATE TABLE mdl_asmr_usage_log (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL,
    soundid BIGINT(10) UNSIGNED NOT NULL,
    courseid BIGINT(10) UNSIGNED DEFAULT NULL,
    cmid BIGINT(10) UNSIGNED DEFAULT NULL,
    action VARCHAR(50) NOT NULL COMMENT 'play, pause, stop, skip, complete',
    duration_listened INT(10) DEFAULT 0 COMMENT '청취 시간 (초)',
    volume_level INT(3) DEFAULT 70 COMMENT '재생 볼륨',
    device_type VARCHAR(50) DEFAULT NULL COMMENT 'desktop, mobile, tablet',
    timecreated BIGINT(10) UNSIGNED NOT NULL,

    INDEX idx_userid (userid),
    INDEX idx_soundid (soundid),
    INDEX idx_course (courseid),
    INDEX idx_action (action),
    INDEX idx_time (timecreated),
    FOREIGN KEY (userid) REFERENCES mdl_user(id) ON DELETE CASCADE,
    FOREIGN KEY (soundid) REFERENCES mdl_asmr_sounds(id) ON DELETE CASCADE,
    FOREIGN KEY (courseid) REFERENCES mdl_course(id) ON DELETE SET NULL,
    FOREIGN KEY (cmid) REFERENCES mdl_course_modules(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ASMR 사용 로그';
```

### 3.5 mdl_asmr_playlists (재생목록)
```sql
CREATE TABLE mdl_asmr_playlists (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    sound_ids TEXT NOT NULL COMMENT 'JSON 배열: 사운드 ID 목록',
    is_public TINYINT(1) DEFAULT 0 COMMENT '공개 여부',
    play_count BIGINT(20) DEFAULT 0,
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,

    INDEX idx_userid (userid),
    INDEX idx_public (is_public),
    FOREIGN KEY (userid) REFERENCES mdl_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 재생목록';
```

---

## 4. 사운드 카테고리 구조

### 4.1 ASMR 사운드 (장시간 배경음)
```
asmr/
├── nature/          자연 소리
│   ├── rain         빗소리 (가벼운 비, 폭우, 천둥)
│   ├── ocean        파도 소리
│   ├── forest       숲 소리 (새소리, 바람)
│   └── stream       계곡물 소리
├── ambient/         앰비언트
│   ├── cafe         카페 소음
│   ├── library      도서관 분위기
│   ├── white_noise  백색소음
│   └── pink_noise   핑크노이즈
├── meditation/      명상
│   ├── singing_bowl 싱잉볼
│   ├── chimes       차임벨
│   └── breathing    호흡 가이드
└── focus/           집중
    ├── lo-fi        로파이 비트
    ├── classical    클래식 음악
    └── binaural     바이노럴 비트
```

### 4.2 효과음 (짧은 피드백)
```
effects/
├── success/         성공
│   ├── achievement  업적 달성 (1-3초)
│   ├── level_up     레벨업
│   └── complete     완료
├── notification/    알림
│   ├── message      메시지 도착
│   ├── reminder     리마인더
│   └── gentle_bell  부드러운 종소리
├── interaction/     상호작용
│   ├── click        클릭음
│   ├── hover        호버음
│   └── transition   전환음
└── feedback/        피드백
    ├── correct      정답
    ├── incorrect    오답
    └── try_again    재시도
```

---

## 5. Moodle 플러그인 구조

### 5.1 디렉토리 구조
```
/local/asmr/
├── version.php                 # 플러그인 버전 정보
├── settings.php                # 관리자 설정 페이지
├── lang/
│   ├── en/
│   │   └── local_asmr.php     # 영어 언어팩
│   └── ko/
│       └── local_asmr.php     # 한국어 언어팩
├── db/
│   ├── install.xml            # 데이터베이스 설치 스키마
│   ├── upgrade.php            # 업그레이드 스크립트
│   ├── access.php             # 권한 정의
│   └── events.php             # 이벤트 핸들러
├── classes/
│   ├── sound_manager.php      # 사운드 관리 클래스
│   ├── user_preference.php    # 사용자 설정 클래스
│   ├── analytics.php          # 분석 클래스
│   ├── event/
│   │   └── observers.php      # 이벤트 옵저버
│   └── privacy/
│       └── provider.php       # GDPR 개인정보 제공자
├── lib.php                    # 라이브러리 함수
├── index.php                  # 메인 페이지
├── manage.php                 # 관리 페이지 (교사/관리자)
├── player.php                 # 플레이어 페이지
├── upload.php                 # 사운드 업로드
├── ajax/
│   ├── get_sounds.php         # 사운드 목록 조회
│   ├── save_preference.php    # 설정 저장
│   ├── log_usage.php          # 사용 로그
│   └── update_rating.php      # 평점 업데이트
├── amd/src/                   # JavaScript (ES6 모듈)
│   ├── player.js              # 오디오 플레이어
│   ├── controls.js            # 컨트롤 UI
│   ├── preferences.js         # 설정 UI
│   └── analytics.js           # 분석 추적
├── styles.css                 # CSS 스타일
└── pix/
    └── icon.svg               # 플러그인 아이콘
```

### 5.2 주요 PHP 클래스

#### sound_manager.php
```php
<?php
namespace local_asmr;

class sound_manager {
    /**
     * 사운드 목록 조회
     * @param string $category 카테고리 필터
     * @param string $subcategory 세부 카테고리
     * @return array 사운드 배열
     */
    public static function get_sounds($category = null, $subcategory = null);

    /**
     * 사운드 업로드
     * @param object $filedata 파일 데이터
     * @param int $userid 업로드 사용자 ID
     * @return int 생성된 사운드 ID
     */
    public static function upload_sound($filedata, $userid);

    /**
     * 사운드 삭제
     * @param int $soundid 사운드 ID
     * @return bool 성공 여부
     */
    public static function delete_sound($soundid);

    /**
     * 사운드 재생 횟수 증가
     * @param int $soundid
     */
    public static function increment_playcount($soundid);
}
```

#### user_preference.php
```php
<?php
namespace local_asmr;

class user_preference {
    /**
     * 사용자 설정 조회
     * @param int $userid
     * @param string $key 설정 키
     * @return mixed 설정 값
     */
    public static function get($userid, $key);

    /**
     * 사용자 설정 저장
     * @param int $userid
     * @param string $key
     * @param mixed $value
     */
    public static function set($userid, $key, $value);

    /**
     * 기본 설정값
     */
    const DEFAULT_VOLUME = 70;
    const DEFAULT_AUTO_PLAY = false;
}
```

---

## 6. JavaScript 플레이어 구현

### 6.1 AudioPlayer 클래스 (player.js)
```javascript
export class AudioPlayer {
    constructor(config) {
        this.audio = new Audio();
        this.playlist = [];
        this.currentIndex = 0;
        this.volume = config.volume || 0.7;
        this.loop = config.loop || false;

        // 이벤트 리스너
        this.audio.addEventListener('ended', this.onEnded.bind(this));
        this.audio.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
    }

    play(soundId) {
        // 사운드 재생 로직
    }

    pause() {
        this.audio.pause();
    }

    setVolume(level) {
        this.volume = level / 100;
        this.audio.volume = this.volume;
    }

    loadPlaylist(soundIds) {
        // 재생목록 로드
    }

    next() {
        // 다음 곡
    }

    previous() {
        // 이전 곡
    }
}
```

### 6.2 UI 컨트롤 (controls.js)
```javascript
export class PlayerControls {
    constructor(player, containerId) {
        this.player = player;
        this.container = document.getElementById(containerId);
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="asmr-player-controls">
                <button id="play-btn" class="btn-play">▶️</button>
                <button id="pause-btn" class="btn-pause">⏸️</button>
                <input type="range" id="volume-slider" min="0" max="100" value="70">
                <div id="progress-bar"></div>
                <span id="time-display">00:00 / 00:00</span>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        // 이벤트 바인딩
    }
}
```

---

## 7. API 엔드포인트

### 7.1 사운드 조회
```
GET /local/asmr/ajax/get_sounds.php
Parameters:
  - category: string (optional) - 'asmr' or 'effect'
  - subcategory: string (optional)
  - limit: int (optional, default: 50)
  - offset: int (optional, default: 0)

Response:
{
    "success": true,
    "sounds": [
        {
            "id": 1,
            "name": "Gentle Rain",
            "category": "asmr",
            "subcategory": "rain",
            "duration": 600,
            "url": "https://moodle.example.com/pluginfile.php/...",
            "rating": 4.5
        }
    ],
    "total": 120
}
```

### 7.2 설정 저장
```
POST /local/asmr/ajax/save_preference.php
Parameters:
  - key: string (volume, auto_play, favorites)
  - value: mixed

Response:
{
    "success": true,
    "message": "Preference saved"
}
```

### 7.3 사용 로그
```
POST /local/asmr/ajax/log_usage.php
Parameters:
  - soundid: int
  - action: string (play, pause, complete)
  - duration: int (seconds)
  - courseid: int (optional)

Response:
{
    "success": true
}
```

---

## 8. Moodle 통합 포인트

### 8.1 블록 (Block) - 사이드바 위젯
```php
// blocks/asmr_player/block_asmr_player.php
class block_asmr_player extends block_base {
    public function init() {
        $this->title = get_string('pluginname', 'block_asmr_player');
    }

    public function get_content() {
        // 미니 플레이어 UI 렌더링
        $this->content = new stdClass();
        $this->content->text = $this->render_mini_player();
        return $this->content;
    }
}
```

### 8.2 이벤트 옵저버
```php
// classes/event/observers.php
class observers {
    /**
     * 퀴즈 제출 시 효과음 재생
     */
    public static function quiz_submitted(\mod_quiz\event\attempt_submitted $event) {
        // 퀴즈 제출 효과음 트리거
        $sound = self::get_activity_sound($event->courseid, $event->contextinstanceid, 'quiz_submitted');
        if ($sound) {
            self::trigger_sound_playback($sound->id);
        }
    }

    /**
     * 과제 채점 완료 시 알림음
     */
    public static function assignment_graded(\mod_assign\event\submission_graded $event) {
        // 채점 완료 알림음
    }
}
```

### 8.3 코스 설정 탭
```php
// Course settings에 탭 추가
function local_asmr_extend_settings_navigation($settingsnav, $context) {
    if ($context->contextlevel == CONTEXT_COURSE) {
        $node = $settingsnav->add(
            get_string('asmr_settings', 'local_asmr'),
            new moodle_url('/local/asmr/course_settings.php', ['courseid' => $context->instanceid])
        );
    }
}
```

---

## 9. 사용자 인터페이스

### 9.1 학생용 플레이어 UI
```
┌─────────────────────────────────────────────────┐
│  🎵 멘탈 웰빙 사운드                              │
├─────────────────────────────────────────────────┤
│  현재 재생: 🌧️ Gentle Rain                       │
│  ━━━━━━━━━●━━━━━━━━━━  5:23 / 10:00            │
│                                                 │
│  ⏮️  ⏯️  ⏭️     🔊 ────●──── 70%    🔁  🔀     │
│                                                 │
│  📚 카테고리:                                    │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │
│  │ 🌳  │ │ 🌊  │ │ 🧘  │ │ 📖  │               │
│  │자연 │ │바다 │ │명상 │ │집중 │               │
│  └─────┘ └─────┘ └─────┘ └─────┘               │
│                                                 │
│  ⭐ 즐겨찾기: 빗소리, 카페 소음, 로파이 비트       │
└─────────────────────────────────────────────────┘
```

### 9.2 교사용 관리 페이지
```
┌─────────────────────────────────────────────────┐
│  ASMR & 효과음 관리                               │
├─────────────────────────────────────────────────┤
│  📁 사운드 라이브러리 (총 45개)                   │
│                                                 │
│  [+ 새 사운드 업로드]  [🔍 검색]                 │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ 이름         │ 카테고리 │ 재생수 │ 평점 │ 작업 │  │
│  ├───────────────────────────────────────────┤  │
│  │ Gentle Rain  │ 자연     │ 1,234 │ 4.8  │ ✏️🗑️ │  │
│  │ Ocean Waves  │ 자연     │ 892   │ 4.5  │ ✏️🗑️ │  │
│  │ Cafe Ambience│ 앰비언트  │ 2,103 │ 4.9  │ ✏️🗑️ │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  🎯 활동 연결 설정                                │
│  코스: [선택하세요 ▼]                            │
│  활동: [퀴즈 1: 중간고사 ▼]                       │
│  트리거: [퀴즈 제출 시 ▼]                         │
│  사운드: [Success - Achievement ▼]              │
│  자동재생: [✓]  반복: [ ]  볼륨: 70%             │
│  [저장]                                          │
└─────────────────────────────────────────────────┘
```

---

## 10. 보안 및 개인정보

### 10.1 파일 업로드 검증
- 허용 확장자: .mp3, .ogg, .wav, .m4a
- 최대 파일 크기: 50MB (관리자 설정 가능)
- MIME 타입 검증
- 바이러스 스캔 (ClamAV 통합)

### 10.2 권한 체계
```php
// db/access.php
$capabilities = array(
    'local/asmr:view' => array(
        'captype' => 'read',
        'contextlevel' => CONTEXT_SYSTEM,
        'archetypes' => array(
            'student' => CAP_ALLOW,
            'teacher' => CAP_ALLOW,
            'manager' => CAP_ALLOW
        )
    ),
    'local/asmr:manage' => array(
        'captype' => 'write',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes' => array(
            'teacher' => CAP_ALLOW,
            'manager' => CAP_ALLOW
        )
    ),
    'local/asmr:upload' => array(
        'captype' => 'write',
        'contextlevel' => CONTEXT_SYSTEM,
        'archetypes' => array(
            'manager' => CAP_ALLOW
        )
    )
);
```

### 10.3 GDPR 준수
```php
// classes/privacy/provider.php
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\plugin\provider {

    // 사용자 데이터 내보내기
    public static function export_user_data(approved_contextlist $contextlist);

    // 사용자 데이터 삭제
    public static function delete_data_for_user(approved_contextlist $contextlist);
}
```

---

## 11. 성능 최적화

### 11.1 오디오 파일 최적화
- **비트레이트**: 128kbps (ASMR), 64kbps (효과음)
- **샘플레이트**: 44.1kHz
- **포맷**: MP3 (호환성) + OGG (품질)
- **스트리밍**: HTTP Range Request 지원

### 11.2 캐싱 전략
- 사운드 목록: Redis 캐싱 (TTL 1시간)
- 사용자 설정: Moodle MUC (Memory Cache)
- 오디오 파일: CDN 배포 (선택사항)

### 11.3 데이터베이스 최적화
- 인덱스: category, userid, timecreated
- 파티셔닝: usage_log 테이블 (월별)
- 아카이빙: 6개월 이상 로그 아카이브

---

## 12. 분석 및 리포팅

### 12.1 웰빙 대시보드
```
교사/관리자용 리포트:
- 학생별 ASMR 사용 빈도
- 선호 사운드 카테고리
- 스트레스 지표 (사용 패턴 분석)
- 학습 활동과의 상관관계
```

### 12.2 수집 메트릭
- 일일/주간 활성 사용자
- 평균 청취 시간
- 카테고리별 인기도
- 시간대별 사용 패턴
- 디바이스 유형 분포

---

## 13. 구현 단계

### Phase 1: 기본 인프라 (Week 1-2)
- [ ] 데이터베이스 스키마 생성
- [ ] 플러그인 구조 설정
- [ ] 파일 업로드 시스템
- [ ] 기본 권한 설정

### Phase 2: 플레이어 개발 (Week 3-4)
- [ ] JavaScript 오디오 플레이어
- [ ] UI 컨트롤 구현
- [ ] 사용자 설정 관리
- [ ] AJAX API 엔드포인트

### Phase 3: Moodle 통합 (Week 5-6)
- [ ] 블록 플러그인
- [ ] 이벤트 옵저버
- [ ] 코스 설정 페이지
- [ ] 활동 연결 기능

### Phase 4: 고급 기능 (Week 7-8)
- [ ] 재생목록 기능
- [ ] 평점 시스템
- [ ] 분석 대시보드
- [ ] 모바일 최적화

### Phase 5: 테스트 & 배포 (Week 9-10)
- [ ] 단위 테스트 (PHPUnit)
- [ ] 통합 테스트
- [ ] 성능 테스트
- [ ] 사용자 문서 작성

---

## 14. 기술 요구사항

### 14.1 서버 요구사항
- PHP 7.1.9+
- MySQL 5.7+
- Apache/Nginx with mod_rewrite
- 최소 2GB RAM
- 50GB+ 저장공간 (오디오 파일)

### 14.2 클라이언트 요구사항
- HTML5 Audio API 지원 브라우저
- JavaScript 활성화
- 최소 인터넷 속도: 1Mbps

### 14.3 의존성
- Moodle 3.7
- jQuery 3.x (Moodle 기본 포함)
- Bootstrap 4 (Moodle 테마)

---

## 15. 라이선스 및 저작권

### 15.1 플러그인 라이선스
- GPL v3 (Moodle 플러그인 요구사항)

### 15.2 사운드 라이선스
- Creative Commons (CC BY, CC0)
- Royalty-free 라이브러리 사용
- 출처 표기 필수

### 15.3 추천 사운드 소스
- Freesound.org
- Free Music Archive
- Incompetech
- YouTube Audio Library

---

## 문의 및 지원
- GitHub Issues: (저장소 URL)
- 이메일: support@example.com
- 문서: https://docs.example.com/moodle-asmr

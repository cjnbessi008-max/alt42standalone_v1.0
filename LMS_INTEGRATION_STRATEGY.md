# LMS 통합 문제 해결 전략
**대상 시스템**: Moodle 3.7 + PHP 7.1.9 + MySQL 5.7
**프로젝트**: AI Education System Pipeline
**작성일**: 2025-11-18

---

## 🎯 핵심 문제 정의

AI Education System Pipeline을 Moodle 3.7 LMS와 통합하여 교사가 생성한 모듈을 Moodle 코스에 직접 배포하고, 학생 진도를 동기화하는 시스템 구축

---

## 📋 문제 해결 전략 (우선순위 순)

### **전략 1: LTI 1.1/1.3 표준 기반 통합**
**난이도**: 중
**예상 시간**: 2-3주
**우선순위**: 최고

#### 실행 단계:
1. **Moodle LTI Provider 설정**
   ```php
   // Moodle admin/settings.php 에서 활성화
   - External tool 플러그인 활성화
   - LTI Consumer Key/Secret 생성
   - Launch URL 구성: https://ai-pipeline.kaist.ac.kr/lti/launch
   ```

2. **LTI Launch Endpoint 구현 (PHP 7.1.9 호환)**
   ```php
   // api/lti/launch.php
   <?php
   require_once('../../vendor/autoload.php');

   use IMSGlobal\LTI;

   class MoodleLTIHandler {
       private $consumer_key = 'kaist_moodle_key';
       private $shared_secret = 'your_secret_here';

       public function validateLTIRequest($post_data) {
           // OAuth 1.0 서명 검증
           $store = new LTI\ToolProvider\DataConnector\DataConnector_mysqli();
           $tool = new LTI\ToolProvider\ToolProvider($store);

           if ($tool->handleRequest()) {
               return $this->createUserSession($tool->user);
           }
           return false;
       }

       private function createUserSession($lti_user) {
           // Moodle 사용자를 AI Pipeline 세션에 매핑
           $user_id = $this->findOrCreateUser($lti_user);
           $_SESSION['lti_user_id'] = $user_id;
           $_SESSION['lti_context_id'] = $lti_user->context_id;
           return true;
       }
   }
   ```

3. **성적 동기화 (Grade Passback)**
   ```php
   // api/lti/grade_passback.php
   public function sendGradeToMoodle($student_id, $module_id, $score) {
       $outcome_service = new LTI\OutcomeService();
       $outcome_service->setScore($score); // 0.0 - 1.0 범위
       return $outcome_service->doRequest();
   }
   ```

4. **Deep Linking 2.0 지원 (모듈 선택)**
   ```php
   // 교사가 Moodle에서 AI 생성 모듈을 직접 선택할 수 있게 함
   public function getDeepLinkingResponse($modules) {
       $content_items = [];
       foreach ($modules as $module) {
           $content_items[] = [
               'type' => 'ltiResourceLink',
               'title' => $module['name'],
               'url' => "https://ai-pipeline.kaist.ac.kr/module/{$module['id']}"
           ];
       }
       return LTI\DeepLinking::createResponse($content_items);
   }
   ```

**장점**: 표준 준수, 보안 검증, 성적 자동 동기화
**단점**: 초기 설정 복잡도

---

### **전략 2: Moodle Web Services API 직접 통합**
**난이도**: 중
**예상 시간**: 1-2주
**우선순위**: 높음

#### 실행 단계:
1. **Moodle Web Services 활성화**
   ```sql
   -- MySQL 5.7에서 실행
   INSERT INTO mdl_external_services (name, enabled, restrictedusers, component, timecreated, timemodified)
   VALUES ('AI Pipeline Service', 1, 0, 'local_aipipeline', UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
   ```

2. **REST API 클라이언트 구현**
   ```php
   // lib/MoodleAPIClient.php
   class MoodleAPIClient {
       private $moodle_url = 'https://lms.kaist.ac.kr';
       private $token;

       public function __construct($token) {
           $this->token = $token;
       }

       // 코스 모듈 생성
       public function createCourseModule($course_id, $module_data) {
           $function = 'core_course_create_modules';
           $params = [
               'courseid' => $course_id,
               'modules' => [[
                   'modulename' => 'url',
                   'name' => $module_data['name'],
                   'externalurl' => $module_data['url'],
                   'section' => 1
               ]]
           ];

           return $this->call($function, $params);
       }

       // 학생 진도 업데이트
       public function updateCompletion($course_module_id, $user_id, $completed) {
           $function = 'core_completion_update_activity_completion_status_manually';
           $params = [
               'cmid' => $course_module_id,
               'userid' => $user_id,
               'completed' => $completed
           ];

           return $this->call($function, $params);
       }

       // 성적 업데이트
       public function updateGrade($course_id, $item_id, $user_id, $grade) {
           $function = 'core_grades_update_grades';
           $params = [
               'source' => 'mod/aipipeline',
               'courseid' => $course_id,
               'component' => 'mod_aipipeline',
               'activityid' => $item_id,
               'itemnumber' => 0,
               'grades' => [[
                   'studentid' => $user_id,
                   'grade' => $grade
               ]]
           ];

           return $this->call($function, $params);
       }

       private function call($function, $params) {
           $url = $this->moodle_url . "/webservice/rest/server.php";
           $data = [
               'wstoken' => $this->token,
               'wsfunction' => $function,
               'moodlewsrestformat' => 'json'
           ];

           $ch = curl_init($url);
           curl_setopt($ch, CURLOPT_POST, true);
           curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(array_merge($data, $params)));
           curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

           $response = curl_exec($ch);
           curl_close($ch);

           return json_decode($response, true);
       }
   }
   ```

3. **Webhook 리스너 구현 (Moodle → AI Pipeline)**
   ```php
   // api/webhooks/moodle_events.php
   public function handleMoodleEvent($event_type, $event_data) {
       switch($event_type) {
           case 'user_enrolled':
               $this->enrollStudentInModule($event_data);
               break;
           case 'course_module_viewed':
               $this->trackModuleAccess($event_data);
               break;
           case 'user_graded':
               $this->syncGradeFromMoodle($event_data);
               break;
       }
   }
   ```

**장점**: 세밀한 제어, 양방향 데이터 동기화
**단점**: Moodle 버전 의존성

---

### **전략 3: MySQL 데이터베이스 직접 통합**
**난이도**: 높음
**예상 시간**: 1주
**우선순위**: 중간 (긴급 상황시만)

#### 실행 단계:
1. **Moodle DB 스키마 분석**
   ```sql
   -- 주요 테이블 확인
   SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
   WHERE TABLE_SCHEMA = 'moodle' AND TABLE_NAME LIKE 'mdl_%';

   -- 핵심 테이블:
   -- mdl_user: 사용자
   -- mdl_course: 코스
   -- mdl_course_modules: 코스 모듈
   -- mdl_grade_grades: 성적
   -- mdl_course_completions: 진도
   ```

2. **읽기 전용 뷰 생성**
   ```sql
   -- Moodle DB에 뷰 생성 (AI Pipeline이 읽기만 가능)
   CREATE VIEW ai_pipeline_students AS
   SELECT
       u.id,
       u.username,
       u.firstname,
       u.lastname,
       u.email,
       ue.courseid
   FROM mdl_user u
   JOIN mdl_user_enrolments ue ON u.id = ue.userid
   WHERE u.deleted = 0;

   GRANT SELECT ON moodle.ai_pipeline_students TO 'aipipeline_user'@'%';
   ```

3. **트리거 기반 동기화**
   ```sql
   -- Moodle 성적 변경시 AI Pipeline DB 업데이트
   DELIMITER $$
   CREATE TRIGGER sync_grade_to_aipipeline
   AFTER INSERT ON mdl_grade_grades
   FOR EACH ROW
   BEGIN
       INSERT INTO aipipeline_db.student_progress
       (moodle_user_id, module_id, grade, synced_at)
       VALUES (NEW.userid, NEW.itemid, NEW.finalgrade, NOW())
       ON DUPLICATE KEY UPDATE
           grade = NEW.finalgrade,
           synced_at = NOW();
   END$$
   DELIMITER ;
   ```

**장점**: 빠른 속도, 복잡한 쿼리 가능
**단점**: 보안 위험, Moodle 업그레이드시 깨질 수 있음

---

### **전략 4: Moodle 플러그인 개발**
**난이도**: 높음
**예상 시간**: 3-4주
**우선순위**: 중간 (장기 솔루션)

#### 실행 단계:
1. **Moodle Activity Module 생성**
   ```
   /mod/aipipeline/
   ├── db/
   │   ├── install.xml          # 데이터베이스 스키마
   │   ├── access.php           # 권한 정의
   │   └── upgrade.php          # 업그레이드 스크립트
   ├── lang/
   │   ├── en/aipipeline.php    # 영어 언어팩
   │   └── ko/aipipeline.php    # 한국어 언어팩
   ├── lib.php                  # 핵심 함수
   ├── mod_form.php             # 모듈 설정 폼
   ├── view.php                 # 학생 뷰
   ├── version.php              # 버전 정보
   └── index.php
   ```

2. **lib.php 핵심 함수 구현**
   ```php
   <?php
   // mod/aipipeline/lib.php

   function aipipeline_add_instance($data) {
       global $DB;
       $data->timecreated = time();
       $data->timemodified = time();
       return $DB->insert_record('aipipeline', $data);
   }

   function aipipeline_update_instance($data) {
       global $DB;
       $data->timemodified = time();
       return $DB->update_record('aipipeline', $data);
   }

   function aipipeline_get_coursemodule_info($coursemodule) {
       global $DB;

       $module = $DB->get_record('aipipeline', ['id' => $coursemodule->instance]);

       $info = new cached_cm_info();
       $info->name = $module->name;
       $info->content = $module->intro;

       // AI Pipeline 모듈로 리다이렉트
       $info->onclick = "window.open('https://ai-pipeline.kaist.ac.kr/module/{$module->external_module_id}'); return false;";

       return $info;
   }

   // Gradebook 통합
   function aipipeline_grade_item_update($moduleinstance, $grades=null) {
       global $CFG;
       require_once($CFG->libdir.'/gradelib.php');

       $params = [
           'itemname' => $moduleinstance->name,
           'gradetype' => GRADE_TYPE_VALUE,
           'grademax' => 100,
           'grademin' => 0
       ];

       return grade_update('mod/aipipeline', $moduleinstance->course,
                          'mod', 'aipipeline', $moduleinstance->id, 0,
                          $grades, $params);
   }
   ```

3. **이벤트 핸들러 (AI Pipeline → Moodle 동기화)**
   ```php
   // mod/aipipeline/classes/observer.php
   namespace mod_aipipeline;

   class observer {
       public static function module_completed(\core\event\course_module_completion_updated $event) {
           // AI Pipeline API 호출하여 완료 상태 전송
           $api_client = new \mod_aipipeline\api_client();
           $api_client->notify_completion($event->userid, $event->objectid);
       }
   }
   ```

4. **설치 XML (db/install.xml)**
   ```xml
   <?xml version="1.0" encoding="UTF-8" ?>
   <XMLDB PATH="mod/aipipeline/db" VERSION="2023111800">
     <TABLES>
       <TABLE NAME="aipipeline" COMMENT="AI Pipeline module instances">
         <FIELDS>
           <FIELD NAME="id" TYPE="int" LENGTH="10" SEQUENCE="true"/>
           <FIELD NAME="course" TYPE="int" LENGTH="10" NOTNULL="true"/>
           <FIELD NAME="name" TYPE="char" LENGTH="255" NOTNULL="true"/>
           <FIELD NAME="intro" TYPE="text"/>
           <FIELD NAME="external_module_id" TYPE="char" LENGTH="255" NOTNULL="true"/>
           <FIELD NAME="timecreated" TYPE="int" LENGTH="10" NOTNULL="true"/>
           <FIELD NAME="timemodified" TYPE="int" LENGTH="10" NOTNULL="true"/>
         </FIELDS>
         <KEYS>
           <KEY NAME="primary" TYPE="primary" FIELDS="id"/>
           <KEY NAME="course" TYPE="foreign" FIELDS="course" REFTABLE="course" REFFIELDS="id"/>
         </KEYS>
       </TABLE>
     </TABLES>
   </XMLDB>
   ```

**장점**: 네이티브 통합, 완전한 Moodle UI 활용
**단점**: 개발 시간, Moodle 코딩 표준 학습 필요

---

### **전략 5: SSO (Single Sign-On) 통합**
**난이도**: 중
**예상 시간**: 1주
**우선순위**: 높음 (보안)

#### 실행 단계:
1. **Moodle SAML 2.0 설정**
   ```php
   // Moodle auth 플러그인: auth/saml2
   // config.php
   $config = [
       'sp' => [
           'entityId' => 'https://lms.kaist.ac.kr',
           'assertionConsumerService' => [
               'url' => 'https://lms.kaist.ac.kr/auth/saml2/sp/saml2-acs.php/default-sp'
           ],
           'singleLogoutService' => [
               'url' => 'https://lms.kaist.ac.kr/auth/saml2/sp/saml2-logout.php/default-sp'
           ]
       ],
       'idp' => [
           'entityId' => 'https://ai-pipeline.kaist.ac.kr/saml/metadata',
           'singleSignOnService' => [
               'url' => 'https://ai-pipeline.kaist.ac.kr/saml/sso'
           ]
       ]
   ];
   ```

2. **AI Pipeline SAML IdP 구현**
   ```php
   // api/saml/sso.php
   use OneLogin\Saml2\Auth;

   class SAMLIdentityProvider {
       public function handleSSORequest() {
           $auth = new Auth($this->getSAMLConfig());

           if (!isset($_SESSION['user_id'])) {
               // 로그인 페이지로 리다이렉트
               header('Location: /login?return_url=' . urlencode($_SERVER['REQUEST_URI']));
               exit;
           }

           // SAML Response 생성
           $attributes = [
               'uid' => $_SESSION['user_id'],
               'email' => $_SESSION['email'],
               'displayName' => $_SESSION['name']
           ];

           $auth->login(null, [], false, false, true, false, $attributes);
       }
   }
   ```

3. **토큰 기반 인증 (대안)**
   ```php
   // JWT 토큰을 사용한 간단한 SSO
   public function generateMoodleLoginToken($user_id) {
       $payload = [
           'iss' => 'https://ai-pipeline.kaist.ac.kr',
           'sub' => $user_id,
           'exp' => time() + 3600,
           'moodle_username' => $this->getMoodleUsername($user_id)
       ];

       return JWT::encode($payload, SECRET_KEY, 'HS256');
   }

   // Moodle 측 검증 (auth 플러그인)
   public function loginuserkey_validate($token) {
       try {
           $decoded = JWT::decode($token, SECRET_KEY, ['HS256']);
           return $this->get_user_by_username($decoded->moodle_username);
       } catch (Exception $e) {
           return false;
       }
   }
   ```

**장점**: 단일 로그인, 보안 강화
**단점**: SAML 설정 복잡도

---

## 🔧 기술 스택별 구현 가이드

### PHP 7.1.9 호환성 체크리스트
```php
// ✅ 사용 가능
- NULL 병합 연산자: $value = $input ?? 'default';
- Spaceship 연산자: $sort = $a <=> $b;
- 익명 클래스: new class { };

// ❌ 사용 불가 (PHP 7.2+)
- object 타입 힌트
- Trailing comma in function calls
```

### MySQL 5.7 최적화
```sql
-- JSON 컬럼 활용 (MySQL 5.7.8+)
ALTER TABLE modules ADD COLUMN moodle_metadata JSON;

-- Full-Text Search
CREATE FULLTEXT INDEX idx_module_name ON modules(name, description);

-- 파티셔닝 (대용량 데이터)
ALTER TABLE student_progress
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026)
);
```

---

## 📊 통합 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     Moodle 3.7 LMS                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ LTI Consumer │  │ Web Services │  │  Auth Plugin │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │ LTI 1.3          │ REST API         │ SAML/JWT
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────┐
│              Integration Layer (PHP 7.1.9)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ LTI Handler │ API Client │ SSO Bridge │ Sync Service│  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│         AI Education System Pipeline (Python)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Module Generator │ Student Progress │ Grade Manager  │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                    MySQL 5.7 Database                        │
│  ┌─────────────┐    ┌─────────────┐                         │
│  │ Moodle DB   │◄──►│ AI Pipeline │ (Federated Tables)      │
│  └─────────────┘    └─────────────┘                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 우선순위 구현 로드맵

### Phase 1: 빠른 통합 (1-2주)
1. ✅ **SSO 통합** (전략 5) - 사용자 인증 통일
2. ✅ **Moodle Web Services** (전략 2) - 기본 데이터 동기화
3. ✅ **Webhook 리스너** - 이벤트 기반 업데이트

**목표**: 교사가 AI 생성 모듈을 Moodle 코스에 수동으로 추가 가능

### Phase 2: 표준 준수 (2-3주)
1. ✅ **LTI 1.3 구현** (전략 1) - 표준 기반 통합
2. ✅ **Grade Passback** - 자동 성적 동기화
3. ✅ **Deep Linking** - 모듈 선택 UI

**목표**: 완전한 자동화, 성적 양방향 동기화

### Phase 3: 네이티브 경험 (3-4주, 선택)
1. ✅ **Moodle 플러그인** (전략 4) - 완전 통합
2. ✅ **UI/UX 개선** - Moodle 테마 적용
3. ✅ **모바일 앱 지원** - Moodle Mobile API

**목표**: Moodle 네이티브 모듈처럼 동작

---

## 🧪 테스트 시나리오

### 1. LTI 통합 테스트
```php
// tests/LTIIntegrationTest.php
public function testLTILaunchWithValidSignature() {
    $lti_params = [
        'lti_message_type' => 'basic-lti-launch-request',
        'lti_version' => 'LTI-1p0',
        'resource_link_id' => '12345',
        'user_id' => 'student@kaist.ac.kr'
    ];

    $signed_params = $this->signOAuthParams($lti_params);
    $response = $this->post('/lti/launch', $signed_params);

    $this->assertEquals(200, $response->status);
    $this->assertSessionHas('lti_user_id');
}
```

### 2. 성적 동기화 테스트
```php
public function testGradePassbackToMoodle() {
    $student_id = 123;
    $module_id = 'fraction_module_001';
    $score = 0.85;

    $result = $this->gradeService->sendGradeToMoodle($student_id, $module_id, $score);

    $this->assertTrue($result->success);

    // Moodle DB 직접 확인
    $moodle_grade = DB::table('mdl_grade_grades')
        ->where('userid', $student_id)
        ->where('itemid', $this->getGradeItemId($module_id))
        ->first();

    $this->assertEquals(85, $moodle_grade->finalgrade);
}
```

### 3. SSO 플로우 테스트
```php
public function testSAMLSSOFromMoodle() {
    // Moodle에서 SAML 요청 시뮬레이션
    $saml_request = $this->createSAMLRequest();

    $response = $this->get('/saml/sso?SAMLRequest=' . $saml_request);

    $this->assertRedirect('/login');

    // 로그인 후
    $this->loginAs('teacher@kaist.ac.kr');
    $response = $this->get('/saml/sso?SAMLRequest=' . $saml_request);

    $this->assertContains('SAMLResponse', $response->content);
}
```

---

## 🔒 보안 체크리스트

### LTI 보안
- [ ] OAuth 1.0 서명 검증 구현
- [ ] Nonce 재사용 방지 (Redis 캐시)
- [ ] Timestamp 검증 (5분 이내)
- [ ] Consumer Key 화이트리스트
- [ ] HTTPS 필수 적용

### API 보안
- [ ] JWT 토큰 만료 시간 설정 (1시간)
- [ ] API Rate Limiting (사용자당 100req/hour)
- [ ] IP 화이트리스트 (Moodle 서버 IP만)
- [ ] SQL Injection 방지 (Prepared Statements)
- [ ] XSS 방지 (Output Escaping)

### 데이터 보안
- [ ] 학생 개인정보 암호화 (AES-256)
- [ ] FERPA/PIPA 준수
- [ ] 감사 로깅 (모든 성적 변경)
- [ ] 백업 자동화 (daily)

---

## 📈 모니터링 및 알림

### 핵심 메트릭
```php
// monitoring/metrics.php
class IntegrationMetrics {
    public function track() {
        return [
            'lti_launches' => $this->countLTILaunches(today()),
            'grade_syncs' => $this->countGradeSyncs(today()),
            'api_errors' => $this->countAPIErrors(today()),
            'avg_sync_time' => $this->getAverageSyncTime(),
            'failed_authentications' => $this->countFailedAuths(today())
        ];
    }
}
```

### 알림 규칙
- LTI 인증 실패율 > 5% → 즉시 알림
- 성적 동기화 지연 > 5분 → 경고
- API 오류율 > 1% → 경고
- Moodle DB 연결 실패 → 즉시 알림

---

## 🛠️ 트러블슈팅 가이드

### 문제 1: LTI 서명 검증 실패
**증상**: "OAuth signature verification failed"
**원인**: 시간 불일치, 잘못된 secret
**해결**:
```bash
# 서버 시간 동기화
ntpdate pool.ntp.org

# Consumer Key/Secret 재확인
SELECT * FROM mdl_lti WHERE id = <module_id>;
```

### 문제 2: 성적이 Moodle에 반영 안됨
**증상**: AI Pipeline에서 성적 전송했으나 Moodle gradebook에 없음
**원인**: Grade item 미생성
**해결**:
```php
// Grade item 수동 생성
$params = ['itemname' => 'AI Module Score'];
grade_update('mod/aipipeline', $course_id, 'mod', 'aipipeline',
             $instance_id, 0, null, $params);
```

### 문제 3: MySQL 연결 타임아웃
**증상**: "SQLSTATE[HY000] [2002] Connection timed out"
**원인**: wait_timeout 설정, 방화벽
**해결**:
```sql
-- my.cnf
[mysqld]
wait_timeout = 28800
interactive_timeout = 28800
max_allowed_packet = 64M

-- 방화벽 규칙 추가
sudo ufw allow from <ai_pipeline_ip> to any port 3306
```

---

## 📚 참고 자료

### Moodle 문서
- [LTI Provider Setup](https://docs.moodle.org/37/en/LTI_Provider)
- [Web Services API](https://docs.moodle.org/dev/Web_services_API)
- [Activity Module Development](https://docs.moodle.org/dev/Activity_modules)

### 표준 스펙
- [IMS LTI 1.3 Specification](https://www.imsglobal.org/spec/lti/v1p3/)
- [SAML 2.0 Technical Overview](https://www.oasis-open.org/committees/download.php/27819/sstc-saml-tech-overview-2.0-cd-02.pdf)

### PHP/MySQL
- [PHP 7.1 Migration Guide](https://www.php.net/manual/en/migration71.php)
- [MySQL 5.7 JSON Functions](https://dev.mysql.com/doc/refman/5.7/en/json-functions.html)

---

## ✅ 최종 권장 사항

### 즉시 시작 (Week 1-2)
1. **전략 5 (SSO)** 먼저 구현 → 사용자 인증 통일
2. **전략 2 (Web Services)** 기본 API 통합 → 데이터 동기화
3. 테스트 환경 구축 (Moodle 3.7 Docker)

### 중기 목표 (Week 3-4)
1. **전략 1 (LTI 1.3)** 표준 준수 통합
2. Grade Passback 자동화
3. 프로덕션 배포 준비

### 장기 고려사항
1. Moodle 4.x 업그레이드 대비
2. 멀티 LMS 지원 (Canvas, Blackboard)
3. 성능 최적화 (캐싱, 큐)

---

**작성자**: AI Development Agent
**검토 필요**: Technical Lead, Moodle Administrator
**다음 단계**: Phase 1 구현 시작

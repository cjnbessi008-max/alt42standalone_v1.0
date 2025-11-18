<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

defined('MOODLE_INTERNAL') || die();

// Plugin info
$string['pluginname'] = '학습 자신감 점수';
$string['confidence'] = '자신감 점수';

// Capabilities
$string['confidence:submitconfidence'] = '자신감 점수 제출';
$string['confidence:view'] = '자신감 점수 조회';
$string['confidence:viewreports'] = '자신감 리포트 조회';
$string['confidence:manageconcepts'] = '개념 관리';
$string['confidence:managealerts'] = '알림 관리';

// Student view
$string['myconfidence'] = '내 학습 자신감';
$string['conceptname'] = '개념';
$string['yourconfidence'] = '나의 자신감';
$string['score'] = '점수';
$string['comment'] = '코멘트';
$string['optional'] = '선택사항';
$string['saveconfidence'] = '저장';
$string['confidencesaved'] = '자신감 점수가 저장되었습니다.';
$string['previousscore'] = '마지막 평가';
$string['noscore'] = '아직 평가하지 않음';

// Score labels
$string['score_verylow'] = '매우 낮음';
$string['score_low'] = '낮음';
$string['score_medium'] = '보통';
$string['score_high'] = '높음';
$string['score_veryhigh'] = '매우 높음';

// Teacher dashboard
$string['dashboard'] = '대시보드';
$string['classdashboard'] = '학급 자신감 모니터링';
$string['summary'] = '요약';
$string['avgconfidence'] = '평균 자신감';
$string['totalstudents'] = '전체 학생 수';
$string['totalconcepts'] = '전체 개념 수';
$string['participationrate'] = '참여율';
$string['studentsatrisk'] = '도움 필요 학생';
$string['needsattention'] = '관심이 필요한 학생들';
$string['conceptdistribution'] = '개념별 점수 분포';
$string['scoredistribution'] = '점수 분포';
$string['studentname'] = '학생명';
$string['avgconfidencescore'] = '평균 자신감';
$string['lowconfidenceconcepts'] = '낮은 자신감 개념';
$string['viewdetail'] = '상세보기';

// Concept management
$string['manageconcepts'] = '개념 관리';
$string['addconcept'] = '새 개념 추가';
$string['editconcept'] = '개념 수정';
$string['deleteconcept'] = '개념 삭제';
$string['conceptadded'] = '개념이 추가되었습니다.';
$string['conceptupdated'] = '개념이 업데이트되었습니다.';
$string['conceptdeleted'] = '개념이 삭제되었습니다.';
$string['description'] = '설명';
$string['category'] = '카테고리';
$string['displayorder'] = '표시 순서';

// Reports
$string['reports'] = '리포트';
$string['conceptreport'] = '개념별 리포트';
$string['studentreport'] = '학생별 리포트';
$string['exportdata'] = '데이터 내보내기';
$string['export_csv'] = 'CSV로 내보내기';
$string['export_excel'] = '엑셀로 내보내기';

// History
$string['history'] = '이력';
$string['scorehistory'] = '점수 변화 이력';
$string['nohistory'] = '이력이 없습니다.';
$string['timestamp'] = '시간';
$string['previousvalue'] = '이전 값';
$string['newvalue'] = '새 값';

// Alerts
$string['alerts'] = '알림';
$string['alertsettings'] = '알림 설정';
$string['threshold'] = '임계값';
$string['alerttype'] = '알림 유형';
$string['enabled'] = '활성화';
$string['disabled'] = '비활성화';
$string['lowconfidencealert'] = '낮은 자신감 알림';
$string['alertthreshold'] = '알림 임계값 (이하)';

// Errors
$string['error:invalidcourseid'] = '잘못된 코스 ID입니다.';
$string['error:invalidconceptid'] = '잘못된 개념 ID입니다.';
$string['error:invalidscore'] = '점수는 1에서 5 사이여야 합니다.';
$string['error:nopermission'] = '권한이 없습니다.';
$string['error:savefailed'] = '저장에 실패했습니다.';
$string['error:conceptnotfound'] = '개념을 찾을 수 없습니다.';

// Validation
$string['commenttoolong'] = '코멘트가 너무 깁니다 (최대 500자).';
$string['pleaseselect score'] = '자신감 점수를 선택해주세요.';
$string['required'] = '필수';

// Help
$string['help:confidence'] = '각 학습 개념에 대한 당신의 이해도와 자신감을 평가해주세요.';
$string['help:score'] = '1 (매우 낮음) 부터 5 (매우 높음) 까지 선택할 수 있습니다.';
$string['help:comment'] = '어떤 부분이 어렵거나 쉬운지 자유롭게 적어주세요.';

// Privacy
$string['privacy:metadata:local_confidence_scores'] = '학생의 자신감 점수 정보';
$string['privacy:metadata:local_confidence_scores:userid'] = '사용자 ID';
$string['privacy:metadata:local_confidence_scores:score'] = '자신감 점수 (1-5)';
$string['privacy:metadata:local_confidence_scores:comment'] = '학생 코멘트';
$string['privacy:metadata:local_confidence_scores:timecreated'] = '생성 시간';
$string['privacy:metadata:local_confidence_scores:timemodified'] = '수정 시간';

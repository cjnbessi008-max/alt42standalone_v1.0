# Moodle Concept Network Block Plugin

학생 기반 개념 연결망 자동 생성 플러그인

## 개요

이 Moodle 블록 플러그인은 학생들의 학습 활동 데이터를 분석하여 개념 간 연결망을 자동으로 생성하고 시각화합니다.

## 기능

### 핵심 기능
- **자동 개념 추출**: Quiz, Assignment, Forum 등의 활동에서 개념 자동 추출
- **학생별 개념 네트워크 생성**: 개별 학생의 학습 패턴 기반 네트워크 구축
- **관계 유형 분석**:
  - 선행 학습 관계 (Prerequisite)
  - 유사성 관계 (Similar)
  - 시간적 관계 (Temporal)
  - 난이도 관계 (Difficulty)
- **인터랙티브 시각화**: D3.js 기반 네트워크 그래프
- **숙달도 추적**: 개념별 학생 숙달 수준 측정

### 관계 강도 계산
```
strength = w1 × co_occurrence_score
         + w2 × temporal_proximity_score
         + w3 × performance_correlation_score

기본 가중치: w1=0.4, w2=0.3, w3=0.3
```

## 시스템 요구사항

- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Browser**: Chrome, Firefox, Safari, Edge (최신 2개 버전)

## 설치 방법

### 1. 파일 복사
```bash
cd /path/to/moodle
cp -r /path/to/blocks/concept_network blocks/
```

### 2. 플러그인 설치
1. Moodle 관리자로 로그인
2. `Site administration → Notifications` 방문
3. 플러그인 설치 진행 (데이터베이스 테이블 자동 생성)

### 3. 블록 추가
1. 코스 페이지로 이동
2. 편집 모드 켜기
3. "Add a block" → "Concept Network" 선택

## 데이터베이스 구조

### 테이블
1. **mdl_block_concept_network**: 네트워크 메타데이터
2. **mdl_block_concept_nodes**: 개념 노드
3. **mdl_block_concept_edges**: 개념 간 관계 (엣지)
4. **mdl_block_student_concept_progress**: 학생 진행도
5. **mdl_block_concept_mappings**: 활동-개념 매핑

상세 스키마는 `/blocks/concept_network/db/install.xml` 참조

## 사용 방법

### 학생용
1. 코스 페이지에서 "Concept Network" 블록 확인
2. 자신의 개념 연결망 보기
3. "View full network" 클릭하여 상세 보기

### 교사용
1. 모든 학생의 개념 네트워크 조회 가능
2. "Regenerate Network" 버튼으로 네트워크 재생성
3. 개념 매핑 관리 (수동으로 활동에 개념 연결)

## 설정

`Site administration → Plugins → Blocks → Concept Network`

### 주요 설정
- **Co-occurrence Weight**: 동시 출현 가중치 (기본: 0.4)
- **Temporal Proximity Weight**: 시간적 근접성 가중치 (기본: 0.3)
- **Performance Correlation Weight**: 성과 상관관계 가중치 (기본: 0.3)
- **Minimum Relationship Strength**: 최소 관계 강도 임계값 (기본: 0.1)
- **Cache TTL**: 캐시 유지 시간 (기본: 3600초)

## API 엔드포인트

### AJAX API (`/blocks/concept_network/ajax.php`)

```javascript
// 네트워크 가져오기
GET ?action=get_network&courseid={id}&studentid={id}&sesskey={key}

// 네트워크 재생성
POST ?action=regenerate_network&courseid={id}&studentid={id}&sesskey={key}

// 개념 진행도 조회
GET ?action=get_concept_progress&courseid={id}&studentid={id}&conceptname={name}&sesskey={key}

// 개념 매핑 업데이트
POST ?action=update_mapping&courseid={id}&activityid={id}&activitytype={type}&conceptname={name}&weight={w}&sesskey={key}
```

## 개념 추출 알고리즘

### 1. 데이터 수집
- Quiz 시도 및 점수
- Assignment 제출 및 성적
- Forum 게시물 및 키워드
- 학습 활동 로그

### 2. 개념 추출 우선순위
1. 수동 개념 매핑 (가중치: 1.0)
2. Question 태그 (가중치: 0.8)
3. Question 이름 (가중치: 0.6)
4. Activity 이름 (가중치: 0.5)
5. Forum 키워드 (가중치: 0.3)

### 3. 관계 생성
- 개념 쌍별로 관계 강도 계산
- 임계값 이상의 관계만 저장
- 관계 유형 자동 결정

## 성능 최적화

### 캐싱
- 생성된 네트워크를 Moodle 캐시에 저장 (기본 1시간)
- 활동 데이터 변경 시 캐시 무효화

### 백그라운드 처리
- Scheduled task로 자동 네트워크 재생성 가능
- 대용량 데이터 처리 시 chunking

## 권한 (Capabilities)

- `block/concept_network:view` - 자신의 네트워크 보기
- `block/concept_network:viewall` - 모든 학생 네트워크 보기
- `block/concept_network:manage` - 개념 매핑 관리
- `block/concept_network:addinstance` - 블록 추가
- `block/concept_network:myaddinstance` - My page에 블록 추가

## 문제 해결

### 네트워크가 생성되지 않는 경우
1. 학생이 충분한 활동을 완료했는지 확인
2. 개념 매핑이 설정되어 있는지 확인
3. PHP 오류 로그 확인
4. 데이터베이스 테이블이 정상적으로 생성되었는지 확인

### D3.js 시각화가 표시되지 않는 경우
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. D3.js 라이브러리 로드 확인
3. 네트워크 데이터에 노드가 있는지 확인

## 향후 개발 계획

### Phase 1 (완료)
- ✅ 기본 개념 네트워크 생성
- ✅ D3.js 시각화
- ✅ 데이터베이스 스키마
- ✅ AJAX API

### Phase 2 (계획)
- [ ] AI 기반 개념 추출 (Claude API 통합)
- [ ] 예측 분석 (다음 학습 개념 추천)
- [ ] 그룹 비교 기능
- [ ] Neo4j 그래프 데이터베이스 통합

### Phase 3 (계획)
- [ ] 표준 교육 온톨로지 연동
- [ ] OWL/RDF 형식 지원
- [ ] 다중 과목 지원
- [ ] 모바일 앱 지원

## 라이선스

GNU GPL v3 or later

## 제작

**KAIST Touch Math Academy**
- Copyright 2025

## 지원

문제 발생 시:
1. GitHub Issues: [링크 추가]
2. 이메일: [이메일 추가]
3. 문서: `/docs/moodle-integration-architecture.md`

## 참고 문서

- [Moodle Plugin Development](https://docs.moodle.org/dev/Plugin_development)
- [D3.js Documentation](https://d3js.org/)
- [Architecture Document](../docs/moodle-integration-architecture.md)

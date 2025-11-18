# 수학공식 암기앱 (Math Formula Memorizer)

## 프로젝트 개요
다양한 타이포그래피 변형을 통해 수학 공식을 효과적으로 암기할 수 있도록 돕는 웹 애플리케이션입니다.

## 기술 스택
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **수식 렌더링**: KaTeX (빠른 수학 표현식 렌더링)
- **데이터 저장**: JSON 파일 (공식 데이터), LocalStorage (사용자 진행상황)
- **학습 알고리즘**: Spaced Repetition (SM-2 알고리즘 기반)

## 주요 기능
1. **타이포그래피 변형 엔진**
   - 폰트 변경 (Sans-serif, Serif, Monospace 등)
   - 크기 변화 (동적 스케일링)
   - 색상 변형 (고대비 색상 조합)
   - 스타일 변형 (굵기, 기울임, 그림자 효과)

2. **간격 반복 학습**
   - SM-2 알고리즘 기반 복습 스케줄링
   - 개인화된 학습 진도 관리

3. **진행상황 추적**
   - 학습한 공식 수
   - 복습 일정
   - 숙련도 레벨

## 프로젝트 구조
```
math-formula-app/
├── index.html              # 메인 HTML
├── css/
│   ├── style.css          # 기본 스타일
│   └── typography.css     # 타이포그래피 변형 스타일
├── js/
│   ├── app.js            # 메인 애플리케이션 로직
│   ├── typography.js     # 타이포그래피 변형 엔진
│   ├── spacedRepetition.js  # 간격 반복 학습 알고리즘
│   └── storage.js        # LocalStorage 관리
├── data/
│   ├── formulas/
│   │   ├── algebra.json      # 대수학 공식
│   │   ├── geometry.json     # 기하학 공식
│   │   ├── calculus.json     # 미적분 공식
│   │   ├── statistics.json   # 통계 공식
│   │   └── index.json        # 전체 공식 인덱스
└── README.md
```

## 데이터 구조
각 공식은 다음과 같은 JSON 구조를 따릅니다:
```json
{
  "id": "unique-id",
  "category": "대수학",
  "subcategory": "이차방정식",
  "name": "근의 공식",
  "formula": "x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}",
  "description": "이차방정식 ax²+bx+c=0의 해",
  "difficulty": "중",
  "grade": "중3"
}
```

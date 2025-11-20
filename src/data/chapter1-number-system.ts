import type { Chapter, Scene, Card } from '../types';

// Chapter 1 Cards
export const chapter1Cards: Card[] = [
  {
    id: 'card-1-1',
    title: '점토판의 기록자',
    era: '기원전 2000년, 메소포타미아',
    description: '인류 최초의 수학. 갈대 첨필로 점토판에 60진법 숫자를 새긴 바빌로니아 상인들의 이야기.',
    mathematician: '바빌로니아 서기관',
    visual: '/assets/cards/clay-tablet.jpg',
    statsGained: { logic: 1, persistence: 1 },
  },
  {
    id: 'card-1-2',
    title: '나일강의 서기관',
    era: '기원전 1650년, 이집트',
    description: '단위분수만을 사용하여 땅을 나누고 계산했던 이집트 서기관 아메스의 지혜.',
    mathematician: '아메스',
    visual: '/assets/cards/egyptian-scribe.jpg',
    statsGained: { creativity: 1, logic: 1 },
  },
  {
    id: 'card-1-3',
    title: '히파소스의 발견',
    era: '기원전 500년, 그리스',
    description: '√2가 분수로 표현될 수 없음을 발견하고, 피타고라스 학파를 뒤흔든 금기의 수.',
    mathematician: '히파소스',
    visual: '/assets/cards/hippasus.jpg',
    statsGained: { imagination: 2, persistence: 1 },
  },
  {
    id: 'card-1-4',
    title: '브라마굽타의 혁명',
    era: '628년, 인도 우자인',
    description: '\'없음\'을 수로 표현한 0의 탄생. 위치기수법을 완성하고 세상을 밝힌 혁명.',
    mathematician: '브라마굽타',
    visual: '/assets/cards/brahmagupta.jpg',
    statsGained: { imagination: 2, intuition: 1 },
  },
  {
    id: 'card-1-5',
    title: '알콰리즈미의 지혜',
    era: '825년, 바그다드',
    description: '십진법을 유럽에 전파하고, 알고리즘의 어원이 된 수학자의 계산법.',
    mathematician: '알콰리즈미',
    visual: '/assets/cards/al-khwarizmi.jpg',
    statsGained: { logic: 2, creativity: 1 },
  },
  {
    id: 'card-1-6',
    title: '카르다노의 용기',
    era: '1545년, 이탈리아',
    description: '음수를 거부하던 시대에 맞서, 빚도 수라고 주장한 수학자의 용기.',
    mathematician: '카르다노',
    visual: '/assets/cards/cardano.jpg',
    statsGained: { imagination: 1, logic: 1, creativity: 1 },
  },
  {
    id: 'card-1-7',
    title: '가우스의 복소평면',
    era: '1797년, 독일',
    description: '허수를 평면 위의 점으로 표현하고, 대수학의 기본정리를 증명한 수학의 왕자.',
    mathematician: '가우스',
    visual: '/assets/cards/gauss.jpg',
    statsGained: { imagination: 3, intuition: 2 },
  },
];

// Chapter 1 Scenes
export const chapter1Scenes: Scene[] = [
  {
    id: 'scene-1-1',
    chapterId: 1,
    sceneNumber: 1,
    title: '메소포타미아 - 점토판의 기록',
    era: '기원전 2000년',
    location: '바빌로니아',
    narrative: `"그 밤, 별은 고요히 숨을 고르고 있었도다.

티그리스 강가의 저잣거리에서는 상인들이 분주히 움직이고 있었다.
곡식의 양을 세고, 거래의 기록을 남겨야 했다.

그들은 갈대로 만든 첨필을 들고, 축축한 점토판에 쐐기 모양을 새겨 넣었다.

이것이 인류 최초의 수학, 그 시작이었도다."`,
    interactionType: 'puzzle',
    clearConditions: [
      {
        description: '점토판에 숫자 270을 60진법으로 표현하기',
        type: 'basic',
        statsReward: { logic: 1 },
      },
      {
        description: '힌트 없이 해결',
        type: 'bonus',
        statsReward: { intuition: 1 },
      },
    ],
    cardReward: 'card-1-1',
  },
  {
    id: 'scene-1-2',
    chapterId: 1,
    sceneNumber: 2,
    title: '이집트 - 단위분수의 비밀',
    era: '기원전 1650년',
    location: '이집트',
    narrative: `"나일강은 해마다 범람하여 땅의 경계를 지워버렸다.

서기관 아메스는 두루마리 파피루스를 펼쳐 들었다.
땅을 다시 나누어야 했다. 3개의 땅을 4명에게 공평하게.

하나, 이집트에서는 분수를 오직 '단위분수'로만 표현할 수 있었다.
3/4는 1/2 + 1/4로 써야 했다.

"이것이 우리의 방식이니라.""`,
    interactionType: 'puzzle',
    clearConditions: [
      {
        description: '분수를 단위분수 합으로 분해하기 (2/3, 3/4, 5/6)',
        type: 'basic',
        statsReward: { logic: 1 },
      },
      {
        description: '최소 조각 수로 해결',
        type: 'bonus',
        statsReward: { creativity: 1 },
      },
    ],
    cardReward: 'card-1-2',
  },
  {
    id: 'scene-1-3',
    chapterId: 1,
    sceneNumber: 3,
    title: '그리스 - 무리수의 발견과 공포',
    era: '기원전 500년',
    location: '그리스',
    narrative: `"모든 것은 수라고, 그들은 믿었도다.

피타고라스 학파의 현자들은 정사각형의 대각선을 측정하려 했다.
한 변이 1인 정사각형. 대각선의 길이는?

제자 히파소스는 계산을 거듭했다.
√2 = 1.414213...
끝없이 이어지는 숫자들.

"이것은... 분수로 표현할 수 없습니다!"

학파는 경악했다. 세상의 근본이 흔들렸다.
그날 밤, 히파소스는 바다에 수장되었다는 전설이 전해진다.

"신의 실수를 발견한 자의 운명이었도다.""`,
    interactionType: 'simulation',
    clearConditions: [
      {
        description: '√2를 분수로 표현하려는 시도 체험',
        type: 'basic',
        statsReward: { imagination: 1 },
      },
      {
        description: '10회 이상 끈질기게 시도',
        type: 'bonus',
        statsReward: { persistence: 2 },
      },
      {
        description: '무리수 개념 빠르게 수용',
        type: 'bonus',
        statsReward: { intuition: 1 },
      },
    ],
    cardReward: 'card-1-3',
  },
  {
    id: 'scene-1-4',
    chapterId: 1,
    sceneNumber: 4,
    title: '인도 - 0의 탄생과 세계의 변화',
    era: '628년',
    location: '인도 우자인',
    narrative: `"'없음'을 어찌 수로 쓸 수 있단 말인가?"

천문학자 브라마굽타는 밤하늘을 관측했다.
별의 위치를 계산하고, 궤도를 예측했다.

그는 새로운 기호를 만들었다. 작은 원, '0'.
'없음'을 의미하는 수.

a + 0 = a
a × 0 = 0
0 ÷ a = 0

세상이 밝아지기 시작했다.
위치기수법이 완성되었다.

"이제 우리는 무한을 표현할 수 있도다.""`,
    interactionType: 'minigame',
    clearConditions: [
      {
        description: '0이 등장하는 순간 체험하기',
        type: 'basic',
        statsReward: { imagination: 2 },
      },
      {
        description: '위치기수법 빠르게 이해',
        type: 'bonus',
        statsReward: { intuition: 1 },
      },
    ],
    cardReward: 'card-1-4',
  },
  {
    id: 'scene-1-5',
    chapterId: 1,
    sceneNumber: 5,
    title: '아랍 - 십진법의 완성과 전파',
    era: '825년',
    location: '바그다드',
    narrative: `"숫자의 비밀이 실크로드를 따라 흘러갔다.

바그다드의 학자 알콰리즈미는 인도의 수 체계를 연구했다.
0부터 9까지, 단 열 개의 기호로 모든 수를 표현할 수 있다니!

그는 '인도 수학에 의한 계산법'이라는 책을 저술했다.
이 책은 라틴어로 번역되어 유럽을 뒤흔들었다.

'알고리즘'이라는 단어는 그의 이름에서 유래했도다.

"계산은 이제 예술이 아니라, 방법이 되었노라.""`,
    interactionType: 'minigame',
    clearConditions: [
      {
        description: '십진법 계산법 체험 (로마 숫자 vs 아라비아 숫자)',
        type: 'basic',
        statsReward: { logic: 1 },
      },
      {
        description: '빠른 계산 성공',
        type: 'bonus',
        statsReward: { intuition: 1 },
      },
    ],
    cardReward: 'card-1-5',
  },
  {
    id: 'scene-1-6',
    chapterId: 1,
    sceneNumber: 6,
    title: '르네상스 - 음수를 둘러싼 논쟁',
    era: '1545년',
    location: '이탈리아',
    narrative: `"빚을 수로 쓴다니, 말도 안 되는 소리!"

수학자들은 음수를 거부했다.
"0보다 작은 수가 어디 있단 말인가?"
"현실에 존재하지 않는 허구의 수다!"

그러나 카르다노는 방정식을 풀다 마주했다.
x + 5 = 3
x = -2

"이것은 빚이다. 빚도 분명 실재하지 않는가?"

논쟁은 거리를 뜨겁게 달궜다.
현자들과 논리 배틀을 벌여야 할 때도다."`,
    interactionType: 'debate',
    clearConditions: [
      {
        description: '음수 거부 철학자들과 논리 배틀 승리 (3라운드)',
        type: 'basic',
        statsReward: { logic: 1, imagination: 1 },
      },
      {
        description: '완벽한 논리로 설득',
        type: 'bonus',
        statsReward: { creativity: 1 },
      },
    ],
    cardReward: 'card-1-6',
  },
  {
    id: 'scene-1-7',
    chapterId: 1,
    sceneNumber: 7,
    title: '근대 - 허수와 복소평면',
    era: '1797년',
    location: '독일',
    narrative: `"√(-1)이라니... 미친 짓이 아닌가?"

데카르트는 이것을 '상상의 수(imaginary)'라 불렀다.
존재하지 않는, 순전히 상상 속의 수.

하지만 오일러는 발견했다. e^(iπ) + 1 = 0
세상에서 가장 아름다운 방정식.

가우스는 더 나아갔다.
복소평면을 그렸다. 실수축과 허수축.

"이제 모든 방정식은 해를 가진다."
대수학의 기본정리.

수의 여정이 완성되는 순간이었도다."`,
    interactionType: 'minigame',
    clearConditions: [
      {
        description: '복소평면 조작 및 오일러 공식 체험',
        type: 'basic',
        statsReward: { imagination: 2 },
      },
      {
        description: '시각적 패턴 빠르게 인식',
        type: 'bonus',
        statsReward: { intuition: 2 },
      },
      {
        description: '수학적 아름다움 감상',
        type: 'bonus',
        statsReward: { creativity: 1 },
      },
    ],
    cardReward: 'card-1-7',
  },
];

// Chapter 1: 수체계
export const chapter1: Chapter = {
  id: 1,
  title: '수체계 (수의 역사)',
  scenes: chapter1Scenes,
  totalCards: 7,
};

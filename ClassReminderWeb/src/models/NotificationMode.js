/**
 * 알림 모드 - 각 모드마다 독특하고 재미있는 메시지 스타일
 */
export const NotificationModes = {
  HORROR: {
    name: 'HORROR',
    displayName: '공포 모드',
    emoji: '👻',
    messages: [
      '후후후... {course} 수업이 1시간 뒤에 너를 기다리고 있다...',
      '어둠 속에서 {course} 교수님의 목소리가 들려온다... "오지 않으면..."',
      '삐빅... 시스템 오류... {course} 출석 체크... 실패하면... 끔찍한 일이...',
      '거울 속에 {course} 시험지가 보인다... 1시간 후면 현실이 된다...',
      '저주받은 {course} 강의실 {room}... 1시간 뒤 그곳으로 가야만 한다...',
      '{course} 수업을 빠뜨린 학생들은... 모두... 사라졌다고 한다...',
      '핏빛 시계가 울린다... {course}까지 1시간... 도망칠 수 없다...',
      '벽에서 피가 흘러내린다... "{course} 1시간 전"이라고 쓰여있다...'
    ]
  },

  SURPRISE: {
    name: 'SURPRISE',
    displayName: '놀람 모드',
    emoji: '😱',
    messages: [
      '띠링!!! {course} 수업이야!!! 1시간 남았어!!!',
      '헉!!! 깜빡했지??? {course} 1시간 전이야!!!',
      '앗!!! {course} 교수님이 출석 체크 한대!!!',
      '어머!!!!! {course} 과제 제출 오늘까지래!!! 그리고 1시간 뒤 수업!!!',
      '띠용?! {course} {room}호 1시간 전이야!!!',
      '얼른얼른!!! {course} 준비해!!! 시간 없어!!!',
      '큰일났다!!! {course} 1시간 남았어!!!',
      '깜짝이야!!! {course} 교수님 오신대!!! 1시간 전!!!'
    ]
  },

  FRESH: {
    name: 'FRESH',
    displayName: '신선 모드',
    emoji: '🌱',
    messages: [
      '상큼한 아침! {course} 수업이 1시간 뒤에 시작돼요 🌅',
      '새로운 지식의 향기! {course} 강의가 곧 시작됩니다 ✨',
      '싱그러운 {course} 시간이 다가오고 있어요! 🍃',
      '푸르른 학습의 길! {course} 1시간 전입니다 🌿',
      '청량한 {course} 수업 준비하세요! 💧',
      '산뜻하게! {course} {room}호에서 만나요! 🌸',
      '상쾌한 지식 충전 타임! {course} 1시간 남았어요 🌈',
      '생기발랄 {course} 타임! 교수님: {instructor} 🌺'
    ]
  },

  MOOD_CHANGE: {
    name: 'MOOD_CHANGE',
    displayName: '기분환기 모드',
    emoji: '🎨',
    messages: [
      '날아라! 슈퍼 {course} 타임! 1시간 뒤 변신 준비! 🦸',
      '땡땡땡! {course} 게임 스타트까지 1시간! 준비됐나요? 🎮',
      '우주에서 온 메시지: {course} 행성 도착까지 1시간 🚀',
      '마법의 {course} 수업이 1시간 뒤 열립니다! 마법봉 챙기세요! 🪄',
      '비밀 요원 임무: {course} {room}호 침투작전 1시간 전! 🕵️',
      '타임머신 작동! {course} 시대로 1시간 뒤 출발! ⏰',
      'RPG 퀘스트: {course} 던전 공략 1시간 전! ⚔️',
      'DJ {instructor}의 {course} 파티가 1시간 뒤 시작! 🎧'
    ]
  },

  CUTE: {
    name: 'CUTE',
    displayName: '귀여움 모드',
    emoji: '🐱',
    messages: [
      '냥냥! {course} 수업이 1시간 뒤옹~ 😺',
      '뿅뿅! {course} 시간이 다가오고 있어용~ 🎀',
      '삐약삐약! {course} 준비하라옹! 🐥',
      '몽글몽글~ {course} {room}호로 가야해용! ☁️',
      '토닥토닥~ {course} 1시간 남았다옹! 💕',
      '꾸르륵~ 공부 배고파! {course} 먹으러 가자옹! 🍰',
      '보들보들~ {course} 시간이당~ {instructor} 교수님! 🧸',
      '뿌잉뿌잉~ {course} 1시간 전이에용! 🎈'
    ]
  },

  SERIOUS: {
    name: 'SERIOUS',
    displayName: '진지 모드',
    emoji: '📚',
    messages: [
      '{course} 수업이 1시간 후 시작됩니다. 준비하시기 바랍니다.',
      '알림: {course} 강의 시작 1시간 전입니다.',
      '{room}호 {course} 수업 준비 권장 시간입니다.',
      '{instructor} 교수님의 {course} 강의가 곧 시작됩니다.',
      '{course} 출석 체크 대비 1시간 전 알림입니다.',
      '수업 일정 알림: {course} 1시간 전',
      '{course} 강의실 이동 권장 시간입니다.',
      '학습 준비: {course} 수업 1시간 전'
    ]
  },

  MOTIVATIONAL: {
    name: 'MOTIVATIONAL',
    displayName: '동기부여 모드',
    emoji: '💪',
    messages: [
      '할 수 있다! {course}로 미래를 개척하자! 1시간 전! 🔥',
      '오늘도 화이팅! {course} 정복하러 가자! 💪',
      '넌 할 수 있어! {course} 1시간 뒤 도전! ⭐',
      '성공으로 가는 길! {course} {room}호에서 기다린다! 🏆',
      '꿈을 향해! {course}가 너를 기다려! 1시간 남았어! 🌟',
      '포기하지 마! {course}로 한 걸음 더! 🚀',
      'Today\'s Hero! {course} 수업으로 레벨업! 🎯',
      '불가능은 없다! {course} 마스터하러 가자! 👊'
    ]
  }
};

/**
 * 랜덤 메시지 가져오기
 */
export function getRandomMessage(mode, course) {
  const modeObj = NotificationModes[mode] || NotificationModes.FRESH;
  const message = modeObj.messages[Math.floor(Math.random() * modeObj.messages.length)];

  return message
    .replace('{course}', course.name)
    .replace('{instructor}', course.instructor)
    .replace('{room}', course.room);
}

/**
 * 모든 모드 목록 가져오기
 */
export function getAllModes() {
  return Object.values(NotificationModes);
}

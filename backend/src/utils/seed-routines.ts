import { prisma } from '../config/database';
import logger from './logger';

const routineTypes = [
  // 호흡 운동 (Breathing Exercises)
  {
    name: '4-7-8 Breathing',
    nameKo: '4-7-8 호흡법',
    category: 'breathing',
    description: 'A relaxing breathing pattern that helps reduce anxiety and promote calmness',
    duration: 120, // 2 minutes
    difficulty: 'easy',
    content: {
      steps: [
        { duration: 4, instruction: 'Breathe in through your nose', instructionKo: '코로 숨을 들이마시세요' },
        { duration: 7, instruction: 'Hold your breath', instructionKo: '숨을 참으세요' },
        { duration: 8, instruction: 'Exhale slowly through your mouth', instructionKo: '입으로 천천히 숨을 내쉬세요' },
      ],
      repeat: 4,
      tips: 'Place one hand on your chest and the other on your belly to feel your breath',
      tipsKo: '한 손은 가슴에, 다른 손은 배에 올려 호흡을 느껴보세요',
    },
  },
  {
    name: 'Box Breathing',
    nameKo: '박스 호흡법',
    category: 'breathing',
    description: 'Equal breathing pattern used by Navy SEALs to stay calm under pressure',
    duration: 180, // 3 minutes
    difficulty: 'easy',
    content: {
      steps: [
        { duration: 4, instruction: 'Breathe in', instructionKo: '숨을 들이마시세요' },
        { duration: 4, instruction: 'Hold', instructionKo: '숨을 참으세요' },
        { duration: 4, instruction: 'Breathe out', instructionKo: '숨을 내쉬세요' },
        { duration: 4, instruction: 'Hold', instructionKo: '숨을 참으세요' },
      ],
      repeat: 6,
      tips: 'Visualize drawing a square with each breath',
      tipsKo: '각 호흡마다 사각형을 그린다고 상상해보세요',
    },
  },
  {
    name: 'Deep Belly Breathing',
    nameKo: '복식 호흡',
    category: 'breathing',
    description: 'Diaphragmatic breathing to activate relaxation response',
    duration: 180, // 3 minutes
    difficulty: 'easy',
    content: {
      steps: [
        { duration: 5, instruction: 'Breathe deeply into your belly', instructionKo: '배로 깊게 숨을 들이마시세요' },
        { duration: 2, instruction: 'Hold gently', instructionKo: '부드럽게 숨을 참으세요' },
        { duration: 6, instruction: 'Exhale completely', instructionKo: '완전히 숨을 내쉬세요' },
      ],
      repeat: 8,
      tips: 'Let your belly expand like a balloon',
      tipsKo: '배가 풍선처럼 부풀어 오르게 하세요',
    },
  },

  // 명상 (Meditation)
  {
    name: '1-Minute Mindfulness',
    nameKo: '1분 마음챙김',
    category: 'meditation',
    description: 'Quick mindfulness meditation to center yourself',
    duration: 60, // 1 minute
    difficulty: 'easy',
    content: {
      steps: [
        { duration: 60, instruction: 'Close your eyes and focus on your breath. Notice any thoughts without judgment.', instructionKo: '눈을 감고 호흡에 집중하세요. 판단 없이 떠오르는 생각을 관찰하세요.' },
      ],
      tips: 'Return to your breath whenever your mind wanders',
      tipsKo: '마음이 흐트러지면 호흡으로 돌아오세요',
    },
  },
  {
    name: 'Body Scan',
    nameKo: '바디 스캔',
    category: 'meditation',
    description: 'Progressive relaxation by scanning through your body',
    duration: 300, // 5 minutes
    difficulty: 'medium',
    content: {
      steps: [
        { duration: 30, instruction: 'Focus on your head and face, release tension', instructionKo: '머리와 얼굴에 집중하고 긴장을 풀어주세요' },
        { duration: 30, instruction: 'Move attention to neck and shoulders', instructionKo: '목과 어깨로 주의를 이동하세요' },
        { duration: 40, instruction: 'Scan through your arms and hands', instructionKo: '팔과 손을 스캔하세요' },
        { duration: 50, instruction: 'Notice your chest and breathing', instructionKo: '가슴과 호흡을 느껴보세요' },
        { duration: 50, instruction: 'Move through your torso and back', instructionKo: '몸통과 등을 훑어보세요' },
        { duration: 60, instruction: 'Scan down through legs and feet', instructionKo: '다리와 발을 아래로 스캔하세요' },
        { duration: 40, instruction: 'Feel your whole body relaxed', instructionKo: '전체 몸이 이완된 것을 느끼세요' },
      ],
      tips: 'Notice sensations without trying to change them',
      tipsKo: '감각을 바꾸려 하지 말고 그냥 관찰하세요',
    },
  },
  {
    name: 'Gratitude Moment',
    nameKo: '감사 명상',
    category: 'meditation',
    description: 'Reflect on things you\'re grateful for',
    duration: 120, // 2 minutes
    difficulty: 'easy',
    content: {
      steps: [
        { duration: 120, instruction: 'Think of 3 things you\'re grateful for today. Feel the appreciation.', instructionKo: '오늘 감사한 3가지를 생각해보세요. 감사함을 느껴보세요.' },
      ],
      tips: 'Even small things count - a good meal, sunshine, a smile',
      tipsKo: '작은 것도 괜찮아요 - 맛있는 음식, 햇살, 미소 등',
    },
  },

  // 스트레칭 (Stretching)
  {
    name: 'Neck and Shoulder Release',
    nameKo: '목과 어깨 이완',
    category: 'stretching',
    description: 'Quick stretches to release upper body tension',
    duration: 180, // 3 minutes
    difficulty: 'easy',
    content: {
      steps: [
        { duration: 30, instruction: 'Roll shoulders backward 10 times', instructionKo: '어깨를 뒤로 10번 돌리세요' },
        { duration: 30, instruction: 'Tilt head to right, hold gently', instructionKo: '머리를 오른쪽으로 기울이고 유지하세요' },
        { duration: 30, instruction: 'Tilt head to left, hold gently', instructionKo: '머리를 왼쪽으로 기울이고 유지하세요' },
        { duration: 30, instruction: 'Turn head right and hold', instructionKo: '머리를 오른쪽으로 돌리고 유지하세요' },
        { duration: 30, instruction: 'Turn head left and hold', instructionKo: '머리를 왼쪽으로 돌리고 유지하세요' },
        { duration: 30, instruction: 'Gently drop chin to chest', instructionKo: '턱을 가슴 쪽으로 천천히 내리세요' },
      ],
      tips: 'Move slowly and breathe deeply',
      tipsKo: '천천히 움직이고 깊게 호흡하세요',
    },
  },
  {
    name: 'Seated Spinal Twist',
    nameKo: '앉아서 하는 척추 비틀기',
    category: 'stretching',
    description: 'Gentle twist to release back tension',
    duration: 120, // 2 minutes
    difficulty: 'easy',
    content: {
      steps: [
        { duration: 60, instruction: 'Sit tall, twist to the right, hold', instructionKo: '똑바로 앉아 오른쪽으로 비틀고 유지하세요' },
        { duration: 60, instruction: 'Return to center, twist to the left, hold', instructionKo: '중앙으로 돌아와 왼쪽으로 비틀고 유지하세요' },
      ],
      tips: 'Keep your spine long and breathe into the stretch',
      tipsKo: '척추를 길게 유지하고 스트레칭하며 호흡하세요',
    },
  },
  {
    name: 'Wrist and Hand Stretch',
    nameKo: '손목과 손 스트레칭',
    category: 'stretching',
    description: 'Release tension from typing and writing',
    duration: 120, // 2 minutes
    difficulty: 'easy',
    content: {
      steps: [
        { duration: 20, instruction: 'Make fists and release 10 times', instructionKo: '주먹을 쥐었다 펴기를 10번 반복하세요' },
        { duration: 30, instruction: 'Extend right arm, pull fingers back gently', instructionKo: '오른팔을 펴고 손가락을 부드럽게 뒤로 당기세요' },
        { duration: 30, instruction: 'Extend right arm, pull fingers down gently', instructionKo: '오른팔을 펴고 손가락을 부드럽게 아래로 당기세요' },
        { duration: 40, instruction: 'Repeat with left hand', instructionKo: '왼손으로 반복하세요' },
      ],
      tips: 'Gentle pressure only - never force',
      tipsKo: '부드럽게만 - 절대 강제로 하지 마세요',
    },
  },

  // 휴식 (Break)
  {
    name: 'Eye Rest',
    nameKo: '눈 휴식',
    category: 'break',
    description: 'Give your eyes a break from screens',
    duration: 120, // 2 minutes
    difficulty: 'easy',
    content: {
      steps: [
        { duration: 20, instruction: 'Look away from screen at something 20 feet away', instructionKo: '화면에서 눈을 떼고 6미터 정도 떨어진 곳을 보세요' },
        { duration: 20, instruction: 'Blink slowly 10 times', instructionKo: '천천히 10번 깜빡이세요' },
        { duration: 30, instruction: 'Close eyes and cover with palms', instructionKo: '눈을 감고 손바닥으로 덮으세요' },
        { duration: 30, instruction: 'Massage temples gently in circles', instructionKo: '관자놀이를 원을 그리며 부드럽게 마사지하세요' },
        { duration: 20, instruction: 'Look up, down, left, right slowly', instructionKo: '위, 아래, 왼쪽, 오른쪽을 천천히 보세요' },
      ],
      tips: 'Follow the 20-20-20 rule: every 20 min, look 20 feet away for 20 seconds',
      tipsKo: '20-20-20 규칙: 20분마다 6미터 떨어진 곳을 20초간 보세요',
    },
  },
  {
    name: 'Hydration Break',
    nameKo: '수분 보충 휴식',
    category: 'break',
    description: 'Mindful water drinking break',
    duration: 60, // 1 minute
    difficulty: 'easy',
    content: {
      steps: [
        { duration: 60, instruction: 'Drink a glass of water slowly and mindfully. Notice the sensation.', instructionKo: '물 한 잔을 천천히 마음을 담아 마시세요. 감각을 느껴보세요.' },
      ],
      tips: 'Stay hydrated! Aim for 8 glasses a day',
      tipsKo: '수분을 유지하세요! 하루 8잔을 목표로 하세요',
    },
  },
  {
    name: 'Quick Walk',
    nameKo: '짧은 걷기',
    category: 'break',
    description: 'Take a short walk to refresh',
    duration: 300, // 5 minutes
    difficulty: 'easy',
    content: {
      steps: [
        { duration: 300, instruction: 'Take a 5-minute walk. Notice your surroundings. Breathe fresh air.', instructionKo: '5분간 걸으세요. 주변을 관찰하세요. 신선한 공기를 마시세요.' },
      ],
      tips: 'Even a short walk can boost energy and creativity',
      tipsKo: '짧은 걷기도 에너지와 창의성을 높일 수 있어요',
    },
  },

  // 긍정 메시지 (Positive Messages)
  {
    name: 'Affirmation',
    nameKo: '긍정 확언',
    category: 'message',
    description: 'Positive affirmation to boost confidence',
    duration: 30,
    difficulty: 'easy',
    content: {
      messages: [
        { text: 'You are doing great! Keep up the good work!', textKo: '정말 잘하고 있어요! 계속 열심히 하세요!' },
        { text: 'Every question you answer makes you smarter!', textKo: '문제를 풀 때마다 더 똑똑해지고 있어요!' },
        { text: 'Learning is a journey, not a race. You\'re on the right path!', textKo: '배움은 경주가 아니라 여정이에요. 올바른 길을 가고 있어요!' },
        { text: 'Mistakes help us learn. You\'re growing with each step!', textKo: '실수는 배움의 기회예요. 매 순간 성장하고 있어요!' },
        { text: 'Take a deep breath. You\'ve got this!', textKo: '깊게 숨을 쉬세요. 당신은 해낼 수 있어요!' },
        { text: 'Your effort today shapes your success tomorrow!', textKo: '오늘의 노력이 내일의 성공을 만들어요!' },
        { text: 'Believe in yourself. You are capable of amazing things!', textKo: '자신을 믿으세요. 당신은 놀라운 일을 해낼 수 있어요!' },
        { text: 'Rest is part of learning. Take care of yourself!', textKo: '휴식도 배움의 일부예요. 자신을 돌보세요!' },
      ],
    },
  },
];

export async function initializeRoutineTypes() {
  try {
    // Check if routine types already exist
    const count = await prisma.routineType.count();

    if (count > 0) {
      logger.info(`Routine types already initialized (${count} types)`);
      return;
    }

    // Create routine types
    for (const routine of routineTypes) {
      await prisma.routineType.create({
        data: routine,
      });
    }

    logger.info(`✅ Initialized ${routineTypes.length} routine types`);
  } catch (error) {
    logger.error('Error initializing routine types:', error);
    throw error;
  }
}

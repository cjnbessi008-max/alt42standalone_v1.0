/**
 * Empathetic Feedback Message Library
 *
 * Provides supportive, encouraging messages for student learning interactions
 * Instead of pressuring language, uses growth mindset and emotional support
 */

export type FeedbackType = 'wrong' | 'correct' | 'partial' | 'encouragement';
export type Language = 'ko' | 'en';

export interface FeedbackContext {
  attemptNumber?: number;
  totalProblemsToday?: number;
  recentSuccessRate?: number;
  studentName?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
}

export interface FeedbackMessage {
  text: string;
  emoji?: string;
  color: string;
  icon?: string;
}

/**
 * Korean Empathetic Messages (한국어 공감형 메시지)
 */
const KOREAN_MESSAGES = {
  wrong: [
    "괜찮아요! 실수는 배움의 과정이에요 🌱",
    "이 문제가 어려운가봐요. 함께 다시 생각해볼까요? 🤔",
    "열심히 노력하는 모습이 보여요! 계속 해봐요 💪",
    "조금 더 생각해보면 답을 찾을 수 있을 거예요! 💡",
    "틀려도 괜찮아요. 배우는 중이니까요! 😊",
    "이런 식으로 시도하는 것도 배움이에요! 🌟",
    "다시 한번 천천히 살펴볼까요? 🔍",
    "좋은 시도였어요! 다른 방법으로 해볼까요? 🎯",
  ],

  correct: [
    "정말 잘했어요! 👏 완벽해요!",
    "와! 정말 똑똑한데요? 🌟",
    "이해를 정말 잘했네요! 자랑스러워요! 🎉",
    "맞았어요! 멋진 실력이에요! ⭐",
    "완벽해요! 이 개념을 정말 잘 이해했네요! 💯",
    "훌륭해요! 계속 이렇게만 하면 돼요! 🚀",
    "대단해요! 문제를 정확히 풀었어요! 🏆",
    "멋져요! 이제 이 개념은 마스터한 것 같아요! ✨",
  ],

  partial: [
    "거의 다 왔어요! 조금만 더! 🚀",
    "이 부분까지는 완벽해요! 💫",
    "좋은 시도예요! 이런 식으로 생각하는 거 맞아요 💡",
    "잘 하고 있어요! 한 단계만 더 생각해봐요! 🎯",
    "맞는 방향으로 가고 있어요! 계속해봐요! 🌈",
    "절반 이상은 맞았어요! 나머지도 할 수 있어요! ⭐",
  ],

  encouragement: [
    "열심히 하고 있네요! 계속 해봐요! 💪",
    "포기하지 마세요! 조금만 더 힘내봐요! 🌟",
    "쉬었다가 다시 시도해봐요. 잘 할 수 있어요! 😊",
    "이미 많이 배웠어요! 대단해요! 📚",
    "천천히 해도 괜찮아요. 시간을 가지세요! ⏰",
  ],
};

/**
 * English Empathetic Messages
 */
const ENGLISH_MESSAGES = {
  wrong: [
    "That's okay! Mistakes are part of learning 🌱",
    "This one is tricky. Let's think about it together 🤔",
    "I can see you're trying hard! Keep going 💪",
    "Think about it a bit more - you can find the answer! 💡",
    "It's okay to be wrong. You're learning! 😊",
    "That's a good attempt! Let's try another way 🎯",
    "Let's look at this carefully one more time 🔍",
    "Nice try! Want to approach it differently? 🌟",
  ],

  correct: [
    "Amazing work! Perfect! 👏",
    "Wow! You're really smart! 🌟",
    "You understand this so well! I'm proud of you! 🎉",
    "That's right! Excellent skills! ⭐",
    "Perfect! You really understand this concept! 💯",
    "Outstanding! Keep it up! 🚀",
    "Fantastic! You solved it correctly! 🏆",
    "Brilliant! You've mastered this! ✨",
  ],

  partial: [
    "You're almost there! Just a bit more! 🚀",
    "This part is perfect! 💫",
    "Good thinking! You're on the right track 💡",
    "You're doing well! Think one more step! 🎯",
    "You're heading in the right direction! Keep going! 🌈",
    "More than half correct! You can do the rest! ⭐",
  ],

  encouragement: [
    "You're working hard! Keep it up! 💪",
    "Don't give up! You can do it! 🌟",
    "Take a break and try again. You've got this! 😊",
    "You've already learned so much! Amazing! 📚",
    "Take your time. It's okay to go slow! ⏰",
  ],
};

/**
 * Get random message from array (with rotation to avoid immediate repetition)
 */
let lastMessageIndices: Record<string, number> = {};

function getRandomMessage(messages: string[], key: string): string {
  if (messages.length === 1) return messages[0];

  let index: number;
  do {
    index = Math.floor(Math.random() * messages.length);
  } while (index === lastMessageIndices[key] && messages.length > 1);

  lastMessageIndices[key] = index;
  return messages[index];
}

/**
 * Get color scheme based on feedback type
 */
function getColorScheme(type: FeedbackType): { bg: string; text: string; border: string } {
  switch (type) {
    case 'correct':
      return {
        bg: 'bg-green-50',
        text: 'text-green-800',
        border: 'border-green-200',
      };
    case 'partial':
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
      };
    case 'wrong':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-200',
      };
    case 'encouragement':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
      };
  }
}

/**
 * Personalize message with context
 */
function personalizeMessage(message: string, context: FeedbackContext): string {
  let personalized = message;

  // Add student name if provided
  if (context.studentName) {
    personalized = `${context.studentName}님, ${personalized}`;
  }

  // Add daily progress if significant
  if (context.totalProblemsToday && context.totalProblemsToday > 5) {
    personalized += ` (오늘 ${context.totalProblemsToday}문제 풀었어요!)`;
  }

  // Add encouragement based on attempt number
  if (context.attemptNumber && context.attemptNumber > 3) {
    personalized += " 포기하지 않는 모습이 멋져요! 💪";
  }

  return personalized;
}

/**
 * Main function to get empathetic feedback message
 */
export function getEmpatheticFeedback(
  type: FeedbackType,
  language: Language = 'ko',
  context: FeedbackContext = {}
): FeedbackMessage {
  const messages = language === 'ko' ? KOREAN_MESSAGES : ENGLISH_MESSAGES;
  const messageArray = messages[type];

  const key = `${language}-${type}`;
  let text = getRandomMessage(messageArray, key);

  // Personalize message based on context
  if (language === 'ko') {
    text = personalizeMessage(text, context);
  }

  // Extract emoji from message if present
  const emojiMatch = text.match(/[\p{Emoji}]/u);
  const emoji = emojiMatch ? emojiMatch[0] : undefined;

  const colorScheme = getColorScheme(type);

  return {
    text,
    emoji,
    color: colorScheme.bg,
    icon: type === 'correct' ? 'check-circle' : type === 'wrong' ? 'info-circle' : 'star',
  };
}

/**
 * Get feedback based on answer correctness
 */
export function getFeedbackForAnswer(
  isCorrect: boolean,
  attemptNumber: number = 1,
  context: FeedbackContext = {},
  language: Language = 'ko'
): FeedbackMessage {
  const updatedContext = { ...context, attemptNumber };

  if (isCorrect) {
    return getEmpatheticFeedback('correct', language, updatedContext);
  } else if (attemptNumber >= 3) {
    // After 3 attempts, provide encouragement instead of just "wrong"
    return getEmpatheticFeedback('encouragement', language, updatedContext);
  } else {
    return getEmpatheticFeedback('wrong', language, updatedContext);
  }
}

/**
 * Get specific feedback based on percentage correct
 */
export function getFeedbackByPercentage(
  percentCorrect: number,
  context: FeedbackContext = {},
  language: Language = 'ko'
): FeedbackMessage {
  if (percentCorrect >= 90) {
    return getEmpatheticFeedback('correct', language, context);
  } else if (percentCorrect >= 50) {
    return getEmpatheticFeedback('partial', language, context);
  } else {
    return getEmpatheticFeedback('wrong', language, context);
  }
}

/**
 * Export message libraries for direct access if needed
 */
export const messageLibrary = {
  ko: KOREAN_MESSAGES,
  en: ENGLISH_MESSAGES,
};

import { EmotionOption, EmotionType } from '../types';

export const emotionOptions: EmotionOption[] = [
  {
    type: 'happy',
    label: '행복해요',
    emoji: '😊',
    color: '#4caf50',
  },
  {
    type: 'confident',
    label: '자신있어요',
    emoji: '😎',
    color: '#2196f3',
  },
  {
    type: 'neutral',
    label: '보통이에요',
    emoji: '😐',
    color: '#9e9e9e',
  },
  {
    type: 'confused',
    label: '헷갈려요',
    emoji: '😕',
    color: '#ff9800',
  },
  {
    type: 'frustrated',
    label: '답답해요',
    emoji: '😣',
    color: '#f44336',
  },
];

export const getEmotionConfig = (type: EmotionType): EmotionOption => {
  return emotionOptions.find((opt) => opt.type === type) || emotionOptions[2];
};

export const getEmotionColor = (type: EmotionType): string => {
  return getEmotionConfig(type).color;
};

export const getEmotionEmoji = (type: EmotionType): string => {
  return getEmotionConfig(type).emoji;
};

export const getEmotionLabel = (type: EmotionType): string => {
  return getEmotionConfig(type).label;
};

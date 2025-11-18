/**
 * 앱 테마/스킨 설정
 */
export const AppThemes = {
  DARK_HORROR: {
    name: 'DARK_HORROR',
    displayName: '다크 호러',
    emoji: '🦇',
    primaryColor: '#8B0000',
    secondaryColor: '#2C0000',
    backgroundColor: '#1A0000',
    textColor: '#FFFFFF',
    cardBackground: '#2C0000'
  },

  NEON_CYBER: {
    name: 'NEON_CYBER',
    displayName: '네온 사이버',
    emoji: '⚡',
    primaryColor: '#FF00FF',
    secondaryColor: '#00FFFF',
    backgroundColor: '#0A0A1F',
    textColor: '#FFFFFF',
    cardBackground: '#1A1A3F'
  },

  PASTEL_DREAM: {
    name: 'PASTEL_DREAM',
    displayName: '파스텔 드림',
    emoji: '🌸',
    primaryColor: '#FFB3BA',
    secondaryColor: '#BAFFC9',
    backgroundColor: '#FFFFBA',
    textColor: '#333333',
    cardBackground: '#FFFFFF'
  },

  OCEAN_BLUE: {
    name: 'OCEAN_BLUE',
    displayName: '오션 블루',
    emoji: '🌊',
    primaryColor: '#1E88E5',
    secondaryColor: '#0D47A1',
    backgroundColor: '#E3F2FD',
    textColor: '#000000',
    cardBackground: '#FFFFFF'
  },

  FOREST_GREEN: {
    name: 'FOREST_GREEN',
    displayName: '포레스트 그린',
    emoji: '🌲',
    primaryColor: '#388E3C',
    secondaryColor: '#1B5E20',
    backgroundColor: '#E8F5E9',
    textColor: '#000000',
    cardBackground: '#FFFFFF'
  },

  SUNSET_ORANGE: {
    name: 'SUNSET_ORANGE',
    displayName: '선셋 오렌지',
    emoji: '🌅',
    primaryColor: '#FF6F00',
    secondaryColor: '#E65100',
    backgroundColor: '#FFF3E0',
    textColor: '#000000',
    cardBackground: '#FFFFFF'
  },

  GALAXY_PURPLE: {
    name: 'GALAXY_PURPLE',
    displayName: '갤럭시 퍼플',
    emoji: '🌌',
    primaryColor: '#7B1FA2',
    secondaryColor: '#4A148C',
    backgroundColor: '#F3E5F5',
    textColor: '#000000',
    cardBackground: '#FFFFFF'
  },

  RETRO_GAME: {
    name: 'RETRO_GAME',
    displayName: '레트로 게임',
    emoji: '🎮',
    primaryColor: '#00FF00',
    secondaryColor: '#FFFF00',
    backgroundColor: '#000000',
    textColor: '#00FF00',
    cardBackground: '#1A1A1A'
  },

  CANDY_POP: {
    name: 'CANDY_POP',
    displayName: '캔디 팝',
    emoji: '🍭',
    primaryColor: '#FF69B4',
    secondaryColor: '#FF1493',
    backgroundColor: '#FFF0F5',
    textColor: '#000000',
    cardBackground: '#FFFFFF'
  },

  MINIMALIST: {
    name: 'MINIMALIST',
    displayName: '미니멀리스트',
    emoji: '⚪',
    primaryColor: '#424242',
    secondaryColor: '#757575',
    backgroundColor: '#FAFAFA',
    textColor: '#212121',
    cardBackground: '#FFFFFF'
  }
};

/**
 * 모든 테마 목록 가져오기
 */
export function getAllThemes() {
  return Object.values(AppThemes);
}

/**
 * 테마 이름으로 테마 가져오기
 */
export function getTheme(themeName) {
  return AppThemes[themeName] || AppThemes.OCEAN_BLUE;
}

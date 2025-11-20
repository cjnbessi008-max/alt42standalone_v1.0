// 플레이어 능력치
export interface PlayerStats {
  creativity: number;    // 창의성
  intuition: number;     // 직관
  persistence: number;   // 집착
  logic: number;         // 논리
  imagination: number;   // 상상력
}

// 카드
export interface Card {
  id: string;
  title: string;
  era: string;
  description: string;
  mathematician?: string;
  visual: string;
  statsGained: Partial<PlayerStats>;
}

// 인터랙션 타입
export type InteractionType = 'puzzle' | 'simulation' | 'debate' | 'minigame';

// 클리어 조건
export interface ClearCondition {
  description: string;
  type: 'basic' | 'bonus';
  statsReward: Partial<PlayerStats>;
  checkCondition?: (progress: any) => boolean;
}

// 장면
export interface Scene {
  id: string;
  chapterId: number;
  sceneNumber: number;
  title: string;
  era: string;
  location: string;
  narrative: string;
  interactionType: InteractionType;
  clearConditions: ClearCondition[];
  cardReward: string;
}

// 챕터
export interface Chapter {
  id: number;
  title: string;
  scenes: Scene[];
  totalCards: number;
}

// 게임 진행 상황
export interface GameProgress {
  currentChapter: number;
  currentScene: number;
  completedScenes: string[];
  collectedCards: Card[];
  playerStats: PlayerStats;
}

// 장면 전환 데이터
export interface SceneTransition {
  from: string;
  to: string;
  narrative: string;
  statsUpdate: Partial<PlayerStats>;
  cardAcquired?: Card;
}

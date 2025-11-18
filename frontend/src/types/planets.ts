/**
 * KTM Math Planet - Planet Type Definitions
 */

export enum PlanetNumber {
  DISCOVERY = 1,
  LOGIC = 2,
  DATA = 3,
  INTERFACE = 4,
  CREATION = 5,
  LAUNCH = 6
}

export enum PlanetStatus {
  LOCKED = 'locked',
  ACTIVE = 'active',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export interface PlanetInfo {
  number: PlanetNumber;
  name: string;
  koreanName: string;
  icon: string;
  color: string;
  description: string;
  pipelineStage: string;
}

export interface PlanetProgress {
  planetNumber: PlanetNumber;
  status: PlanetStatus;
  progress: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  data: Record<string, any>;
}

export const PLANET_METADATA: Record<PlanetNumber, PlanetInfo> = {
  [PlanetNumber.DISCOVERY]: {
    number: PlanetNumber.DISCOVERY,
    name: 'Discovery Planet',
    koreanName: '발견의 행성',
    icon: '🔭',
    color: '#3B82F6', // Blue
    description: '교육 모듈의 개념과 구조를 발견합니다',
    pipelineStage: 'World Model Reconstruction'
  },
  [PlanetNumber.LOGIC]: {
    number: PlanetNumber.LOGIC,
    name: 'Logic Planet',
    koreanName: '논리의 행성',
    icon: '🧮',
    color: '#8B5CF6', // Purple
    description: '교육 규칙과 논리를 생성합니다',
    pipelineStage: 'Rule Generation Engine'
  },
  [PlanetNumber.DATA]: {
    number: PlanetNumber.DATA,
    name: 'Data Planet',
    koreanName: '데이터의 행성',
    icon: '💾',
    color: '#10B981', // Green
    description: '데이터베이스와 스키마를 구축합니다',
    pipelineStage: 'Data Management'
  },
  [PlanetNumber.INTERFACE]: {
    number: PlanetNumber.INTERFACE,
    name: 'Interface Planet',
    koreanName: '상호작용의 행성',
    icon: '🎮',
    color: '#F59E0B', // Yellow/Orange
    description: '입력 방식과 상호작용을 설계합니다',
    pipelineStage: 'Input Strategy Design'
  },
  [PlanetNumber.CREATION]: {
    number: PlanetNumber.CREATION,
    name: 'Creation Planet',
    koreanName: '창조의 행성',
    icon: '🎨',
    color: '#F97316', // Orange
    description: 'UI 컴포넌트를 자동 생성합니다',
    pipelineStage: 'UI Auto-Generation'
  },
  [PlanetNumber.LAUNCH]: {
    number: PlanetNumber.LAUNCH,
    name: 'Launch Planet',
    koreanName: '발사의 행성',
    icon: '🚀',
    color: '#EF4444', // Red
    description: '모듈을 배포하고 완성합니다',
    pipelineStage: 'Deployment'
  }
};

import { SimilarityCondition } from '../types/similarity';

/**
 * 삼각형 닮음 조건 데이터
 */
export const similarityConditions: SimilarityCondition[] = [
  {
    id: 'aaa',
    type: 'AAA',
    name: 'Angle-Angle-Angle',
    nameKo: '세 각이 같은 경우',
    description: 'Two triangles are similar if all three pairs of corresponding angles are equal',
    descriptionKo: '두 삼각형의 대응하는 세 쌍의 각이 모두 같으면 두 삼각형은 닮음이다',
    formula: '∠A = ∠A\', ∠B = ∠B\', ∠C = ∠C\'',
    example: 'If ∠A=60°, ∠B=70°, ∠C=50° in both triangles',
    color: '#FF6B6B',
    icon: '∠∠∠'
  },
  {
    id: 'sas',
    type: 'SAS',
    name: 'Side-Angle-Side',
    nameKo: '두 변의 비와 끼인각이 같은 경우',
    description: 'Two triangles are similar if two pairs of corresponding sides are proportional and the included angles are equal',
    descriptionKo: '두 삼각형에서 대응하는 두 변의 비가 같고, 그 끼인각이 같으면 두 삼각형은 닮음이다',
    formula: 'AB/A\'B\' = AC/A\'C\', ∠A = ∠A\'',
    example: 'If AB/A\'B\' = 2/1, AC/A\'C\' = 2/1, and ∠A = ∠A\' = 60°',
    color: '#4ECDC4',
    icon: '━∠━'
  },
  {
    id: 'sss',
    type: 'SSS',
    name: 'Side-Side-Side',
    nameKo: '세 변의 비가 같은 경우',
    description: 'Two triangles are similar if all three pairs of corresponding sides are proportional',
    descriptionKo: '두 삼각형에서 대응하는 세 변의 비가 모두 같으면 두 삼각형은 닮음이다',
    formula: 'AB/A\'B\' = BC/B\'C\' = CA/C\'A\'',
    example: 'If AB/A\'B\' = BC/B\'C\' = CA/C\'A\' = 2/1',
    color: '#95E1D3',
    icon: '━━━'
  }
];

/**
 * 닮음 조건 타입으로 조건 객체 찾기
 */
export const getSimilarityCondition = (type: string): SimilarityCondition | undefined => {
  return similarityConditions.find(condition => condition.type === type);
};

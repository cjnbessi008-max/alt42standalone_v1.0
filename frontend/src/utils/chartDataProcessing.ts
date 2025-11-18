import { FrequencyData, LMSProblemData } from '../types/frequency';

/**
 * LMS에서 받은 데이터를 도수분포 형식으로 변환
 */
export const processLMSData = (lmsData: LMSProblemData): FrequencyData[] => {
  return lmsData.frequencyData;
};

/**
 * 원시 데이터 배열을 도수분포로 변환
 * @param data 원시 데이터 배열
 * @param binSize 계급 크기
 */
export const createFrequencyDistribution = (
  data: number[],
  binSize: number = 10
): FrequencyData[] => {
  if (data.length === 0) return [];

  const min = Math.min(...data);
  const max = Math.max(...data);

  const binCount = Math.ceil((max - min) / binSize) + 1;
  const frequencies: Map<string, number> = new Map();

  // 도수 계산
  data.forEach(value => {
    const binIndex = Math.floor((value - min) / binSize);
    const binStart = min + binIndex * binSize;
    const binEnd = binStart + binSize;
    const label = `${binStart}-${binEnd}`;

    frequencies.set(label, (frequencies.get(label) || 0) + 1);
  });

  // FrequencyData 배열로 변환
  const result: FrequencyData[] = [];
  for (let i = 0; i < binCount; i++) {
    const binStart = min + i * binSize;
    const binEnd = binStart + binSize;
    const label = `${binStart}-${binEnd}`;
    result.push({
      label,
      value: frequencies.get(label) || 0,
    });
  }

  return result;
};

/**
 * Mock 데이터 생성 (테스트용)
 */
export const generateMockFrequencyData = (count: number = 6): FrequencyData[] => {
  const labels = [
    '0-10',
    '10-20',
    '20-30',
    '30-40',
    '40-50',
    '50-60',
    '60-70',
    '70-80',
    '80-90',
    '90-100',
  ];

  return labels.slice(0, count).map(label => ({
    label,
    value: Math.floor(Math.random() * 50) + 5,
  }));
};

/**
 * 도수분포 통계 계산
 */
export const calculateFrequencyStats = (data: FrequencyData[]) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const average = total / data.length;

  return {
    total,
    max,
    min,
    average,
  };
};

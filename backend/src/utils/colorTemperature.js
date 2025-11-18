/**
 * 로그 변화율을 색 온도로 변환하는 유틸리티
 *
 * 색 온도 스펙트럼:
 * - 파란색 (낮은 활동): #0066FF
 * - 청록색 (낮음-보통): #00AACC
 * - 초록색 (보통 활동): #00FF66
 * - 노란색 (높은 활동): #FFCC00
 * - 주황색 (높음-매우높음): #FF6600
 * - 빨간색 (매우 높은 활동): #FF3300
 */

/**
 * RGB 값을 HEX 색상 코드로 변환
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} HEX 색상 코드 (#RRGGBB)
 */
function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 두 색상 사이를 보간 (interpolate)
 * @param {Array} color1 - [r, g, b]
 * @param {Array} color2 - [r, g, b]
 * @param {number} factor - 0.0 ~ 1.0
 * @returns {Array} [r, g, b]
 */
function interpolateColor(color1, color2, factor) {
  const result = color1.slice();
  for (let i = 0; i < 3; i++) {
    result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
  }
  return result;
}

/**
 * 변화율(0-100)을 색 온도(HEX)로 변환
 * @param {number} changeRate - 변화율 (0-100)
 * @returns {string} HEX 색상 코드
 */
function changeRateToColor(changeRate) {
  // 입력값 정규화 (0-100 범위로 제한)
  const rate = Math.max(0, Math.min(100, changeRate));

  // 색상 키 포인트 정의 (RGB)
  const colorStops = [
    { threshold: 0, color: [0, 102, 255] },      // 파란색 #0066FF
    { threshold: 20, color: [0, 170, 204] },     // 청록색 #00AACC
    { threshold: 40, color: [0, 255, 102] },     // 초록색 #00FF66
    { threshold: 60, color: [255, 204, 0] },     // 노란색 #FFCC00
    { threshold: 80, color: [255, 102, 0] },     // 주황색 #FF6600
    { threshold: 100, color: [255, 51, 0] }      // 빨간색 #FF3300
  ];

  // 현재 변화율이 속한 구간 찾기
  let lowerStop = colorStops[0];
  let upperStop = colorStops[colorStops.length - 1];

  for (let i = 0; i < colorStops.length - 1; i++) {
    if (rate >= colorStops[i].threshold && rate <= colorStops[i + 1].threshold) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i + 1];
      break;
    }
  }

  // 구간 내에서의 위치 계산 (0.0 ~ 1.0)
  const range = upperStop.threshold - lowerStop.threshold;
  const factor = range === 0 ? 0 : (rate - lowerStop.threshold) / range;

  // 색상 보간
  const [r, g, b] = interpolateColor(lowerStop.color, upperStop.color, factor);

  return rgbToHex(r, g, b);
}

/**
 * 히트 스코어 계산 (로그 개수와 변화율 모두 고려)
 * @param {number} logCount - 로그 개수
 * @param {number} changeRate - 변화율 (0-100)
 * @param {number} maxLogs - 최대 로그 개수 (정규화용)
 * @returns {number} 히트 스코어 (0-100)
 */
function calculateHeatScore(logCount, changeRate, maxLogs = 1000) {
  // 로그 개수를 0-50 범위로 정규화
  const normalizedCount = Math.min(50, (logCount / maxLogs) * 50);

  // 변화율을 0-50 범위로 정규화
  const normalizedChange = Math.min(50, changeRate / 2);

  // 히트 스코어 = 로그 개수(50%) + 변화율(50%)
  const heatScore = normalizedCount + normalizedChange;

  return Math.round(heatScore * 100) / 100; // 소수점 2자리
}

/**
 * 히트 레벨 텍스트 반환
 * @param {number} heatScore - 히트 스코어 (0-100)
 * @returns {string} 히트 레벨
 */
function getHeatLevel(heatScore) {
  if (heatScore < 20) return 'Very Low';
  if (heatScore < 40) return 'Low';
  if (heatScore < 60) return 'Medium';
  if (heatScore < 80) return 'High';
  return 'Very High';
}

/**
 * 색상 코드를 밝기 값으로 변환 (0-255)
 * @param {string} hexColor - HEX 색상 코드
 * @returns {number} 밝기 값
 */
function getBrightness(hexColor) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // 상대적 밝기 계산 (ITU-R BT.709)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 배경색에 맞는 텍스트 색상 반환
 * @param {string} backgroundColor - 배경 HEX 색상
 * @returns {string} 텍스트 색상 (#FFFFFF 또는 #000000)
 */
function getTextColor(backgroundColor) {
  const brightness = getBrightness(backgroundColor);
  return brightness > 128 ? '#000000' : '#FFFFFF';
}

module.exports = {
  changeRateToColor,
  calculateHeatScore,
  getHeatLevel,
  getBrightness,
  getTextColor,
  rgbToHex,
  interpolateColor
};

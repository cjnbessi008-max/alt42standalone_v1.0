"""
깊은 한숨 감지 서비스
학생의 오디오 스트림에서 한숨 패턴을 감지합니다.
"""
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import numpy as np


class SighIntensity(Enum):
    """한숨 강도 레벨"""
    LIGHT = "light"
    MODERATE = "moderate"
    DEEP = "deep"


class SighDetectionResult:
    """한숨 감지 결과"""

    def __init__(
        self,
        detected: bool,
        intensity: Optional[SighIntensity] = None,
        confidence: float = 0.0,
        timestamp: Optional[datetime] = None,
        audio_features: Optional[Dict[str, Any]] = None
    ):
        self.detected = detected
        self.intensity = intensity
        self.confidence = confidence
        self.timestamp = timestamp or datetime.now()
        self.audio_features = audio_features or {}

    def to_dict(self) -> Dict[str, Any]:
        """딕셔너리로 변환"""
        return {
            "detected": self.detected,
            "intensity": self.intensity.value if self.intensity else None,
            "confidence": self.confidence,
            "timestamp": self.timestamp.isoformat(),
            "audio_features": self.audio_features
        }


class SighDetector:
    """
    깊은 한숨 감지기

    오디오 신호 분석을 통해 학생의 한숨을 감지합니다.
    - 호흡 패턴 분석
    - 주파수 스펙트럼 분석
    - 지속 시간 및 강도 측정
    """

    # 한숨 감지 임계값 설정
    SIGH_FREQUENCY_RANGE = (100, 500)  # Hz
    SIGH_MIN_DURATION = 0.8  # seconds
    SIGH_MAX_DURATION = 3.0  # seconds
    CONFIDENCE_THRESHOLD = 0.7

    # 스트레스 누적 임계값
    STRESS_ACCUMULATION_THRESHOLD = 3  # 일정 시간 내 한숨 횟수
    STRESS_TIME_WINDOW = timedelta(minutes=10)  # 시간 윈도우

    def __init__(self):
        self.sigh_history = []
        self.stress_level = 0.0

    def analyze_audio_signal(
        self,
        audio_data: np.ndarray,
        sample_rate: int = 16000
    ) -> SighDetectionResult:
        """
        오디오 신호 분석하여 한숨 감지

        Args:
            audio_data: 오디오 샘플 데이터 (numpy array)
            sample_rate: 샘플링 레이트 (Hz)

        Returns:
            SighDetectionResult: 감지 결과
        """
        # 1. 주파수 도메인 변환 (FFT)
        fft_result = np.fft.fft(audio_data)
        frequencies = np.fft.fftfreq(len(audio_data), 1/sample_rate)
        magnitude = np.abs(fft_result)

        # 2. 한숨 주파수 대역 에너지 계산
        freq_mask = (
            (frequencies >= self.SIGH_FREQUENCY_RANGE[0]) &
            (frequencies <= self.SIGH_FREQUENCY_RANGE[1])
        )
        sigh_energy = np.sum(magnitude[freq_mask])
        total_energy = np.sum(magnitude)

        # 3. 신호 지속 시간 계산
        duration = len(audio_data) / sample_rate

        # 4. 한숨 패턴 감지
        detected = False
        intensity = None
        confidence = 0.0

        if (self.SIGH_MIN_DURATION <= duration <= self.SIGH_MAX_DURATION and
            sigh_energy / total_energy > 0.3):

            detected = True
            confidence = min(1.0, (sigh_energy / total_energy) * 2)

            # 강도 분류
            if confidence >= 0.85:
                intensity = SighIntensity.DEEP
            elif confidence >= 0.70:
                intensity = SighIntensity.MODERATE
            else:
                intensity = SighIntensity.LIGHT

        # 5. 오디오 특징 추출
        audio_features = {
            "duration": duration,
            "sigh_energy_ratio": float(sigh_energy / total_energy) if total_energy > 0 else 0,
            "dominant_frequency": float(frequencies[np.argmax(magnitude)]),
            "sample_rate": sample_rate
        }

        result = SighDetectionResult(
            detected=detected,
            intensity=intensity,
            confidence=confidence,
            audio_features=audio_features
        )

        # 6. 감지 이력 업데이트
        if detected and confidence >= self.CONFIDENCE_THRESHOLD:
            self._update_sigh_history(result)
            self._update_stress_level()

        return result

    def _update_sigh_history(self, result: SighDetectionResult):
        """한숨 이력 업데이트"""
        self.sigh_history.append(result)

        # 오래된 이력 제거 (시간 윈도우 밖)
        cutoff_time = datetime.now() - self.STRESS_TIME_WINDOW
        self.sigh_history = [
            r for r in self.sigh_history
            if r.timestamp >= cutoff_time
        ]

    def _update_stress_level(self):
        """스트레스 레벨 업데이트"""
        recent_sighs = len(self.sigh_history)

        # 스트레스 레벨 계산 (0.0 ~ 1.0)
        self.stress_level = min(
            1.0,
            recent_sighs / (self.STRESS_ACCUMULATION_THRESHOLD * 2)
        )

    def should_suggest_break(self) -> bool:
        """
        휴식을 제안해야 하는지 판단

        Returns:
            bool: 휴식 제안 필요 여부
        """
        # 일정 시간 내 한숨 횟수가 임계값 초과
        recent_sighs = len(self.sigh_history)

        if recent_sighs >= self.STRESS_ACCUMULATION_THRESHOLD:
            return True

        # 스트레스 레벨이 높은 경우
        if self.stress_level >= 0.7:
            return True

        # 최근 깊은 한숨이 연속으로 감지된 경우
        if recent_sighs >= 2:
            recent_deep_sighs = [
                r for r in self.sigh_history[-2:]
                if r.intensity == SighIntensity.DEEP
            ]
            if len(recent_deep_sighs) >= 2:
                return True

        return False

    def get_stress_level(self) -> float:
        """
        현재 스트레스 레벨 반환

        Returns:
            float: 스트레스 레벨 (0.0 ~ 1.0)
        """
        return self.stress_level

    def reset_history(self):
        """이력 초기화 (세션 종료 시)"""
        self.sigh_history = []
        self.stress_level = 0.0

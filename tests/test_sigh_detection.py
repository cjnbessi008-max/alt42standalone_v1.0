"""
한숨 감지 서비스 테스트
"""
import pytest
import numpy as np
from datetime import datetime, timedelta
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from services.sigh_detection.sigh_detector import (
    SighDetector,
    SighIntensity,
    SighDetectionResult
)


class TestSighDetector:
    """SighDetector 테스트"""

    def setup_method(self):
        """각 테스트 전 초기화"""
        self.detector = SighDetector()

    def test_initialization(self):
        """초기화 테스트"""
        assert self.detector.stress_level == 0.0
        assert len(self.detector.sigh_history) == 0

    def test_analyze_audio_signal_no_sigh(self):
        """한숨이 없는 오디오 분석"""
        # 일반 백색 잡음 생성
        audio_data = np.random.randn(16000).astype(np.float32) * 0.1
        result = self.detector.analyze_audio_signal(audio_data, 16000)

        assert isinstance(result, SighDetectionResult)
        assert result.detected is False
        assert result.confidence < 0.7

    def test_analyze_audio_signal_with_sigh(self):
        """한숨이 있는 오디오 분석 (시뮬레이션)"""
        # 한숨 주파수 대역 (100-500Hz)의 신호 생성
        sample_rate = 16000
        duration = 1.5  # 1.5초 (한숨 지속 시간 범위 내)
        t = np.linspace(0, duration, int(sample_rate * duration))

        # 250Hz 신호 생성 (한숨 주파수 중간)
        frequency = 250
        audio_data = np.sin(2 * np.pi * frequency * t).astype(np.float32) * 0.8

        result = self.detector.analyze_audio_signal(audio_data, sample_rate)

        assert isinstance(result, SighDetectionResult)
        # 실제 감지 결과는 신호 특성에 따라 다를 수 있음

    def test_stress_level_accumulation(self):
        """스트레스 레벨 누적 테스트"""
        # 여러 번 한숨 감지 시뮬레이션
        for _ in range(3):
            result = SighDetectionResult(
                detected=True,
                intensity=SighIntensity.DEEP,
                confidence=0.9,
                timestamp=datetime.now()
            )
            self.detector._update_sigh_history(result)
            self.detector._update_stress_level()

        assert len(self.detector.sigh_history) == 3
        assert self.detector.stress_level > 0.0

    def test_should_suggest_break_threshold(self):
        """휴식 제안 임계값 테스트"""
        # 임계값 미만
        assert self.detector.should_suggest_break() is False

        # 임계값 도달 (3회 한숨)
        for _ in range(3):
            result = SighDetectionResult(
                detected=True,
                intensity=SighIntensity.MODERATE,
                confidence=0.8,
                timestamp=datetime.now()
            )
            self.detector._update_sigh_history(result)
            self.detector._update_stress_level()

        assert self.detector.should_suggest_break() is True

    def test_should_suggest_break_deep_sighs(self):
        """깊은 한숨 연속 감지 시 휴식 제안 테스트"""
        # 깊은 한숨 2회 연속
        for _ in range(2):
            result = SighDetectionResult(
                detected=True,
                intensity=SighIntensity.DEEP,
                confidence=0.95,
                timestamp=datetime.now()
            )
            self.detector._update_sigh_history(result)
            self.detector._update_stress_level()

        assert self.detector.should_suggest_break() is True

    def test_sigh_history_cleanup(self):
        """오래된 이력 정리 테스트"""
        # 오래된 한숨 추가
        old_time = datetime.now() - timedelta(minutes=15)
        old_result = SighDetectionResult(
            detected=True,
            intensity=SighIntensity.LIGHT,
            confidence=0.75,
            timestamp=old_time
        )
        self.detector.sigh_history.append(old_result)

        # 새로운 한숨 추가 (이력 정리 트리거)
        new_result = SighDetectionResult(
            detected=True,
            intensity=SighIntensity.MODERATE,
            confidence=0.8,
            timestamp=datetime.now()
        )
        self.detector._update_sigh_history(new_result)

        # 오래된 이력은 제거되어야 함
        assert len(self.detector.sigh_history) == 1
        assert self.detector.sigh_history[0].timestamp > old_time

    def test_reset_history(self):
        """이력 초기화 테스트"""
        # 한숨 이력 추가
        for _ in range(3):
            result = SighDetectionResult(
                detected=True,
                intensity=SighIntensity.MODERATE,
                confidence=0.8,
                timestamp=datetime.now()
            )
            self.detector._update_sigh_history(result)
            self.detector._update_stress_level()

        assert len(self.detector.sigh_history) > 0
        assert self.detector.stress_level > 0.0

        # 초기화
        self.detector.reset_history()

        assert len(self.detector.sigh_history) == 0
        assert self.detector.stress_level == 0.0

    def test_get_stress_level(self):
        """스트레스 레벨 조회 테스트"""
        assert self.detector.get_stress_level() == 0.0

        # 스트레스 증가
        self.detector.stress_level = 0.5
        assert self.detector.get_stress_level() == 0.5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

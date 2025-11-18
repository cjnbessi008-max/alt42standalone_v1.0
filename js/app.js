/**
 * Main Application
 * Wavy Integral 앱 메인 스크립트
 */

// 전역 변수
let wavyIntegral;
let lmsConnector;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('Wavy Integral 앱 시작...');

    // WavyIntegral 인스턴스 생성
    wavyIntegral = new WavyIntegral('integralCanvas');

    // LMS Connector 인스턴스 생성
    lmsConnector = new LMSConnector();

    // LMS 자동 연결
    lmsConnector.autoConnect().then(() => {
        // LMS에서 문제 파라미터 가져오기
        const params = lmsConnector.parseProblemParameters();
        wavyIntegral.setBounds(params.lowerBound, params.upperBound);
    });

    // 이벤트 리스너 설정
    setupEventListeners();

    // 초기 애니메이션 시작 (웰컴 효과)
    setTimeout(() => {
        wavyIntegral.startAnimation();
        setTimeout(() => {
            wavyIntegral.stopAnimation();
        }, 2000);
    }, 500);
});

// 이벤트 리스너 설정
function setupEventListeners() {
    // 하한 입력
    const lowerBoundInput = document.getElementById('lowerBound');
    lowerBoundInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            wavyIntegral.setBounds(value, wavyIntegral.upperBound);
        }
    });

    // 상한 입력
    const upperBoundInput = document.getElementById('upperBound');
    upperBoundInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            wavyIntegral.setBounds(wavyIntegral.lowerBound, value);
        }
    });

    // 파동 강도 슬라이더
    const waveIntensitySlider = document.getElementById('waveIntensity');
    const waveValueDisplay = document.getElementById('waveValue');

    waveIntensitySlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        waveValueDisplay.textContent = value;
        wavyIntegral.setWaveIntensity(value / 100);
    });

    // 구간 확장 버튼
    const expandBtn = document.getElementById('expandBtn');
    expandBtn.addEventListener('click', () => {
        const currentLower = wavyIntegral.lowerBound;
        const currentUpper = wavyIntegral.upperBound;

        // 구간을 양쪽으로 확장
        const expansion = 0.5;
        const newLower = Math.max(currentLower - expansion, -1);
        const newUpper = Math.min(currentUpper + expansion, 8);

        // 입력 필드 업데이트
        lowerBoundInput.value = newLower.toFixed(1);
        upperBoundInput.value = newUpper.toFixed(1);

        // 물결치는 확장 애니메이션 실행
        wavyIntegral.expandInterval(newLower, newUpper);

        // 버튼 피드백
        expandBtn.textContent = '확장 중...';
        expandBtn.disabled = true;

        setTimeout(() => {
            expandBtn.textContent = '구간 확장';
            expandBtn.disabled = false;
        }, 3000);
    });

    // 초기화 버튼
    const resetBtn = document.getElementById('resetBtn');
    resetBtn.addEventListener('click', () => {
        // WavyIntegral 초기화
        wavyIntegral.reset();

        // 입력 필드 초기화
        lowerBoundInput.value = 0;
        upperBoundInput.value = 2;
        waveIntensitySlider.value = 50;
        waveValueDisplay.textContent = 50;

        // 버튼 피드백
        resetBtn.textContent = '초기화 완료!';

        setTimeout(() => {
            resetBtn.textContent = '초기화';
        }, 1000);
    });

    // 캔버스 클릭 시 애니메이션 토글
    const canvas = document.getElementById('integralCanvas');
    canvas.addEventListener('click', () => {
        if (wavyIntegral.isAnimating) {
            wavyIntegral.stopAnimation();
        } else {
            wavyIntegral.startAnimation();
        }
    });

    // 키보드 단축키
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'e':
            case 'E':
                // E 키: 확장
                expandBtn.click();
                break;
            case 'r':
            case 'R':
                // R 키: 초기화
                resetBtn.click();
                break;
            case ' ':
                // 스페이스바: 애니메이션 토글
                e.preventDefault();
                canvas.click();
                break;
        }
    });
}

// LMS 답안 제출 함수
function submitIntegralAnswer() {
    const integralValue = wavyIntegral.calculateIntegral();

    const answer = {
        value: integralValue,
        lowerBound: wavyIntegral.lowerBound,
        upperBound: wavyIntegral.upperBound,
        timestamp: new Date().toISOString()
    };

    lmsConnector.submitAnswer(answer);
}

// 윈도우 리사이즈 대응
window.addEventListener('resize', debounce(() => {
    wavyIntegral.render();
}, 250));

// 디바운스 유틸리티 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    wavyIntegral.stopAnimation();
    lmsConnector.disconnect();
});

// 개발자 콘솔 도우미
console.log(`
%c🌊 Wavy Integral App 🌊
%c
사용 가능한 명령어:
- wavyIntegral.startAnimation() : 애니메이션 시작
- wavyIntegral.stopAnimation() : 애니메이션 정지
- wavyIntegral.expandInterval(a, b) : 구간 확장
- wavyIntegral.reset() : 초기화
- submitIntegralAnswer() : LMS에 답안 제출

키보드 단축키:
- E: 구간 확장
- R: 초기화
- 스페이스바: 애니메이션 토글
`,
    'color: #667eea; font-size: 16px; font-weight: bold;',
    'color: #666; font-size: 12px;'
);

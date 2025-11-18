/**
 * Peak Smoke 메인 애플리케이션
 * Moodle API + Peak Detector + Smoke Animator 통합
 */

// 전역 상태
let currentFunction = 'x*x - 4*x + 3';
let currentRange = { min: -2, max: 6 };
let currentPeaks = [];

/**
 * 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌊 Peak Smoke 초기화 중...');

    // localStorage에서 예제 로드 확인
    loadFromLocalStorage();

    // 이벤트 리스너 등록
    setupEventListeners();

    // 초기 그래프 생성
    setTimeout(() => {
        updateVisualization();
    }, 500);
});

/**
 * localStorage에서 예제 로드
 */
function loadFromLocalStorage() {
    const exampleData = localStorage.getItem('peakSmoke_example');
    if (exampleData) {
        try {
            const example = JSON.parse(exampleData);
            console.log('📦 localStorage에서 예제 로드:', example);

            document.getElementById('functionInput').value = example.func;
            document.getElementById('rangeMin').value = example.min;
            document.getElementById('rangeMax').value = example.max;

            // 사용 후 삭제
            localStorage.removeItem('peakSmoke_example');
        } catch (error) {
            console.error('localStorage 파싱 오류:', error);
        }
    }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // Enter 키로 업데이트
    const inputs = ['functionInput', 'rangeMin', 'rangeMax', 'moodleUrl', 'problemId'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    updateVisualization();
                }
            });
        }
    });

    // Moodle 문제 ID 변경 시 자동 로드
    const problemIdInput = document.getElementById('problemId');
    if (problemIdInput) {
        problemIdInput.addEventListener('blur', async () => {
            const problemId = problemIdInput.value.trim();
            if (problemId) {
                await loadProblemFromMoodle(problemId);
            }
        });
    }
}

/**
 * Moodle에서 문제 로드
 */
async function loadProblemFromMoodle(problemId) {
    try {
        console.log('📚 Moodle에서 문제 로드 중...', problemId);

        const moodleUrl = document.getElementById('moodleUrl').value.trim();
        if (moodleUrl) {
            window.moodleAPI.baseUrl = moodleUrl;
        }

        const problemData = await window.moodleAPI.getProblem(problemId);
        const parsedProblem = window.moodleAPI.parseMathProblem(problemData);

        console.log('✅ 문제 로드 완료:', parsedProblem);

        // UI 업데이트
        document.getElementById('functionInput').value = parsedProblem.function;
        document.getElementById('rangeMin').value = parsedProblem.range.min;
        document.getElementById('rangeMax').value = parsedProblem.range.max;

        // 자동으로 시각화 업데이트
        updateVisualization();

    } catch (error) {
        console.error('❌ 문제 로드 실패:', error);
        alert('문제를 로드하는데 실패했습니다. 데모 데이터를 사용합니다.');
    }
}

/**
 * 시각화 업데이트 (메인 함수)
 */
function updateVisualization() {
    try {
        // 입력값 가져오기
        const functionInput = document.getElementById('functionInput').value.trim();
        const minX = parseFloat(document.getElementById('rangeMin').value);
        const maxX = parseFloat(document.getElementById('rangeMax').value);

        if (!functionInput) {
            alert('함수를 입력해주세요.');
            return;
        }

        if (isNaN(minX) || isNaN(maxX) || minX >= maxX) {
            alert('올바른 범위를 입력해주세요.');
            return;
        }

        console.log('🎨 시각화 업데이트:', functionInput, `[${minX}, ${maxX}]`);

        // 전역 상태 업데이트
        currentFunction = functionInput;
        currentRange = { min: minX, max: maxX };

        // 1. 그래프 데이터 생성
        const graphData = window.peakDetector.generateGraphData(
            currentFunction,
            minX,
            maxX,
            500
        );

        console.log('📊 그래프 데이터 생성:', graphData.length, '개 점');

        // 2. 극값 찾기
        currentPeaks = window.peakDetector.findPeaks(
            currentFunction,
            minX,
            maxX,
            0.01
        );

        console.log('🔍 극값 발견:', currentPeaks);

        // 3. 극값 분석
        const analysis = window.peakDetector.analyzePeaks(currentPeaks);
        console.log('📈 분석 결과:', analysis);

        // 4. 스마트폰 화면에 시각화
        if (window.smokeAnimator) {
            window.smokeAnimator.stop();
            window.smokeAnimator.setCoordinateSystem(minX, maxX, 0, 0);
            window.smokeAnimator.start(graphData, currentPeaks);
        }

        // 5. 극값 정보 패널 업데이트
        updatePeakInfoPanel(analysis);

        console.log('✅ 시각화 완료!');

    } catch (error) {
        console.error('❌ 시각화 오류:', error);
        alert('시각화 중 오류가 발생했습니다: ' + error.message);
    }
}

/**
 * 극값 정보 패널 업데이트
 */
function updatePeakInfoPanel(analysis) {
    const peakInfoDiv = document.getElementById('peakInfo');
    if (!peakInfoDiv) return;

    if (analysis.totalPeaks === 0) {
        peakInfoDiv.innerHTML = '<p>극값이 발견되지 않았습니다.</p>';
        return;
    }

    let html = `<div style="padding: 10px;">`;

    // 요약 정보
    html += `
        <div style="margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 5px;">
            <strong style="color: #fff; display: block; margin-bottom: 5px;">📊 요약</strong>
            <div style="font-size: 12px;">
                극대: ${analysis.maxima}개 |
                극소: ${analysis.minima}개
            </div>
        </div>
    `;

    // 전역 극값
    if (analysis.globalMaximum) {
        html += `
            <div class="peak-item maximum">
                <strong>🔴 전역 최대</strong>
                <span>x = ${analysis.globalMaximum.x}, y = ${analysis.globalMaximum.y}</span>
            </div>
        `;
    }

    if (analysis.globalMinimum) {
        html += `
            <div class="peak-item minimum">
                <strong>🔵 전역 최소</strong>
                <span>x = ${analysis.globalMinimum.x}, y = ${analysis.globalMinimum.y}</span>
            </div>
        `;
    }

    // 모든 극값 나열
    html += `<div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2);">`;
    html += `<strong style="color: #fff; display: block; margin-bottom: 10px;">모든 극값</strong>`;

    analysis.peaks.forEach((peak, index) => {
        const typeText = peak.type === 'maximum' ? '극대' : '극소';
        const emoji = peak.type === 'maximum' ? '🔴' : '🔵';

        html += `
            <div class="peak-item ${peak.type}" style="font-size: 11px;">
                <strong>${emoji} ${typeText} #${index + 1}</strong>
                <span>x = ${peak.x.toFixed(3)}, y = ${peak.y.toFixed(3)}</span>
            </div>
        `;
    });

    html += `</div></div>`;

    peakInfoDiv.innerHTML = html;
}

/**
 * 빠른 예제 로드
 */
function loadExample(exampleNumber) {
    const examples = {
        1: {
            func: 'x*x - 4*x + 3',
            min: -2,
            max: 6,
            name: '이차함수'
        },
        2: {
            func: 'x*x*x - 6*x*x + 9*x + 1',
            min: -1,
            max: 5,
            name: '삼차함수'
        },
        3: {
            func: 'Math.sin(x) + Math.cos(x)',
            min: 0,
            max: 2 * Math.PI,
            name: '삼각함수'
        },
        4: {
            func: '-x*x*x*x + 4*x*x*x - 4*x*x + 1',
            min: -2,
            max: 4,
            name: '사차함수'
        }
    };

    const example = examples[exampleNumber];
    if (example) {
        console.log(`📝 예제 로드: ${example.name}`);
        document.getElementById('functionInput').value = example.func;
        document.getElementById('rangeMin').value = example.min;
        document.getElementById('rangeMax').value = example.max;
        updateVisualization();
    }
}

/**
 * 학습 진행도 저장 (Moodle)
 */
async function saveProgress() {
    try {
        const userId = 'demo_user'; // 실제로는 세션에서 가져와야 함
        const problemId = document.getElementById('problemId').value.trim();

        if (!problemId) {
            console.warn('문제 ID가 없어 진행도를 저장할 수 없습니다.');
            return;
        }

        const progressData = {
            function: currentFunction,
            range: currentRange,
            peaksFound: currentPeaks.length,
            timestamp: new Date().toISOString(),
            score: calculateScore(currentPeaks)
        };

        await window.moodleAPI.submitProgress(userId, problemId, progressData);
        console.log('✅ 진행도 저장 완료:', progressData);

    } catch (error) {
        console.error('❌ 진행도 저장 실패:', error);
    }
}

/**
 * 점수 계산 (간단한 예시)
 */
function calculateScore(peaks) {
    // 극값을 정확히 찾았으면 100점
    return Math.min(100, peaks.length * 25);
}

/**
 * 스크린샷 캡처
 */
function captureScreenshot() {
    const canvas = document.getElementById('graphCanvas');
    if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `peak-smoke-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        console.log('📸 스크린샷 저장 완료');
    }
}

// 전역 함수로 노출
window.updateVisualization = updateVisualization;
window.loadExample = loadExample;
window.loadProblemFromMoodle = loadProblemFromMoodle;
window.saveProgress = saveProgress;
window.captureScreenshot = captureScreenshot;

console.log('✅ Peak Smoke 애플리케이션 로드 완료');

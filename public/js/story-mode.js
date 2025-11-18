/**
 * Stat Story Mode - Story Progress Logic
 */

// 현재 단계 로드
async function loadCurrentStep() {
    const stepId = AppState.currentProgress.current_step_id;

    try {
        const response = await axios.get(`${API_BASE_URL}/story_controller.php/step?id=${stepId}`);

        if (response.data.success) {
            const step = response.data.data;
            renderStep(step);
            updateProgress();
        }
    } catch (error) {
        console.error('Error loading step:', error);
        alert('단계를 불러올 수 없습니다.');
    }
}

// 진행 상황 업데이트
function updateProgress() {
    const completedSteps = AppState.currentProgress.completed_steps || [];
    const totalSteps = 10; // 임시로 10단계 가정 (실제로는 API에서 받아와야 함)

    const progressPercent = Math.round((completedSteps.length / totalSteps) * 100);
    document.getElementById('progress-fill').style.width = progressPercent + '%';
    document.getElementById('progress-current').textContent = completedSteps.length;
    document.getElementById('progress-total').textContent = totalSteps;
}

// 단계 렌더링
function renderStep(step) {
    const contentEl = document.getElementById('story-content');
    let html = '';

    switch (step.step_type) {
        case 'dialogue':
            html = renderDialogue(step);
            break;
        case 'explanation':
            html = renderExplanation(step);
            break;
        case 'question':
        case 'practice':
        case 'quiz':
            html = renderQuestion(step);
            break;
        default:
            html = '<p>알 수 없는 단계 유형입니다.</p>';
    }

    contentEl.innerHTML = html;
    updateActionButtons(step);

    // MathJax 렌더링 (수식이 있는 경우)
    if (window.MathJax) {
        MathJax.typesetPromise([contentEl]).catch((err) => console.log(err));
    }
}

// 대화 렌더링
function renderDialogue(step) {
    return `
        <div class="dialogue-box">
            <div class="character-name">${escapeHtml(step.character_name)}</div>
            <div class="dialogue-text">${escapeHtml(step.dialogue_text)}</div>
        </div>
    `;
}

// 설명 렌더링
function renderExplanation(step) {
    return `
        <div class="explanation-box">
            ${step.explanation_content}
        </div>
    `;
}

// 문제 렌더링
function renderQuestion(step) {
    const questionData = step.question_data;
    if (!questionData) {
        return '<p>문제 데이터가 없습니다.</p>';
    }

    let html = `
        <div class="question-box">
            ${step.dialogue_text ? `
                <div class="character-name">${escapeHtml(step.character_name)}</div>
                <p style="margin-bottom: 15px;">${escapeHtml(step.dialogue_text)}</p>
            ` : ''}
            <div class="question-text">${questionData.question_text}</div>
    `;

    switch (questionData.question_type) {
        case 'calculation':
            html += renderCalculationInput(questionData);
            break;
        case 'multiple_choice':
            html += renderMultipleChoice(questionData);
            break;
        case 'text':
            html += renderTextInput(questionData);
            break;
    }

    html += '</div><div id="feedback-container"></div>';

    return html;
}

// 계산 문제 입력
function renderCalculationInput(questionData) {
    return `
        <input type="number"
               class="answer-input"
               id="answer-input"
               placeholder="답을 입력하세요"
               step="0.1">
        ${questionData.unit ? `<p style="color: #666; font-size: 13px; margin-top: 5px;">단위: ${escapeHtml(questionData.unit)}</p>` : ''}
    `;
}

// 객관식 문제
function renderMultipleChoice(questionData) {
    let html = '<div class="choices">';

    questionData.choices.forEach((choice, index) => {
        html += `
            <button class="choice-btn" data-choice="${index}" onclick="selectChoice(${index})">
                ${index + 1}. ${escapeHtml(choice)}
            </button>
        `;
    });

    html += '</div>';
    return html;
}

// 텍스트 입력
function renderTextInput(questionData) {
    return `
        <input type="text"
               class="answer-input"
               id="answer-input"
               placeholder="답을 입력하세요">
    `;
}

// 액션 버튼 업데이트
function updateActionButtons(step) {
    const submitBtn = document.getElementById('submit-btn');
    const nextBtn = document.getElementById('next-btn');
    const hintBtn = document.getElementById('hint-btn');

    // 모두 숨김
    submitBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    hintBtn.style.display = 'none';

    if (step.step_type === 'dialogue' || step.step_type === 'explanation') {
        // 대화나 설명은 다음 버튼만
        nextBtn.style.display = 'block';
        nextBtn.onclick = handleNext;
    } else if (step.step_type === 'question' || step.step_type === 'practice' || step.step_type === 'quiz') {
        // 문제는 제출 버튼과 힌트 버튼
        submitBtn.style.display = 'block';
        submitBtn.onclick = handleSubmit;

        if (step.hint_text || (step.question_data && step.question_data.hint)) {
            hintBtn.style.display = 'block';
            hintBtn.onclick = handleHint;
        }
    }
}

// 선택지 선택 (객관식)
window.selectChoice = function(choiceIndex) {
    // 모든 선택 해제
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    // 선택된 것 표시
    const selectedBtn = document.querySelector(`.choice-btn[data-choice="${choiceIndex}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }

    // 선택값 저장
    window.selectedAnswer = choiceIndex;
};

// 답안 제출
async function handleSubmit() {
    let answer = window.selectedAnswer;

    // 입력 필드가 있으면 그 값을 사용
    const answerInput = document.getElementById('answer-input');
    if (answerInput) {
        const value = answerInput.value.trim();
        if (!value) {
            alert('답을 입력해주세요.');
            return;
        }

        // 숫자형인 경우 파싱
        if (answerInput.type === 'number') {
            answer = parseFloat(value);
        } else {
            answer = value;
        }
    }

    if (answer === undefined || answer === null) {
        alert('답을 선택하거나 입력해주세요.');
        return;
    }

    // 제출 버튼 비활성화
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '제출 중...';

    try {
        const response = await axios.post(`${API_BASE_URL}/story_controller.php/submit_answer`, {
            progress_id: AppState.currentProgress.id,
            step_id: AppState.currentProgress.current_step_id,
            answer: answer,
            time_spent: 0 // 타이머 구현시 실제 값 사용
        });

        if (response.data.success) {
            const result = response.data.data;
            showFeedback(result);

            // 정답이면 다음 버튼 표시
            if (result.is_correct) {
                submitBtn.style.display = 'none';
                document.getElementById('next-btn').style.display = 'block';
                document.getElementById('next-btn').onclick = handleNext;

                // 점수 업데이트
                AppState.currentProgress.score += 10; // 임시
            } else {
                // 오답이면 다시 시도 가능
                if (result.can_retry) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '다시 제출';
                } else {
                    submitBtn.style.display = 'none';
                    document.getElementById('next-btn').style.display = 'block';
                    document.getElementById('next-btn').onclick = handleNext;
                }
            }
        }
    } catch (error) {
        console.error('Error submitting answer:', error);
        alert('답안 제출 중 오류가 발생했습니다.');
        submitBtn.disabled = false;
        submitBtn.textContent = '제출';
    }
}

// 피드백 표시
function showFeedback(result) {
    const feedbackContainer = document.getElementById('feedback-container');
    const isCorrect = result.is_correct;

    let html = `
        <div class="feedback-box ${isCorrect ? 'correct' : 'incorrect'}">
            <h4>${isCorrect ? '✓ 정답입니다!' : '✗ 틀렸습니다.'}</h4>
            ${result.explanation ? `<p>${result.explanation}</p>` : ''}
            ${!isCorrect && result.attempt_number ? `<p>시도 횟수: ${result.attempt_number}/3</p>` : ''}
        </div>
    `;

    feedbackContainer.innerHTML = html;

    // 객관식인 경우 선택지 색상 표시
    if (window.selectedAnswer !== undefined) {
        const selectedBtn = document.querySelector(`.choice-btn[data-choice="${window.selectedAnswer}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add(isCorrect ? 'correct' : 'incorrect');
        }

        // 모든 버튼 비활성화
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.disabled = true;
        });
    }
}

// 다음 단계로
async function handleNext() {
    try {
        const response = await axios.post(`${API_BASE_URL}/story_controller.php/next_step`, {
            progress_id: AppState.currentProgress.id
        });

        if (response.data.success) {
            const result = response.data.data;

            if (result.completed) {
                // 스토리 완료
                showCompletionScreen(result);
            } else {
                // 다음 단계로
                AppState.currentProgress.current_step_id = result.next_step_id;
                AppState.currentProgress.completed_steps = result.completed_steps;
                loadCurrentStep();

                // 피드백 초기화
                const feedbackContainer = document.getElementById('feedback-container');
                if (feedbackContainer) {
                    feedbackContainer.innerHTML = '';
                }
                window.selectedAnswer = undefined;
            }
        }
    } catch (error) {
        console.error('Error moving to next step:', error);
        alert('다음 단계로 이동 중 오류가 발생했습니다.');
    }
}

// 힌트 보기
async function handleHint() {
    try {
        const response = await axios.post(`${API_BASE_URL}/story_controller.php/use_hint`, {
            progress_id: AppState.currentProgress.id,
            step_id: AppState.currentProgress.current_step_id
        });

        if (response.data.success) {
            const hint = response.data.data.hint;
            alert('💡 힌트: ' + hint);
        }
    } catch (error) {
        console.error('Error getting hint:', error);
        alert('힌트를 불러올 수 없습니다.');
    }
}

// 완료 화면 표시
function showCompletionScreen(result) {
    const score = result.final_score || AppState.currentProgress.score;
    const totalQuestions = AppState.currentProgress.completed_steps.length;

    document.getElementById('result-icon').textContent = '🎉';
    document.getElementById('result-title').textContent = '스토리 완료!';
    document.getElementById('result-message').textContent = `${AppState.currentScenario.title}을(를) 완료했습니다!`;
    document.getElementById('final-score').textContent = score + '점';
    document.getElementById('accuracy').textContent = '100%'; // 실제 정답률 계산 필요

    showScreen('result-screen');

    // 배지나 보상 표시 (추가 구현 가능)
}

// 타이머 (선택 사항)
let stepStartTime = null;

function startStepTimer() {
    stepStartTime = Date.now();
}

function getElapsedTime() {
    if (!stepStartTime) return 0;
    return Math.floor((Date.now() - stepStartTime) / 1000);
}

// 단계 로드시 타이머 시작
const originalLoadCurrentStep = loadCurrentStep;
loadCurrentStep = function() {
    startStepTimer();
    return originalLoadCurrentStep.apply(this, arguments);
};

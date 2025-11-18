<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>내 퀴즈 결과 - Answer Reason Tracker</title>
    <link rel="stylesheet" href="../public/css/style.css">
</head>
<body>
    <div class="header">
        <div class="container">
            <h1>📝 내 퀴즈 결과</h1>
            <p>틀린 문제의 이유를 작성하고 학습을 개선하세요</p>
        </div>
    </div>

    <div class="container">
        <!-- Filter Section -->
        <div class="attempt-card">
            <h3>필터</h3>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <label style="display: flex; align-items: center; gap: 5px;">
                    <input type="checkbox" id="incorrectOnly" checked>
                    <span>틀린 문제만 보기</span>
                </label>
                <button class="btn btn-primary" onclick="loadAttempts()">새로고침</button>
            </div>
        </div>

        <!-- Loading Spinner -->
        <div id="loading" class="spinner" style="display: none;"></div>

        <!-- Alert Messages -->
        <div id="alertContainer"></div>

        <!-- Attempts List -->
        <div id="attemptsList"></div>

        <!-- Empty State -->
        <div id="emptyState" class="empty-state" style="display: none;">
            <p>아직 퀴즈 시도가 없습니다.</p>
        </div>
    </div>

    <script>
        const API_BASE_URL = '../api';
        let currentStudentId = 1; // TODO: Replace with actual logged-in student ID

        /**
         * Load quiz attempts
         */
        async function loadAttempts() {
            const incorrectOnly = document.getElementById('incorrectOnly').checked;
            showLoading(true);
            hideAlert();

            try {
                const params = new URLSearchParams({
                    student_id: currentStudentId,
                    incorrect_only: incorrectOnly ? '1' : '0'
                });

                const response = await fetch(`${API_BASE_URL}/attempts?${params}`);
                const data = await response.json();

                if (data.success) {
                    displayAttempts(data.attempts);
                } else {
                    showAlert('데이터를 불러오는데 실패했습니다.', 'error');
                }
            } catch (error) {
                console.error('Error loading attempts:', error);
                showAlert('네트워크 오류가 발생했습니다.', 'error');
            } finally {
                showLoading(false);
            }
        }

        /**
         * Display attempts
         */
        function displayAttempts(attempts) {
            const container = document.getElementById('attemptsList');
            const emptyState = document.getElementById('emptyState');

            if (!attempts || attempts.length === 0) {
                container.innerHTML = '';
                emptyState.style.display = 'block';
                return;
            }

            emptyState.style.display = 'none';

            container.innerHTML = attempts.map(attempt => `
                <div class="attempt-card" id="attempt-${attempt.id}">
                    <div class="attempt-header">
                        <div class="quiz-name">${escapeHtml(attempt.quiz_name)}</div>
                        <span class="attempt-status ${attempt.is_correct ? 'status-correct' : 'status-incorrect'}">
                            ${attempt.is_correct ? '✓ 정답' : '✗ 오답'}
                        </span>
                    </div>

                    <div class="question-text">
                        <strong>문제:</strong> ${escapeHtml(attempt.question_text)}
                    </div>

                    <div class="answer-section">
                        <span class="answer-label">내 답변:</span>
                        <div class="answer-value student-answer">
                            ${escapeHtml(attempt.student_answer || '(답변 없음)')}
                        </div>

                        ${!attempt.is_correct ? `
                            <span class="answer-label">정답:</span>
                            <div class="answer-value correct-answer">
                                ${escapeHtml(attempt.correct_answer)}
                            </div>
                        ` : ''}
                    </div>

                    ${attempt.explanation_text ? `
                        <div class="explanation-box">
                            <h4>💡 해설</h4>
                            <p>${escapeHtml(attempt.explanation_text)}</p>
                        </div>
                    ` : ''}

                    ${!attempt.is_correct && !attempt.reason_id ? `
                        <div class="reason-form">
                            <h3>🤔 이걸 내가 몰랐던 이유</h3>
                            <p style="color: #666; margin-bottom: 15px;">
                                왜 이 문제를 틀렸는지 솔직하게 작성해보세요. (최소 10자 이상)
                            </p>

                            <form id="reasonForm-${attempt.id}" onsubmit="submitReason(event, ${attempt.id})">
                                <div class="form-group">
                                    <label class="form-label">카테고리 선택</label>
                                    <div class="category-select">
                                        <label class="category-option">
                                            <input type="radio" name="category-${attempt.id}" value="conceptual">
                                            <span>개념 이해 부족</span>
                                        </label>
                                        <label class="category-option">
                                            <input type="radio" name="category-${attempt.id}" value="calculation">
                                            <span>계산 실수</span>
                                        </label>
                                        <label class="category-option">
                                            <input type="radio" name="category-${attempt.id}" value="careless">
                                            <span>부주의한 실수</span>
                                        </label>
                                        <label class="category-option">
                                            <input type="radio" name="category-${attempt.id}" value="misread">
                                            <span>문제 오독</span>
                                        </label>
                                        <label class="category-option">
                                            <input type="radio" name="category-${attempt.id}" value="other">
                                            <span>기타</span>
                                        </label>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">상세 이유</label>
                                    <textarea
                                        class="form-control"
                                        id="reasonText-${attempt.id}"
                                        name="reason_text"
                                        placeholder="예시: 분수의 덧셈에서 분모를 통분하는 것을 깜빡했습니다. 다음에는 먼저 분모를 확인하고 통분부터 하겠습니다."
                                        required
                                        minlength="10"
                                        maxlength="2000"
                                        oninput="updateCharCount(${attempt.id})"
                                    ></textarea>
                                    <div class="char-counter" id="charCounter-${attempt.id}">0 / 2000</div>
                                </div>

                                <button type="submit" class="btn btn-primary">
                                    제출하기
                                </button>
                            </form>
                        </div>
                    ` : ''}

                    ${attempt.reason_id ? `
                        <div class="alert alert-success">
                            ✓ 이유 작성 완료! 제출 시간: ${formatDate(attempt.reason_submitted_at)}
                        </div>
                    ` : ''}
                </div>
            `).join('');

            // Add event listeners for category selection
            document.querySelectorAll('.category-option').forEach(option => {
                option.addEventListener('click', function() {
                    const radio = this.querySelector('input[type="radio"]');
                    radio.checked = true;

                    // Remove selected class from siblings
                    this.parentElement.querySelectorAll('.category-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });

                    // Add selected class to this option
                    this.classList.add('selected');
                });
            });
        }

        /**
         * Submit reason
         */
        async function submitReason(event, attemptId) {
            event.preventDefault();

            const form = event.target;
            const reasonText = form.querySelector(`#reasonText-${attemptId}`).value.trim();
            const categoryInput = form.querySelector(`input[name="category-${attemptId}"]:checked`);
            const category = categoryInput ? categoryInput.value : null;

            if (reasonText.length < 10) {
                showAlert('이유는 최소 10자 이상 작성해주세요.', 'error');
                return;
            }

            if (!category) {
                showAlert('카테고리를 선택해주세요.', 'error');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = '제출 중...';

            try {
                const response = await fetch(`${API_BASE_URL}/reasons`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        attempt_id: attemptId,
                        reason_text: reasonText,
                        reason_category: category
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showAlert('이유가 성공적으로 제출되었습니다! 👏', 'success');
                    loadAttempts(); // Reload to show updated state
                } else {
                    showAlert(data.error || '제출에 실패했습니다.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = '제출하기';
                }
            } catch (error) {
                console.error('Error submitting reason:', error);
                showAlert('네트워크 오류가 발생했습니다.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = '제출하기';
            }
        }

        /**
         * Update character count
         */
        function updateCharCount(attemptId) {
            const textarea = document.getElementById(`reasonText-${attemptId}`);
            const counter = document.getElementById(`charCounter-${attemptId}`);
            const length = textarea.value.length;

            counter.textContent = `${length} / 2000`;

            counter.classList.remove('warning', 'danger');
            if (length > 1800) {
                counter.classList.add('danger');
            } else if (length > 1500) {
                counter.classList.add('warning');
            }
        }

        /**
         * Show loading spinner
         */
        function showLoading(show) {
            document.getElementById('loading').style.display = show ? 'block' : 'none';
        }

        /**
         * Show alert message
         */
        function showAlert(message, type = 'info') {
            const container = document.getElementById('alertContainer');
            container.innerHTML = `
                <div class="alert alert-${type}">
                    ${escapeHtml(message)}
                </div>
            `;

            setTimeout(() => {
                container.innerHTML = '';
            }, 5000);
        }

        /**
         * Hide alert
         */
        function hideAlert() {
            document.getElementById('alertContainer').innerHTML = '';
        }

        /**
         * Escape HTML
         */
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * Format date
         */
        function formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleString('ko-KR');
        }

        // Load attempts on page load
        document.addEventListener('DOMContentLoaded', () => {
            loadAttempts();
        });
    </script>
</body>
</html>

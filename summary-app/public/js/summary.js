/**
 * 1문장 핵심 요약 시스템 - 학습자용 JavaScript
 */

const SummaryApp = {
    apiBaseUrl: '../api',
    currentUserId: null,
    currentCourseId: null,
    currentActivityId: null,
    minLength: 10,
    maxLength: 200,

    /**
     * 초기화
     */
    init() {
        // URL 파라미터에서 정보 추출
        const urlParams = new URLSearchParams(window.location.search);
        this.currentUserId = urlParams.get('user_id');
        this.currentCourseId = urlParams.get('course_id');
        this.currentActivityId = urlParams.get('activity_id');

        // 이벤트 리스너 설정
        this.setupEventListeners();

        // 사용자 요약 기록 로드
        if (this.currentUserId) {
            this.loadUserSummaries();
        }
    },

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        const summaryTextarea = document.getElementById('summaryText');
        const submitBtn = document.getElementById('submitBtn');
        const generateFeedbackBtn = document.getElementById('generateFeedbackBtn');

        if (summaryTextarea) {
            summaryTextarea.addEventListener('input', () => this.updateCharCounter());
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitSummary());
        }

        if (generateFeedbackBtn) {
            generateFeedbackBtn.addEventListener('click', () => this.requestFeedback());
        }
    },

    /**
     * 글자 수 카운터 업데이트
     */
    updateCharCounter() {
        const textarea = document.getElementById('summaryText');
        const counter = document.getElementById('charCounter');

        if (!textarea || !counter) return;

        const length = textarea.value.length;
        counter.textContent = `${length} / ${this.maxLength}자`;

        // 색상 변경
        counter.classList.remove('warning', 'danger');
        if (length > this.maxLength * 0.9) {
            counter.classList.add('warning');
        }
        if (length > this.maxLength) {
            counter.classList.add('danger');
        }

        // 제출 버튼 활성화/비활성화
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = length < this.minLength || length > this.maxLength;
        }
    },

    /**
     * 요약 제출
     */
    async submitSummary() {
        const textarea = document.getElementById('summaryText');
        const submitBtn = document.getElementById('submitBtn');

        if (!textarea || !submitBtn) return;

        const summaryText = textarea.value.trim();

        if (summaryText.length < this.minLength) {
            this.showAlert(`최소 ${this.minLength}자 이상 입력해주세요.`, 'error');
            return;
        }

        if (summaryText.length > this.maxLength) {
            this.showAlert(`최대 ${this.maxLength}자를 초과할 수 없습니다.`, 'error');
            return;
        }

        // 버튼 비활성화 및 로딩 표시
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> 저장 중...';

        try {
            const response = await fetch(`${this.apiBaseUrl}/save_summary.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    moodle_user_id: this.currentUserId || 1,
                    moodle_course_id: this.currentCourseId || 101,
                    moodle_activity_id: this.currentActivityId || 1001,
                    activity_type: 'quiz',
                    activity_name: document.getElementById('activityName')?.textContent || '학습 활동',
                    summary_text: summaryText,
                    generate_feedback: document.getElementById('autoFeedback')?.checked || false
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showAlert('요약이 성공적으로 저장되었습니다!', 'success');
                textarea.value = '';
                this.updateCharCounter();

                // AI 피드백이 있으면 표시
                if (data.data.feedback) {
                    this.displayFeedback(data.data.feedback.feedback);
                }

                // 저장된 요약 목록 새로고침
                setTimeout(() => this.loadUserSummaries(), 1000);
            } else {
                this.showAlert(data.message || '저장에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('서버 오류가 발생했습니다.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '제출하기';
        }
    },

    /**
     * AI 피드백 요청
     */
    async requestFeedback() {
        const lastSummaryId = this.getLastSummaryId();

        if (!lastSummaryId) {
            this.showAlert('먼저 요약을 저장해주세요.', 'error');
            return;
        }

        const feedbackBtn = document.getElementById('generateFeedbackBtn');
        feedbackBtn.disabled = true;
        feedbackBtn.innerHTML = '<span class="loading"></span> AI 분석 중...';

        try {
            const response = await fetch(`${this.apiBaseUrl}/generate_feedback.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    summary_id: lastSummaryId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.displayFeedback(data.data.feedback);
            } else {
                this.showAlert(data.message || 'AI 피드백 생성에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('서버 오류가 발생했습니다.', 'error');
        } finally {
            feedbackBtn.disabled = false;
            feedbackBtn.innerHTML = 'AI 피드백 받기';
        }
    },

    /**
     * 피드백 표시
     */
    displayFeedback(feedbackData) {
        const feedbackSection = document.getElementById('feedbackSection');

        if (!feedbackSection) return;

        // 점수 업데이트
        document.getElementById('clarityScore').textContent =
            Math.round(feedbackData.clarity_score * 100);
        document.getElementById('relevanceScore').textContent =
            Math.round(feedbackData.relevance_score * 100);
        document.getElementById('completenessScore').textContent =
            Math.round(feedbackData.completeness_score * 100);
        document.getElementById('overallScore').textContent =
            Math.round(feedbackData.overall_score * 100);

        // 피드백 텍스트 업데이트
        document.getElementById('feedbackMessage').textContent =
            feedbackData.feedback || '잘 작성하셨습니다!';
        document.getElementById('suggestionMessage').textContent =
            feedbackData.suggestions || '';

        // 피드백 섹션 표시
        feedbackSection.classList.add('show');
        feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    /**
     * 사용자 요약 목록 로드
     */
    async loadUserSummaries() {
        if (!this.currentUserId) return;

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/get_summaries.php?user_id=${this.currentUserId}&limit=5`
            );
            const data = await response.json();

            if (data.success && data.data.summaries) {
                this.displayUserSummaries(data.data.summaries);
            }
        } catch (error) {
            console.error('Error loading summaries:', error);
        }
    },

    /**
     * 사용자 요약 목록 표시
     */
    displayUserSummaries(summaries) {
        const container = document.getElementById('previousSummaries');

        if (!container || summaries.length === 0) return;

        container.innerHTML = '<h3>이전 요약</h3>';

        summaries.forEach(summary => {
            const card = document.createElement('div');
            card.className = 'summary-card';
            card.innerHTML = `
                <div class="summary-header">
                    <span class="activity-name">${summary.activity_name}</span>
                    <span class="summary-date">${this.formatDate(summary.created_at)}</span>
                </div>
                <div class="summary-content">${summary.summary_text}</div>
                ${summary.overall_score ? `
                    <span class="badge ${this.getScoreBadge(summary.overall_score)}">
                        AI 점수: ${Math.round(summary.overall_score * 100)}점
                    </span>
                ` : ''}
            `;
            container.appendChild(card);
        });

        container.style.display = 'block';
    },

    /**
     * 점수에 따른 배지 클래스 반환
     */
    getScoreBadge(score) {
        if (score >= 0.85) return 'badge-excellent';
        if (score >= 0.70) return 'badge-good';
        return 'badge-fair';
    },

    /**
     * 날짜 포맷팅
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * 알림 표시
     */
    showAlert(message, type = 'success') {
        let alert = document.getElementById('alert');

        if (!alert) {
            alert = document.createElement('div');
            alert.id = 'alert';
            alert.className = 'alert';
            document.querySelector('.container').prepend(alert);
        }

        alert.className = `alert alert-${type} show`;
        alert.textContent = message;

        setTimeout(() => {
            alert.classList.remove('show');
        }, 5000);
    },

    /**
     * 마지막 요약 ID 가져오기 (임시)
     */
    getLastSummaryId() {
        // 실제로는 localStorage 또는 서버에서 가져와야 함
        return localStorage.getItem('lastSummaryId');
    },

    /**
     * 마지막 요약 ID 저장
     */
    setLastSummaryId(id) {
        localStorage.setItem('lastSummaryId', id);
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    SummaryApp.init();
});

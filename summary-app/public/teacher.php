<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>교사 대시보드 - 1문장 핵심</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <style>
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
        }

        .stat-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
        }

        .stat-value {
            font-size: 36px;
            font-weight: 700;
        }

        .filter-bar {
            background: var(--light-bg);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
        }

        .filter-bar select,
        .filter-bar input {
            padding: 10px 15px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            font-size: 14px;
        }

        .filter-bar button {
            padding: 10px 20px;
        }

        .teacher-comment-form {
            margin-top: 15px;
            padding: 15px;
            background: var(--light-bg);
            border-radius: 6px;
            display: none;
        }

        .teacher-comment-form.show {
            display: block;
        }

        .teacher-comment-form textarea {
            min-height: 80px;
            margin-bottom: 10px;
        }

        .rating-stars {
            display: flex;
            gap: 5px;
            margin-bottom: 10px;
        }

        .rating-stars span {
            font-size: 24px;
            cursor: pointer;
            color: #ddd;
        }

        .rating-stars span.active {
            color: #f39c12;
        }

        .export-btn {
            background: var(--success-color);
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container" style="max-width: 1200px;">
        <h1>📊 교사 대시보드</h1>
        <p class="subtitle">학습자들의 요약 현황을 확인하고 피드백을 제공하세요</p>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">전체 요약</div>
                <div class="stat-value" id="totalSummaries">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">참여 학습자</div>
                <div class="stat-value" id="totalUsers">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">평균 글자 수</div>
                <div class="stat-value" id="avgWordCount">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">평균 AI 점수</div>
                <div class="stat-value" id="avgScore">0</div>
            </div>
        </div>

        <div class="filter-bar">
            <label>
                코스:
                <select id="courseFilter">
                    <option value="">전체</option>
                    <option value="101" selected>수학 101</option>
                    <option value="102">수학 102</option>
                </select>
            </label>

            <label>
                활동:
                <select id="activityFilter">
                    <option value="">전체</option>
                    <option value="1001">분수의 이해 퀴즈</option>
                    <option value="1002">분수의 덧셈</option>
                </select>
            </label>

            <label>
                정렬:
                <select id="sortFilter">
                    <option value="recent">최근 순</option>
                    <option value="score_high">높은 점수 순</option>
                    <option value="score_low">낮은 점수 순</option>
                </select>
            </label>

            <button class="btn btn-primary" onclick="TeacherDashboard.loadSummaries()">
                필터 적용
            </button>

            <button class="export-btn" onclick="TeacherDashboard.exportToCSV()">
                📥 CSV 내보내기
            </button>
        </div>

        <div class="summary-list" id="summaryList">
            <p style="text-align: center; color: var(--text-muted);">
                로딩 중...
            </p>
        </div>
    </div>

    <script>
        const TeacherDashboard = {
            apiBaseUrl: '../api',
            currentCourseId: 101,

            init() {
                this.loadStatistics();
                this.loadSummaries();
            },

            async loadStatistics() {
                try {
                    const response = await fetch(
                        `${this.apiBaseUrl}/get_summaries.php?course_id=${this.currentCourseId}`
                    );
                    const data = await response.json();

                    if (data.success && data.data.statistics) {
                        const stats = data.data.statistics;
                        document.getElementById('totalSummaries').textContent =
                            stats.total_summaries || 0;
                        document.getElementById('totalUsers').textContent =
                            stats.total_users || 0;
                        document.getElementById('avgWordCount').textContent =
                            Math.round(stats.avg_word_count) || 0;

                        // 평균 점수 계산 (요약 목록에서)
                        if (data.data.summaries) {
                            const scores = data.data.summaries
                                .filter(s => s.overall_score)
                                .map(s => s.overall_score);
                            const avgScore = scores.length > 0
                                ? scores.reduce((a, b) => a + b, 0) / scores.length
                                : 0;
                            document.getElementById('avgScore').textContent =
                                Math.round(avgScore * 100);
                        }
                    }
                } catch (error) {
                    console.error('Error loading statistics:', error);
                }
            },

            async loadSummaries() {
                const courseId = document.getElementById('courseFilter').value || this.currentCourseId;
                const summaryList = document.getElementById('summaryList');

                summaryList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">로딩 중...</p>';

                try {
                    const response = await fetch(
                        `${this.apiBaseUrl}/get_summaries.php?course_id=${courseId}&limit=50`
                    );
                    const data = await response.json();

                    if (data.success && data.data.summaries) {
                        this.displaySummaries(data.data.summaries);
                    } else {
                        summaryList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">요약이 없습니다.</p>';
                    }
                } catch (error) {
                    console.error('Error loading summaries:', error);
                    summaryList.innerHTML = '<p style="text-align: center; color: var(--danger-color);">오류가 발생했습니다.</p>';
                }
            },

            displaySummaries(summaries) {
                const summaryList = document.getElementById('summaryList');

                if (summaries.length === 0) {
                    summaryList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">요약이 없습니다.</p>';
                    return;
                }

                summaryList.innerHTML = '';

                summaries.forEach(summary => {
                    const card = document.createElement('div');
                    card.className = 'summary-card';

                    const scoreHtml = summary.overall_score
                        ? `<span class="badge ${this.getScoreBadge(summary.overall_score)}">
                            AI 점수: ${Math.round(summary.overall_score * 100)}점
                           </span>`
                        : '';

                    const teacherRatingHtml = summary.teacher_rating
                        ? `<span class="badge badge-good">교사 평가: ${summary.teacher_rating}/5</span>`
                        : '';

                    card.innerHTML = `
                        <div class="summary-header">
                            <div>
                                <span class="student-name">학습자 #${summary.moodle_user_id}</span>
                                <span style="margin-left: 10px; color: var(--text-muted); font-size: 14px;">
                                    ${summary.activity_name}
                                </span>
                            </div>
                            <span class="summary-date">${this.formatDate(summary.created_at)}</span>
                        </div>

                        <div class="summary-content">${summary.summary_text}</div>

                        <div class="summary-meta">
                            <div class="meta-item">${summary.word_count}자</div>
                            ${scoreHtml}
                            ${teacherRatingHtml}
                        </div>

                        <button class="btn btn-primary"
                                style="font-size: 14px; padding: 8px 16px; margin-top: 10px;"
                                onclick="TeacherDashboard.toggleCommentForm(${summary.id})">
                            💬 댓글 작성
                        </button>

                        <div class="teacher-comment-form" id="commentForm${summary.id}">
                            <div class="rating-stars" id="rating${summary.id}">
                                ${[1,2,3,4,5].map(i =>
                                    `<span onclick="TeacherDashboard.setRating(${summary.id}, ${i})">★</span>`
                                ).join('')}
                            </div>
                            <textarea placeholder="학습자에게 피드백을 작성하세요..." id="comment${summary.id}"></textarea>
                            <button class="btn btn-success"
                                    style="font-size: 14px; padding: 8px 16px;"
                                    onclick="TeacherDashboard.submitComment(${summary.id})">
                                제출
                            </button>
                        </div>
                    `;

                    summaryList.appendChild(card);
                });
            },

            toggleCommentForm(summaryId) {
                const form = document.getElementById(`commentForm${summaryId}`);
                form.classList.toggle('show');
            },

            setRating(summaryId, rating) {
                const stars = document.querySelectorAll(`#rating${summaryId} span`);
                stars.forEach((star, index) => {
                    if (index < rating) {
                        star.classList.add('active');
                    } else {
                        star.classList.remove('active');
                    }
                });
            },

            async submitComment(summaryId) {
                const commentText = document.getElementById(`comment${summaryId}`).value;
                const rating = document.querySelectorAll(`#rating${summaryId} span.active`).length;

                if (!commentText) {
                    alert('댓글을 입력해주세요.');
                    return;
                }

                // 실제로는 API 호출
                console.log('Submitting comment:', { summaryId, commentText, rating });
                alert('댓글이 저장되었습니다!');
                this.toggleCommentForm(summaryId);
            },

            getScoreBadge(score) {
                if (score >= 0.85) return 'badge-excellent';
                if (score >= 0.70) return 'badge-good';
                return 'badge-fair';
            },

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

            exportToCSV() {
                alert('CSV 내보내기 기능은 곧 제공됩니다.');
                // 실제 구현 필요
            }
        };

        document.addEventListener('DOMContentLoaded', () => {
            TeacherDashboard.init();
        });
    </script>
</body>
</html>

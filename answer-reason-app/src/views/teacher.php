<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>교사 대시보드 - Answer Reason Tracker</title>
    <link rel="stylesheet" href="../public/css/style.css">
    <style>
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
        }

        .stat-value {
            font-size: 36px;
            font-weight: bold;
            color: var(--primary-color);
            margin: 10px 0;
        }

        .stat-label {
            color: var(--text-muted);
            font-size: 14px;
        }

        .reason-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 20px;
            margin-bottom: 15px;
            border-left: 4px solid var(--primary-color);
        }

        .reason-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .student-info {
            font-weight: 600;
            color: var(--text-dark);
        }

        .reason-meta {
            font-size: 12px;
            color: var(--text-muted);
        }

        .reason-text {
            background-color: var(--light-gray);
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            line-height: 1.8;
        }

        .category-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
        }

        .category-conceptual {
            background-color: #e3f2fd;
            color: #1976d2;
        }

        .category-calculation {
            background-color: #fff3e0;
            color: #f57c00;
        }

        .category-careless {
            background-color: #fce4ec;
            color: #c2185b;
        }

        .category-misread {
            background-color: #f3e5f5;
            color: #7b1fa2;
        }

        .category-other {
            background-color: #e0e0e0;
            color: #616161;
        }

        .filter-bar {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }

        .filter-row {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
        }

        .filter-group {
            flex: 1;
            min-width: 200px;
        }

        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 2px solid var(--border-color);
        }

        .tab {
            padding: 12px 24px;
            background: none;
            border: none;
            border-bottom: 3px solid transparent;
            cursor: pointer;
            font-weight: 500;
            color: var(--text-muted);
            transition: all 0.3s;
        }

        .tab.active {
            color: var(--primary-color);
            border-bottom-color: var(--primary-color);
        }

        .tab:hover {
            color: var(--primary-color);
        }

        .chart-container {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
        }

        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }

        th {
            background-color: var(--light-gray);
            font-weight: 600;
            color: var(--text-dark);
        }

        tr:hover {
            background-color: var(--light-gray);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="container">
            <h1>📊 교사 대시보드</h1>
            <p>학생들의 오답 이유를 분석하고 학습을 지원하세요</p>
        </div>
    </div>

    <div class="container">
        <!-- Tabs -->
        <div class="tabs">
            <button class="tab active" onclick="switchTab('overview')">개요</button>
            <button class="tab" onclick="switchTab('reasons')">학생 이유 목록</button>
            <button class="tab" onclick="switchTab('analytics')">분석</button>
        </div>

        <!-- Overview Tab -->
        <div id="overviewTab" class="tab-content">
            <div class="dashboard-grid">
                <div class="stat-card">
                    <div class="stat-label">총 제출된 이유</div>
                    <div class="stat-value" id="totalReasons">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">참여 학생 수</div>
                    <div class="stat-value" id="totalStudents">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">평균 작성 글자 수</div>
                    <div class="stat-value" id="avgWordCount">-</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">제출률</div>
                    <div class="stat-value" id="submissionRate">-</div>
                </div>
            </div>

            <div class="chart-container">
                <h3>카테고리별 분포</h3>
                <canvas id="categoryChart"></canvas>
                <div id="categoryStats"></div>
            </div>
        </div>

        <!-- Reasons Tab -->
        <div id="reasonsTab" class="tab-content" style="display: none;">
            <div class="filter-bar">
                <div class="filter-row">
                    <div class="filter-group">
                        <label class="form-label">카테고리 필터</label>
                        <select class="form-control" id="categoryFilter" onchange="loadReasons()">
                            <option value="">전체</option>
                            <option value="conceptual">개념 이해 부족</option>
                            <option value="calculation">계산 실수</option>
                            <option value="careless">부주의한 실수</option>
                            <option value="misread">문제 오독</option>
                            <option value="other">기타</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="form-label">학생 검색</label>
                        <input type="text" class="form-control" id="studentSearch" placeholder="학생 이름 또는 ID">
                    </div>
                    <div class="filter-group" style="display: flex; align-items: flex-end;">
                        <button class="btn btn-primary" onclick="loadReasons()">검색</button>
                    </div>
                </div>
            </div>

            <div id="loading" class="spinner" style="display: none;"></div>
            <div id="reasonsList"></div>
            <div id="emptyState" class="empty-state" style="display: none;">
                <p>표시할 이유가 없습니다.</p>
            </div>
        </div>

        <!-- Analytics Tab -->
        <div id="analyticsTab" class="tab-content" style="display: none;">
            <div class="chart-container">
                <h3>학생별 통계</h3>
                <div id="studentAnalytics"></div>
            </div>
        </div>
    </div>

    <script>
        const API_BASE_URL = '../api';
        let currentTab = 'overview';

        /**
         * Switch tabs
         */
        function switchTab(tabName) {
            currentTab = tabName;

            // Update tab buttons
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');

            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });

            // Show selected tab
            switch(tabName) {
                case 'overview':
                    document.getElementById('overviewTab').style.display = 'block';
                    loadOverview();
                    break;
                case 'reasons':
                    document.getElementById('reasonsTab').style.display = 'block';
                    loadReasons();
                    break;
                case 'analytics':
                    document.getElementById('analyticsTab').style.display = 'block';
                    loadAnalytics();
                    break;
            }
        }

        /**
         * Load overview statistics
         */
        async function loadOverview() {
            try {
                const response = await fetch(`${API_BASE_URL}/reasons`);
                const data = await response.json();

                if (data.success) {
                    const reasons = data.reasons;

                    // Calculate statistics
                    const totalReasons = reasons.length;
                    const uniqueStudents = new Set(reasons.map(r => r.student_id)).size;
                    const avgWordCount = reasons.length > 0
                        ? Math.round(reasons.reduce((sum, r) => sum + (r.word_count || 0), 0) / reasons.length)
                        : 0;

                    // Update stat cards
                    document.getElementById('totalReasons').textContent = totalReasons;
                    document.getElementById('totalStudents').textContent = uniqueStudents;
                    document.getElementById('avgWordCount').textContent = avgWordCount;

                    // Calculate submission rate (need total attempts)
                    const attemptsResponse = await fetch(`${API_BASE_URL}/attempts?incorrect_only=1`);
                    const attemptsData = await attemptsResponse.json();
                    const totalIncorrect = attemptsData.attempts ? attemptsData.attempts.length : 0;
                    const submissionRate = totalIncorrect > 0
                        ? Math.round((totalReasons / totalIncorrect) * 100)
                        : 0;
                    document.getElementById('submissionRate').textContent = submissionRate + '%';

                    // Category distribution
                    displayCategoryDistribution(reasons);
                }
            } catch (error) {
                console.error('Error loading overview:', error);
            }
        }

        /**
         * Display category distribution
         */
        function displayCategoryDistribution(reasons) {
            const categories = {};
            const categoryLabels = {
                'conceptual': '개념 이해 부족',
                'calculation': '계산 실수',
                'careless': '부주의한 실수',
                'misread': '문제 오독',
                'other': '기타'
            };

            reasons.forEach(reason => {
                const cat = reason.reason_category || 'other';
                categories[cat] = (categories[cat] || 0) + 1;
            });

            const container = document.getElementById('categoryStats');
            let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">';

            Object.entries(categories).forEach(([key, count]) => {
                const percentage = Math.round((count / reasons.length) * 100);
                html += `
                    <div style="padding: 15px; background: var(--light-gray); border-radius: 6px;">
                        <div style="font-weight: 600; margin-bottom: 5px;">${categoryLabels[key] || key}</div>
                        <div style="font-size: 24px; color: var(--primary-color);">${count}건</div>
                        <div style="font-size: 14px; color: var(--text-muted);">${percentage}%</div>
                        <div style="background: var(--primary-color); height: 4px; width: ${percentage}%; border-radius: 2px; margin-top: 8px;"></div>
                    </div>
                `;
            });

            html += '</div>';
            container.innerHTML = html;
        }

        /**
         * Load reasons list
         */
        async function loadReasons() {
            const category = document.getElementById('categoryFilter').value;
            const loading = document.getElementById('loading');
            const reasonsList = document.getElementById('reasonsList');
            const emptyState = document.getElementById('emptyState');

            loading.style.display = 'block';
            reasonsList.innerHTML = '';
            emptyState.style.display = 'none';

            try {
                const params = new URLSearchParams();
                if (category) params.append('category', category);

                const response = await fetch(`${API_BASE_URL}/reasons?${params}`);
                const data = await response.json();

                if (data.success) {
                    displayReasons(data.reasons);
                }
            } catch (error) {
                console.error('Error loading reasons:', error);
            } finally {
                loading.style.display = 'none';
            }
        }

        /**
         * Display reasons
         */
        function displayReasons(reasons) {
            const container = document.getElementById('reasonsList');
            const emptyState = document.getElementById('emptyState');

            if (!reasons || reasons.length === 0) {
                emptyState.style.display = 'block';
                return;
            }

            const categoryLabels = {
                'conceptual': '개념 이해 부족',
                'calculation': '계산 실수',
                'careless': '부주의한 실수',
                'misread': '문제 오독',
                'other': '기타'
            };

            container.innerHTML = reasons.map(reason => `
                <div class="reason-card">
                    <div class="reason-header">
                        <div>
                            <span class="student-info">${escapeHtml(reason.full_name)} (${escapeHtml(reason.username)})</span>
                            <span class="category-badge category-${reason.reason_category}">
                                ${categoryLabels[reason.reason_category] || reason.reason_category}
                            </span>
                        </div>
                        <div class="reason-meta">
                            ${formatDate(reason.reason_submitted_at)}
                        </div>
                    </div>

                    <div style="margin-bottom: 10px;">
                        <strong>퀴즈:</strong> ${escapeHtml(reason.quiz_name)}
                    </div>

                    <div style="margin-bottom: 10px; color: var(--text-muted); font-size: 14px;">
                        <strong>문제:</strong> ${escapeHtml(reason.question_text)}
                    </div>

                    <div class="reason-text">
                        ${escapeHtml(reason.reason_text)}
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <div style="font-size: 12px; color: var(--text-muted);">
                            글자 수: ${reason.word_count}
                        </div>
                        <button class="btn btn-secondary" onclick="viewAttemptDetail(${reason.attempt_id})">
                            상세 보기
                        </button>
                    </div>
                </div>
            `).join('');
        }

        /**
         * Load analytics
         */
        async function loadAnalytics() {
            try {
                const response = await fetch(`${API_BASE_URL}/analytics/summary`);
                const data = await response.json();

                if (data.success) {
                    displayStudentAnalytics(data.analytics);
                }
            } catch (error) {
                console.error('Error loading analytics:', error);
            }
        }

        /**
         * Display student analytics
         */
        function displayStudentAnalytics(analytics) {
            const container = document.getElementById('studentAnalytics');

            if (!analytics || analytics.length === 0) {
                container.innerHTML = '<p>분석 데이터가 없습니다.</p>';
                return;
            }

            // Group by student
            const studentMap = {};
            analytics.forEach(item => {
                if (!studentMap[item.student_id]) {
                    studentMap[item.student_id] = {
                        ...item,
                        categories: {}
                    };
                }
                if (item.reason_category) {
                    studentMap[item.student_id].categories[item.reason_category] = {
                        conceptual: item.conceptual_count,
                        calculation: item.calculation_count,
                        careless: item.careless_count,
                        misread: item.misread_count
                    };
                }
            });

            let html = '<table><thead><tr>';
            html += '<th>학생</th>';
            html += '<th>총 시도</th>';
            html += '<th>제출된 이유</th>';
            html += '<th>제출률</th>';
            html += '<th>평균 글자 수</th>';
            html += '<th>주요 카테고리</th>';
            html += '</tr></thead><tbody>';

            Object.values(studentMap).forEach(student => {
                html += '<tr>';
                html += `<td><strong>${escapeHtml(student.full_name)}</strong><br><small>${escapeHtml(student.username)}</small></td>`;
                html += `<td>${student.total_attempts || 0}</td>`;
                html += `<td>${student.reasons_submitted || 0}</td>`;
                html += `<td>${student.submission_rate || 0}%</td>`;
                html += `<td>${Math.round(student.avg_word_count || 0)}</td>`;
                html += `<td>${getMostFrequentCategory(student.categories)}</td>`;
                html += '</tr>';
            });

            html += '</tbody></table>';
            container.innerHTML = html;
        }

        /**
         * Get most frequent category
         */
        function getMostFrequentCategory(categories) {
            if (!categories || Object.keys(categories).length === 0) {
                return '-';
            }

            const labels = {
                'conceptual': '개념',
                'calculation': '계산',
                'careless': '부주의',
                'misread': '오독'
            };

            let maxCount = 0;
            let maxCategory = '';

            Object.entries(categories).forEach(([cat, counts]) => {
                Object.entries(counts).forEach(([type, count]) => {
                    if (count > maxCount) {
                        maxCount = count;
                        maxCategory = type;
                    }
                });
            });

            return labels[maxCategory] || maxCategory;
        }

        /**
         * View attempt detail
         */
        function viewAttemptDetail(attemptId) {
            // TODO: Implement detail view
            alert(`상세 보기 기능은 추후 구현 예정입니다. (Attempt ID: ${attemptId})`);
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

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', () => {
            loadOverview();
        });
    </script>
</body>
</html>

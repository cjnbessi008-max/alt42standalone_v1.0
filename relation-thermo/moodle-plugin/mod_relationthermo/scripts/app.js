/**
 * Relation Thermo - Main Application JavaScript
 * 집합 관계 온도계 시각화 앱
 */

(function() {
    'use strict';

    var app = {
        config: null,
        problems: [],
        currentProblemIndex: 0,
        selectedRelation: null,
        confidenceLevel: 50,
        startTime: null,
        responses: []
    };

    /**
     * 초기화
     */
    function init() {
        app.config = window.RelationThermoConfig;
        loadProblems();
    }

    /**
     * 문제 불러오기
     */
    function loadProblems() {
        var url = app.config.apiEndpoint +
                  '?action=get_problems' +
                  '&activity_id=' + app.config.activityId;

        fetch(url)
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data.success) {
                    app.problems = data.data;
                    showProblem(0);
                } else {
                    showError('문제를 불러올 수 없습니다: ' + data.error);
                }
            })
            .catch(function(error) {
                showError('네트워크 오류: ' + error.message);
            });
    }

    /**
     * 문제 표시
     */
    function showProblem(index) {
        if (index >= app.problems.length) {
            showResults();
            return;
        }

        app.currentProblemIndex = index;
        app.selectedRelation = null;
        app.confidenceLevel = 50;
        app.startTime = Date.now();

        var problem = app.problems[index];
        var html = '';

        // 진행 상황
        html += '<div class="progress-bar">';
        html += '<div class="progress-fill" style="width: ' +
                ((index / app.problems.length) * 100) + '%"></div>';
        html += '</div>';
        html += '<div class="progress-text">' + (index + 1) + ' / ' +
                app.problems.length + '</div>';

        // 문제 카드
        html += '<div class="problem-card">';
        html += '<div class="problem-title">' + escapeHtml(problem.title) + '</div>';
        html += '<div class="problem-description">' +
                escapeHtml(problem.description) + '</div>';

        // 집합 표시
        html += '<div class="sets-display">';
        html += '<div class="set-box">';
        html += '<div class="set-label">집합 A</div>';
        html += '<div class="set-elements">{' + problem.set_a.join(', ') + '}</div>';
        html += '</div>';
        html += '<div class="set-box">';
        html += '<div class="set-label">집합 B</div>';
        html += '<div class="set-elements">{' + problem.set_b.join(', ') + '}</div>';
        html += '</div>';
        html += '</div>';

        // 온도계
        if (app.config.showThermometer) {
            html += '<div class="thermometer-container">';
            html += '<div class="thermometer-label">확신도를 선택하세요</div>';
            html += '<div class="thermometer">';
            html += '<div class="thermometer-fill" id="thermo-fill"></div>';
            html += '<div class="thermometer-bulb"></div>';
            html += '<div class="thermometer-value" id="thermo-value">50%</div>';
            html += '<div class="thermometer-scale">';
            html += '<span class="scale-mark">100</span>';
            html += '<span class="scale-mark">75</span>';
            html += '<span class="scale-mark">50</span>';
            html += '<span class="scale-mark">25</span>';
            html += '<span class="scale-mark">0</span>';
            html += '</div>';
            html += '</div>';
            html += '<div class="confidence-slider">';
            html += '<input type="range" class="slider-input" id="confidence-slider" ' +
                    'min="0" max="100" value="50">';
            html += '</div>';
            html += '</div>';
        }

        // 관계 선택 버튼
        html += '<div class="relation-buttons">';
        var relations = [
            {value: 'subset', label: '부분집합 (A ⊆ B)'},
            {value: 'superset', label: '초집합 (A ⊇ B)'},
            {value: 'equal', label: '같음 (A = B)'},
            {value: 'disjoint', label: '서로소 (A ∩ B = ∅)'},
            {value: 'intersect', label: '교집합 존재 (A ∩ B ≠ ∅)'}
        ];

        relations.forEach(function(rel) {
            html += '<button class="relation-btn" data-relation="' + rel.value + '">' +
                    rel.label + '</button>';
        });
        html += '</div>';

        // 제출 버튼
        html += '<button class="submit-btn" id="submit-btn" disabled>제출</button>';
        html += '</div>';

        document.getElementById('app-content').innerHTML = html;

        // 이벤트 리스너 등록
        attachEventListeners();
    }

    /**
     * 이벤트 리스너 등록
     */
    function attachEventListeners() {
        // 관계 선택 버튼
        var relationBtns = document.querySelectorAll('.relation-btn');
        relationBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                relationBtns.forEach(function(b) { b.classList.remove('selected'); });
                this.classList.add('selected');
                app.selectedRelation = this.getAttribute('data-relation');
                updateSubmitButton();
            });
        });

        // 확신도 슬라이더
        var slider = document.getElementById('confidence-slider');
        if (slider) {
            slider.addEventListener('input', function() {
                app.confidenceLevel = parseInt(this.value);
                updateThermometer();
            });
        }

        // 제출 버튼
        document.getElementById('submit-btn').addEventListener('click', submitResponse);
    }

    /**
     * 온도계 업데이트
     */
    function updateThermometer() {
        var fill = document.getElementById('thermo-fill');
        var value = document.getElementById('thermo-value');

        if (fill && value) {
            fill.style.height = app.confidenceLevel + '%';
            value.textContent = app.confidenceLevel + '%';
        }
    }

    /**
     * 제출 버튼 상태 업데이트
     */
    function updateSubmitButton() {
        var btn = document.getElementById('submit-btn');
        if (btn) {
            btn.disabled = !app.selectedRelation;
        }
    }

    /**
     * 응답 제출
     */
    function submitResponse() {
        if (!app.selectedRelation) return;

        var problem = app.problems[app.currentProblemIndex];
        var timeSpent = Math.floor((Date.now() - app.startTime) / 1000);

        var url = app.config.apiEndpoint +
                  '?action=submit_response' +
                  '&activity_id=' + app.config.activityId +
                  '&problem_id=' + problem.id +
                  '&selected_relation=' + app.selectedRelation +
                  '&confidence_level=' + app.confidenceLevel +
                  '&time_spent=' + timeSpent;

        fetch(url)
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data.success) {
                    app.responses.push(data.data);
                    showFeedback(data.data);
                } else {
                    showError('제출 중 오류가 발생했습니다: ' + data.error);
                }
            })
            .catch(function(error) {
                showError('네트워크 오류: ' + error.message);
            });
    }

    /**
     * 피드백 표시
     */
    function showFeedback(result) {
        var html = '<div class="result-card ' +
                   (result.is_correct ? 'correct' : 'incorrect') + '">';
        html += '<div class="result-icon">' +
                (result.is_correct ? '✓' : '✗') + '</div>';
        html += '<div class="result-message">' +
                (result.is_correct ? '정답입니다!' : '오답입니다') + '</div>';

        if (!result.is_correct) {
            html += '<div class="result-details">정답: ' +
                    getRelationLabel(result.correct_answer) + '</div>';
        }

        html += '<button class="submit-btn" style="margin-top: 20px" id="next-btn">' +
                '다음 문제</button>';
        html += '</div>';

        document.getElementById('app-content').innerHTML += html;

        document.getElementById('next-btn').addEventListener('click', function() {
            showProblem(app.currentProblemIndex + 1);
        });
    }

    /**
     * 최종 결과 표시
     */
    function showResults() {
        var correct = app.responses.filter(function(r) { return r.is_correct; }).length;
        var total = app.responses.length;
        var accuracy = Math.round((correct / total) * 100);

        var html = '<div class="problem-card" style="text-align: center;">';
        html += '<h2>학습 완료!</h2>';
        html += '<div style="font-size: 48px; margin: 20px 0;">' + accuracy + '%</div>';
        html += '<div style="font-size: 18px; margin-bottom: 20px;">';
        html += '정답률: ' + correct + ' / ' + total;
        html += '</div>';

        // 온도계로 결과 표시
        html += '<div class="thermometer-container">';
        html += '<div class="thermometer">';
        html += '<div class="thermometer-fill" style="height: ' + accuracy + '%"></div>';
        html += '<div class="thermometer-bulb"></div>';
        html += '<div class="thermometer-value">' + accuracy + '%</div>';
        html += '</div>';
        html += '</div>';

        html += '<button class="submit-btn" onclick="location.reload()">다시 시작</button>';
        html += '</div>';

        document.getElementById('app-content').innerHTML = html;
    }

    /**
     * 오류 표시
     */
    function showError(message) {
        var html = '<div class="result-card incorrect">';
        html += '<div class="result-icon">!</div>';
        html += '<div class="result-message">오류</div>';
        html += '<div class="result-details">' + escapeHtml(message) + '</div>';
        html += '</div>';
        document.getElementById('app-content').innerHTML = html;
    }

    /**
     * 관계 레이블 가져오기
     */
    function getRelationLabel(relation) {
        var labels = {
            'subset': '부분집합 (A ⊆ B)',
            'superset': '초집합 (A ⊇ B)',
            'equal': '같음 (A = B)',
            'disjoint': '서로소 (A ∩ B = ∅)',
            'intersect': '교집합 존재 (A ∩ B ≠ ∅)'
        };
        return labels[relation] || relation;
    }

    /**
     * HTML 이스케이프
     */
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // DOM 로드 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

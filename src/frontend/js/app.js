/**
 * 메인 애플리케이션 로직
 */

let graphViz;
let currentFilters = {};

/**
 * 앱 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
    // 그래프 시각화 초기화
    graphViz = new GraphVisualization('graph');

    // 이벤트 리스너 등록
    setupEventListeners();

    // 초기 데이터 로드
    loadInitialData();
});

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // Moodle 동기화 버튼
    document.getElementById('syncBtn').addEventListener('click', async () => {
        if (confirm('Moodle LMS에서 데이터를 동기화하시겠습니까?')) {
            try {
                showLoading(true);
                await API.sync.all();
                showToast('Moodle 동기화가 완료되었습니다.', 'success');
                await loadInitialData();
            } catch (error) {
                showToast('동기화 중 오류가 발생했습니다.', 'error');
            } finally {
                showLoading(false);
            }
        }
    });

    // 필터 변경
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        if (e.target.value) {
            currentFilters.category = e.target.value;
        } else {
            delete currentFilters.category;
        }
        graphViz.loadAndRender(currentFilters);
    });

    document.getElementById('difficultyFilter').addEventListener('change', (e) => {
        if (e.target.value) {
            currentFilters.difficulty_level = e.target.value;
        } else {
            delete currentFilters.difficulty_level;
        }
        graphViz.loadAndRender(currentFilters);
    });

    // 레이아웃 변경
    document.getElementById('layoutBtn').addEventListener('click', () => {
        if (graphViz.simulation) {
            graphViz.simulation.alpha(1).restart();
            showToast('레이아웃을 재정렬합니다.', 'info');
        }
    });

    // 초기화 버튼
    document.getElementById('resetBtn').addEventListener('click', () => {
        graphViz.reset();
        currentFilters = {};
        document.getElementById('categoryFilter').value = '';
        document.getElementById('difficultyFilter').value = '';
        loadInitialData();
    });

    // 학생 진도 불러오기
    document.getElementById('loadProgressBtn').addEventListener('click', async () => {
        const studentId = document.getElementById('studentIdInput').value;
        if (!studentId) {
            showToast('학생 ID를 입력해주세요.', 'error');
            return;
        }

        try {
            const response = await API.progress.get(studentId);
            displayStudentProgress(response.data);
            showToast('학생 진도를 불러왔습니다.', 'success');
        } catch (error) {
            showToast('진도 조회 중 오류가 발생했습니다.', 'error');
        }
    });

    // 윈도우 리사이즈
    window.addEventListener('resize', () => {
        if (graphViz) {
            graphViz.width = document.getElementById('graph-container').clientWidth;
            graphViz.height = document.getElementById('graph-container').clientHeight;
            graphViz.svg
                .attr('width', graphViz.width)
                .attr('height', graphViz.height);
            graphViz.fitToView();
        }
    });
}

/**
 * 초기 데이터 로드
 */
async function loadInitialData() {
    try {
        await graphViz.loadAndRender(currentFilters);
    } catch (error) {
        console.error('Initial data loading error:', error);

        // 샘플 데이터로 대체 (개발/테스트용)
        if (confirm('데이터를 불러올 수 없습니다. 샘플 데이터를 사용하시겠습니까?')) {
            loadSampleData();
        }
    }
}

/**
 * 샘플 데이터 로드 (개발/테스트용)
 */
function loadSampleData() {
    const sampleData = {
        nodes: {
            concepts: [
                {
                    id: 1,
                    name: '분수의 개념',
                    description: '분수의 기본 개념과 표현',
                    category: '수학-분수',
                    difficulty_level: 'beginner'
                },
                {
                    id: 2,
                    name: '분수의 덧셈',
                    description: '분수 덧셈 방법',
                    category: '수학-분수',
                    difficulty_level: 'intermediate'
                },
                {
                    id: 3,
                    name: '통분',
                    description: '분모를 같게 만들기',
                    category: '수학-분수',
                    difficulty_level: 'intermediate'
                }
            ],
            problems: [
                {
                    id: 1,
                    title: '분수 기본 문제 1',
                    description: '1/2은 무엇을 의미하나요?',
                    problem_type: 'multiple_choice',
                    difficulty_level: 'easy',
                    points: 10
                },
                {
                    id: 2,
                    title: '분수 덧셈 문제 1',
                    description: '1/4 + 2/4 = ?',
                    problem_type: 'calculation',
                    difficulty_level: 'medium',
                    points: 15
                },
                {
                    id: 3,
                    title: '통분 문제 1',
                    description: '1/2와 1/3을 통분하세요',
                    problem_type: 'calculation',
                    difficulty_level: 'hard',
                    points: 20
                }
            ]
        },
        edges: [
            {
                concept_id: 1,
                problem_id: 1,
                relevance_score: 1.00,
                is_primary: 1,
                mapping_type: 'direct'
            },
            {
                concept_id: 2,
                problem_id: 2,
                relevance_score: 1.00,
                is_primary: 1,
                mapping_type: 'direct'
            },
            {
                concept_id: 3,
                problem_id: 3,
                relevance_score: 1.00,
                is_primary: 1,
                mapping_type: 'direct'
            },
            {
                concept_id: 1,
                problem_id: 2,
                relevance_score: 0.80,
                is_primary: 0,
                mapping_type: 'prerequisite'
            }
        ],
        statistics: {
            total_concepts: 3,
            total_problems: 3,
            total_mappings: 4
        }
    };

    graphViz.renderGraph(sampleData);
    graphViz.updateStatistics(sampleData.statistics);
    showToast('샘플 데이터를 불러왔습니다.', 'info');
}

/**
 * 학생 진도 표시
 */
function displayStudentProgress(data) {
    const panel = document.getElementById('studentPanel');
    const chartDiv = document.getElementById('progressChart');

    panel.style.display = 'block';

    if (!data.statistics || data.statistics.length === 0) {
        chartDiv.innerHTML = '<p>진도 데이터가 없습니다.</p>';
        return;
    }

    let html = '<div class="progress-summary">';
    html += '<h3>개념별 성취도</h3>';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tr style="background: #f0f0f0;"><th>개념</th><th>시도한 문제</th><th>마스터</th><th>평균 점수</th></tr>';

    data.statistics.forEach(stat => {
        const masteryRate = stat.problems_attempted > 0
            ? ((stat.problems_mastered / stat.problems_attempted) * 100).toFixed(1)
            : 0;

        html += `
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 10px;">${stat.concept_name}</td>
                <td style="padding: 10px; text-align: center;">${stat.problems_attempted || 0}</td>
                <td style="padding: 10px; text-align: center;">${stat.problems_mastered || 0} (${masteryRate}%)</td>
                <td style="padding: 10px; text-align: center;">${stat.average_score ? stat.average_score.toFixed(1) : 'N/A'}</td>
            </tr>
        `;
    });

    html += '</table></div>';
    chartDiv.innerHTML = html;
}

/**
 * 키보드 단축키
 */
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + R: 새로고침
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        loadInitialData();
    }

    // Escape: 선택 해제
    if (e.key === 'Escape') {
        if (graphViz.selectedNode) {
            document.querySelectorAll('.node circle').forEach(circle => {
                circle.classList.remove('selected');
            });
            graphViz.selectedNode = null;
            document.getElementById('nodeDetails').innerHTML = '<p class="placeholder">노드를 클릭하여 상세 정보를 확인하세요.</p>';
        }
    }
});

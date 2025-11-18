/**
 * AI Personalized Learning System - Frontend Application
 */

// Configuration
const API_BASE_URL = 'http://localhost/api/endpoints';

// Global State
let currentStudent = null;
let currentProblem = null;
let problemStartTime = null;
let behaviorTracking = {
    visualToolClicks: 0,
    stepByStepViews: 0,
    interactiveManipulations: 0,
    hintRequested: false,
    hintTypeUsed: 'none'
};

// Initialize App
$(document).ready(function() {
    loadStudents();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Navigation
    $('#navStudents').click(function(e) {
        e.preventDefault();
        showPage('studentSelectionPage');
    });

    $('#navProblems').click(function(e) {
        e.preventDefault();
        if (currentStudent) {
            showPage('dashboardPage');
        } else {
            alert('먼저 학생을 선택하세요.');
        }
    });

    // Dashboard
    $('#startLearningBtn').click(function() {
        loadNextProblem();
    });

    // Problem Solving
    $('#submitAnswerBtn').click(function() {
        submitAnswer();
    });

    $('#skipProblemBtn').click(function() {
        loadNextProblem();
    });

    $('#backToDashboardBtn').click(function() {
        showPage('dashboardPage');
        loadStudentDashboard(currentStudent.id);
    });

    // Hint Buttons
    $('#visualHintBtn').click(function() {
        showHint('visual');
    });

    $('#analyticalHintBtn').click(function() {
        showHint('analytical');
    });

    $('#experimentalHintBtn').click(function() {
        showHint('experimental');
    });
}

// Page Navigation
function showPage(pageId) {
    $('.page').hide();
    $('#' + pageId).fadeIn();
}

// Load Students
function loadStudents() {
    $.ajax({
        url: `${API_BASE_URL}/students.php`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayStudents(response.data.students);
            }
        },
        error: function(xhr, status, error) {
            console.error('Failed to load students:', error);
            alert('학생 목록을 불러오는데 실패했습니다.');
        }
    });
}

// Display Students
function displayStudents(students) {
    const studentList = $('#studentList');
    studentList.empty();

    students.forEach(function(student) {
        const patternIcon = getPatternIcon(student.dominant_pattern);
        const patternColor = getPatternColor(student.dominant_pattern);

        const studentCard = `
            <div class="col-md-4 mb-3">
                <div class="card student-card" onclick="selectStudent(${student.id})">
                    <div class="card-body">
                        <i class="fas fa-user-circle"></i>
                        <h5 class="mt-2">${student.name}</h5>
                        <p class="text-muted mb-1">학번: ${student.student_code}</p>
                        <p class="text-muted mb-2">학년: ${student.grade_level}</p>
                        ${student.dominant_pattern ? `
                            <span class="badge ${patternColor}">
                                <i class="${patternIcon}"></i> ${getPatternName(student.dominant_pattern)}
                            </span>
                            <p class="small mt-2 mb-0">정답률: ${student.accuracy_rate || 0}%</p>
                        ` : '<p class="small text-muted">학습 패턴 분석 전</p>'}
                    </div>
                </div>
            </div>
        `;

        studentList.append(studentCard);
    });
}

// Select Student
function selectStudent(studentId) {
    $.ajax({
        url: `${API_BASE_URL}/students.php/${studentId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                currentStudent = response.data;
                $('#currentStudent').text(currentStudent.name);
                loadStudentDashboard(studentId);
                showPage('dashboardPage');
            }
        },
        error: function(xhr, status, error) {
            console.error('Failed to load student:', error);
            alert('학생 정보를 불러오는데 실패했습니다.');
        }
    });
}

// Load Student Dashboard
function loadStudentDashboard(studentId) {
    // Load pattern
    $.ajax({
        url: `${API_BASE_URL}/students.php/${studentId}/pattern`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayLearningPattern(response.data.pattern);
            }
        }
    });

    // Load progress
    $.ajax({
        url: `${API_BASE_URL}/students.php/${studentId}/progress`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                displayProgress(response.data.progress);
            }
        }
    });
}

// Display Learning Pattern
function displayLearningPattern(pattern) {
    // Update scores
    $('#visualScore').text(Math.round(pattern.visual_score) + '%');
    $('#analyticalScore').text(Math.round(pattern.analytical_score) + '%');
    $('#experimentalScore').text(Math.round(pattern.experimental_score) + '%');

    // Update progress bars
    $('#visualProgress').css('width', pattern.visual_score + '%').text(Math.round(pattern.visual_score) + '%');
    $('#analyticalProgress').css('width', pattern.analytical_score + '%').text(Math.round(pattern.analytical_score) + '%');
    $('#experimentalProgress').css('width', pattern.experimental_score + '%').text(Math.round(pattern.experimental_score) + '%');

    // Update dominant pattern
    const patternName = getPatternName(pattern.dominant_pattern);
    const patternColor = getPatternColor(pattern.dominant_pattern);
    $('#dominantPattern').text(patternName).removeClass().addClass('badge badge-xl ' + patternColor);
    $('#confidenceLevel').text(Math.round(pattern.confidence_level) + '%');
}

// Display Progress
function displayProgress(progress) {
    $('#totalAttempts').text(progress.total_attempts || 0);
    $('#correctAttempts').text(progress.correct_attempts || 0);
    $('#accuracyRate').text(Math.round(progress.accuracy_rate || 0) + '%');
    $('#avgTime').text(Math.round(progress.avg_time || 0) + '초');
}

// Load Next Problem
function loadNextProblem() {
    if (!currentStudent) {
        alert('먼저 학생을 선택하세요.');
        return;
    }

    // Reset behavior tracking
    behaviorTracking = {
        visualToolClicks: 0,
        stepByStepViews: 0,
        interactiveManipulations: 0,
        hintRequested: false,
        hintTypeUsed: 'none'
    };

    $.ajax({
        url: `${API_BASE_URL}/recommendations.php/${currentStudent.id}/next`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                currentProblem = response.data.problem;
                displayProblem(currentProblem);
                problemStartTime = new Date();
                showPage('problemPage');
                $('#feedbackDisplay').hide();
                $('#hintDisplay').hide();
            }
        },
        error: function(xhr, status, error) {
            // No recommendations, generate new ones
            generateRecommendations();
        }
    });
}

// Generate Recommendations
function generateRecommendations() {
    $.ajax({
        url: `${API_BASE_URL}/recommendations.php/${currentStudent.id}/generate`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ count: 10 }),
        success: function(response) {
            if (response.success) {
                loadNextProblem();
            }
        },
        error: function(xhr, status, error) {
            console.error('Failed to generate recommendations:', error);
            alert('문제 추천을 생성하는데 실패했습니다.');
        }
    });
}

// Display Problem
function displayProblem(problem) {
    $('#problemText').text(problem.problem_text || '문제');
    $('#difficultyBadge').text('난이도 ' + problem.difficulty_level);
    $('#problemTypeBadge').text(getProblemTypeName(problem.problem_type));

    // Clear inputs
    $('#answerNumerator').val('');
    $('#answerDenominator').val('');

    // Display visual representation
    displayVisual(problem);
}

// Display Visual Representation
function displayVisual(problem) {
    const visualDisplay = $('#visualDisplay');
    visualDisplay.empty();

    if (problem.visual_type === 'bar') {
        const bar = createFractionBar(problem.numerator_1, problem.denominator_1);
        visualDisplay.append(bar);
    } else if (problem.visual_type === 'circle' || problem.visual_type === 'pizza' || problem.visual_type === 'cake') {
        const circle = createFractionCircle(problem.numerator_1, problem.denominator_1);
        visualDisplay.append(circle);
    }
}

// Create Fraction Bar
function createFractionBar(numerator, denominator) {
    const bar = $('<div class="fraction-bar"></div>');

    for (let i = 0; i < denominator; i++) {
        const segment = $('<div class="fraction-segment"></div>');
        segment.addClass(i < numerator ? 'filled' : 'empty');
        segment.click(function() {
            $(this).toggleClass('filled empty');
            behaviorTracking.interactiveManipulations++;
        });
        bar.append(segment);
    }

    return bar;
}

// Create Fraction Circle
function createFractionCircle(numerator, denominator) {
    const percentage = (numerator / denominator) * 100;
    const angle = (numerator / denominator) * 360;

    const circle = $('<div class="fraction-circle"></div>');
    circle.css('--fill-angle', angle + 'deg');
    circle.click(function() {
        behaviorTracking.visualToolClicks++;
    });

    const label = $('<p class="text-center mt-2"></p>').text(`${numerator}/${denominator} = ${percentage.toFixed(1)}%`);

    return $('<div></div>').append(circle).append(label);
}

// Show Hint
function showHint(type) {
    behaviorTracking.hintRequested = true;
    behaviorTracking.hintTypeUsed = type;

    if (type === 'visual') {
        behaviorTracking.visualToolClicks++;
    } else if (type === 'analytical') {
        behaviorTracking.stepByStepViews++;
    } else if (type === 'experimental') {
        behaviorTracking.interactiveManipulations++;
    }

    $.ajax({
        url: `${API_BASE_URL}/problems.php/${currentProblem.id}/hint?pattern=${type}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                $('#hintDisplay').html(`<strong>${getPatternName(type)} 힌트:</strong> ${response.data.hint}`).fadeIn();
            }
        }
    });
}

// Submit Answer
function submitAnswer() {
    const numerator = parseInt($('#answerNumerator').val());
    const denominator = parseInt($('#answerDenominator').val());

    if (!numerator || !denominator) {
        alert('분자와 분모를 모두 입력해주세요.');
        return;
    }

    if (denominator === 0) {
        alert('분모는 0이 될 수 없습니다.');
        return;
    }

    const timeSpent = Math.round((new Date() - problemStartTime) / 1000);

    const submitData = {
        student_id: currentStudent.id,
        answer_numerator: numerator,
        answer_denominator: denominator,
        time_spent_seconds: timeSpent,
        hint_requested: behaviorTracking.hintRequested,
        hint_type_used: behaviorTracking.hintTypeUsed,
        visual_tool_clicks: behaviorTracking.visualToolClicks,
        step_by_step_views: behaviorTracking.stepByStepViews,
        interactive_manipulations: behaviorTracking.interactiveManipulations
    };

    $.ajax({
        url: `${API_BASE_URL}/problems.php/${currentProblem.id}/submit`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(submitData),
        success: function(response) {
            if (response.success) {
                showFeedback(response.data);
            }
        },
        error: function(xhr, status, error) {
            console.error('Failed to submit answer:', error);
            alert('답안 제출에 실패했습니다.');
        }
    });
}

// Show Feedback
function showFeedback(data) {
    const feedback = $('#feedbackDisplay');
    feedback.empty();

    if (data.is_correct) {
        feedback.html(`
            <div class="alert alert-success feedback-correct">
                <h4><i class="fas fa-check-circle"></i> 정답입니다!</h4>
                <p>훌륭해요! 계속 이렇게 잘 해보세요.</p>
            </div>
        `);
    } else {
        feedback.html(`
            <div class="alert alert-danger feedback-incorrect">
                <h4><i class="fas fa-times-circle"></i> 틀렸습니다.</h4>
                <p>정답은 <strong>${data.correct_answer.numerator}/${data.correct_answer.denominator}</strong> 입니다.</p>
                <p>다시 한 번 시도해보세요!</p>
            </div>
        `);
    }

    feedback.fadeIn();

    // Show updated pattern
    if (data.updated_pattern) {
        setTimeout(function() {
            displayLearningPattern(data.updated_pattern);
        }, 1000);
    }
}

// Utility Functions
function getPatternName(pattern) {
    const names = {
        'visual': '시각형',
        'analytical': '분석형',
        'experimental': '실험형',
        'balanced': '균형형'
    };
    return names[pattern] || '분석 중';
}

function getPatternColor(pattern) {
    const colors = {
        'visual': 'badge-success',
        'analytical': 'badge-info',
        'experimental': 'badge-warning',
        'balanced': 'badge-secondary'
    };
    return colors[pattern] || 'badge-secondary';
}

function getPatternIcon(pattern) {
    const icons = {
        'visual': 'fas fa-eye',
        'analytical': 'fas fa-calculator',
        'experimental': 'fas fa-hand-pointer',
        'balanced': 'fas fa-balance-scale'
    };
    return icons[pattern] || 'fas fa-question';
}

function getProblemTypeName(type) {
    const names = {
        'visualization': '시각화',
        'addition': '덧셈',
        'subtraction': '뺄셈',
        'multiplication': '곱셈',
        'division': '나눗셈',
        'comparison': '비교',
        'simplification': '기약분수'
    };
    return names[type] || type;
}

/**
 * Admin Panel JavaScript
 * Problem management functionality
 */

let conditionCounter = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
});

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Create problem button
    document.getElementById('create-problem-btn').addEventListener('click', () => {
        openCreateModal();
    });

    // Form submission
    document.getElementById('problem-form').addEventListener('submit', handleFormSubmit);
}

/**
 * Open create modal
 */
function openCreateModal() {
    const modal = document.getElementById('problem-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('problem-form');

    modalTitle.textContent = '새 문제 만들기';
    form.reset();
    document.getElementById('problem-id').value = '';

    // Clear conditions
    document.getElementById('conditions-container').innerHTML = '';
    conditionCounter = 0;

    // Add one default condition
    addCondition();

    modal.classList.add('active');
}

/**
 * Close modal
 */
function closeModal() {
    const modal = document.getElementById('problem-modal');
    modal.classList.remove('active');
}

/**
 * Add condition input
 */
function addCondition(conditionData = {}) {
    conditionCounter++;

    const container = document.getElementById('conditions-container');
    const conditionDiv = document.createElement('div');
    conditionDiv.className = 'condition-input';
    conditionDiv.dataset.conditionIndex = conditionCounter;

    conditionDiv.innerHTML = `
        <textarea
            name="conditions[${conditionCounter}][text]"
            placeholder="조건 내용을 입력하세요..."
            required
        >${conditionData.text || conditionData.condition_text || ''}</textarea>

        <input
            type="color"
            name="conditions[${conditionCounter}][highlight_color]"
            value="${conditionData.highlight_color || '#ffeb3b'}"
            title="하이라이트 색상">

        <label>
            <input
                type="checkbox"
                name="conditions[${conditionCounter}][is_critical]"
                ${conditionData.is_critical !== '0' && conditionData.is_critical !== 0 ? 'checked' : ''}
                value="1">
            필수
        </label>

        <button type="button" class="btn btn-sm btn-delete" onclick="removeCondition(${conditionCounter})">
            삭제
        </button>
    `;

    container.appendChild(conditionDiv);
}

/**
 * Remove condition input
 */
function removeCondition(index) {
    const conditionDiv = document.querySelector(`[data-condition-index="${index}"]`);
    if (conditionDiv) {
        conditionDiv.remove();
    }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const problemData = {
        teacher_id: parseInt(formData.get('teacher_id')),
        title: formData.get('title'),
        description: formData.get('description'),
        problem_text: formData.get('problem_text'),
        subject: formData.get('subject'),
        difficulty_level: formData.get('difficulty_level'),
        grade_level: formData.get('grade_level'),
        min_reading_time: parseInt(formData.get('min_reading_time')),
        require_all_conditions: formData.get('require_all_conditions') === '1' ? 1 : 0,
        conditions: []
    };

    // Extract conditions
    const conditionsData = {};
    for (const [key, value] of formData.entries()) {
        if (key.startsWith('conditions[')) {
            const match = key.match(/conditions\[(\d+)\]\[(\w+)\]/);
            if (match) {
                const index = match[1];
                const field = match[2];

                if (!conditionsData[index]) {
                    conditionsData[index] = {};
                }

                conditionsData[index][field] = value;
            }
        }
    }

    // Convert conditions object to array
    problemData.conditions = Object.values(conditionsData).map((cond, index) => ({
        text: cond.text,
        highlight_color: cond.highlight_color || '#ffeb3b',
        is_critical: cond.is_critical === '1' ? 1 : 0,
        order: index
    }));

    const problemId = document.getElementById('problem-id').value;
    const isEdit = problemId !== '';

    try {
        let response;

        if (isEdit) {
            // Update existing problem
            problemData.id = parseInt(problemId);
            response = await fetch('../api/problems.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(problemData)
            });
        } else {
            // Create new problem
            response = await fetch('../api/problems.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(problemData)
            });
        }

        const result = await response.json();

        if (result.success) {
            alert(isEdit ? '문제가 수정되었습니다.' : '문제가 생성되었습니다.');
            closeModal();
            location.reload();
        } else {
            alert('오류: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('문제 저장 중 오류가 발생했습니다.');
    }
}

/**
 * View problem
 */
function viewProblem(problemId) {
    const teacherId = document.getElementById('teacher-id').value;
    window.open(`../student/problem_view.php?problem_id=${problemId}&student_id=1`, '_blank');
}

/**
 * Edit problem
 */
async function editProblem(problemId) {
    try {
        const response = await fetch(`../api/problems.php?id=${problemId}&include_conditions=true`);
        const result = await response.json();

        if (!result.success) {
            alert('문제를 불러올 수 없습니다.');
            return;
        }

        const problem = result.data;

        // Open modal
        const modal = document.getElementById('problem-modal');
        const modalTitle = document.getElementById('modal-title');

        modalTitle.textContent = '문제 편집';

        // Fill form
        document.getElementById('problem-id').value = problem.id;
        document.getElementById('title').value = problem.title;
        document.getElementById('description').value = problem.description || '';
        document.getElementById('problem-text').value = problem.problem_text;
        document.getElementById('subject').value = problem.subject;
        document.getElementById('difficulty-level').value = problem.difficulty_level;
        document.getElementById('grade-level').value = problem.grade_level || '';
        document.getElementById('min-reading-time').value = problem.min_reading_time;
        document.getElementById('require-all-conditions').checked = problem.require_all_conditions === 1;

        // Clear and add conditions
        document.getElementById('conditions-container').innerHTML = '';
        conditionCounter = 0;

        if (problem.conditions && problem.conditions.length > 0) {
            problem.conditions.forEach(condition => {
                addCondition(condition);
            });
        } else {
            addCondition();
        }

        modal.classList.add('active');
    } catch (error) {
        console.error('Error:', error);
        alert('문제를 불러오는 중 오류가 발생했습니다.');
    }
}

/**
 * View analytics
 */
function viewAnalytics(problemId) {
    window.location.href = `analytics.php?problem_id=${problemId}`;
}

/**
 * Delete problem
 */
async function deleteProblem(problemId) {
    if (!confirm('정말로 이 문제를 삭제하시겠습니까?\n삭제된 문제는 복구할 수 없습니다.')) {
        return;
    }

    try {
        const response = await fetch(`../api/problems.php?id=${problemId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('문제가 삭제되었습니다.');
            location.reload();
        } else {
            alert('오류: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('문제 삭제 중 오류가 발생했습니다.');
    }
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('problem-modal');
    if (event.target === modal) {
        closeModal();
    }
});

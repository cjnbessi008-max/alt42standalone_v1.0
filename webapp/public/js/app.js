/**
 * Alternative Solutions - Main JavaScript
 */

// Auto-hide alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');

    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });

    // Confirm dialogs for dangerous actions
    document.querySelectorAll('[data-confirm]').forEach(element => {
        element.addEventListener('click', function(e) {
            if (!confirm(this.getAttribute('data-confirm'))) {
                e.preventDefault();
            }
        });
    });

    // Auto-save drafts (if textarea exists)
    const textarea = document.querySelector('textarea[data-autosave]');
    if (textarea) {
        const key = 'autosave_' + textarea.id;

        // Load saved draft
        const saved = localStorage.getItem(key);
        if (saved && textarea.value === '') {
            if (confirm('저장된 초안을 불러오시겠습니까?')) {
                textarea.value = saved;
            }
        }

        // Save periodically
        setInterval(() => {
            if (textarea.value) {
                localStorage.setItem(key, textarea.value);
            }
        }, 10000); // Every 10 seconds

        // Clear on submit
        const form = textarea.closest('form');
        if (form) {
            form.addEventListener('submit', () => {
                localStorage.removeItem(key);
            });
        }
    }
});

// Time tracking for activities
let startTime = null;
let timeTrackingInterval = null;

function startTimeTracking() {
    startTime = Date.now();

    const timeDisplay = document.getElementById('time-display');
    if (timeDisplay) {
        timeTrackingInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;

            timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
}

function getElapsedTime() {
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
}

function stopTimeTracking() {
    if (timeTrackingInterval) {
        clearInterval(timeTrackingInterval);
    }
}

// Initialize time tracking if on solve page
if (document.getElementById('time-display')) {
    startTimeTracking();

    // Store time before leaving
    window.addEventListener('beforeunload', () => {
        const timeInput = document.getElementById('time_spent');
        if (timeInput) {
            timeInput.value = getElapsedTime();
        }
    });
}

// Add alternative form fields dynamically
function addAlternativeField() {
    const container = document.getElementById('alternatives-container');
    if (!container) return;

    const count = container.children.length;
    const newField = document.createElement('div');
    newField.className = 'alternative-item card mb-3';
    newField.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="card-title mb-0">대안 ${count + 1}</h5>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeAlternativeField(this)">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
            <div class="mb-2">
                <label class="form-label">접근 방법 설명</label>
                <textarea name="alternatives[${count}][description]" class="form-control" rows="2" required></textarea>
            </div>
            <div>
                <label class="form-label">이 방법이 효과적일 수 있는 이유</label>
                <textarea name="alternatives[${count}][reasoning]" class="form-control" rows="2"></textarea>
            </div>
        </div>
    `;

    container.appendChild(newField);
}

function removeAlternativeField(button) {
    const item = button.closest('.alternative-item');
    if (item) {
        item.remove();
        // Update numbering
        updateAlternativeNumbers();
    }
}

function updateAlternativeNumbers() {
    const items = document.querySelectorAll('.alternative-item');
    items.forEach((item, index) => {
        const title = item.querySelector('.card-title');
        if (title) {
            title.textContent = `대안 ${index + 1}`;
        }
    });
}

// Progress bar animation
function updateProgressBar(percentage) {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = percentage + '%';
        progressBar.setAttribute('aria-valuenow', percentage);
        progressBar.textContent = percentage + '%';
    }
}

// Confidence level visual feedback
document.querySelectorAll('input[name="confidence"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const level = parseInt(this.value);
        const feedback = document.getElementById('confidence-feedback');

        if (feedback) {
            const messages = {
                1: '😟 괜찮아요, 계속 탐색해보세요!',
                2: '🤔 조금 더 생각해볼까요?',
                3: '😊 좋아요, 계속하세요!',
                4: '😄 잘하고 있어요!',
                5: '🎉 완벽해요!'
            };

            feedback.textContent = messages[level] || '';
        }
    });
});

// Form validation enhancement
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
        if (!form.checkValidity()) {
            e.preventDefault();
            e.stopPropagation();
        }

        form.classList.add('was-validated');
    });
});

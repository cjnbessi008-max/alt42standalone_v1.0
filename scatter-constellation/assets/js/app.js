/**
 * Scatter Constellation - Main Application
 * 애플리케이션 메인 로직
 */

class ScatterConstellationApp {
    constructor() {
        this.constellation = null;
        this.currentCourseId = null;
        this.problems = window.INITIAL_PROBLEMS || [];

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        // Initialize constellation engine
        this.constellation = new ConstellationEngine('constellation-canvas');

        // Setup event listeners
        this.setupEventListeners();

        // Load courses
        await this.loadCourses();

        // Load initial problems if available
        if (this.problems.length > 0) {
            this.constellation.loadProblems(this.problems);
        }

        // Add floating animation to smartphone
        this.enableFloatingAnimation();

        console.log('Scatter Constellation App initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Course selection
        const courseSelect = document.getElementById('course-select');
        if (courseSelect) {
            courseSelect.addEventListener('change', (e) => {
                this.onCourseChange(e.target.value);
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }

        // Listen for point selection in constellation
        const canvas = document.getElementById('constellation-canvas');
        if (canvas) {
            canvas.addEventListener('pointSelected', (e) => {
                this.onPointSelected(e.detail);
            });
        }
    }

    /**
     * Load available courses from Moodle
     */
    async loadCourses() {
        try {
            const courses = await Utils.ajax('api/courses.php');

            const courseSelect = document.getElementById('course-select');
            if (!courseSelect) return;

            // Clear existing options (except first)
            courseSelect.innerHTML = '<option value="">-- Select a Course --</option>';

            // Add courses
            if (courses && courses.length > 0) {
                courses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id || course.moodle_course_id;
                    option.textContent = course.fullname || course.course_name;
                    courseSelect.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No courses available';
                option.disabled = true;
                courseSelect.appendChild(option);
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            Utils.notify('코스를 불러오는데 실패했습니다', 'error');
        }
    }

    /**
     * Handle course selection change
     */
    async onCourseChange(courseId) {
        if (!courseId) {
            this.currentCourseId = null;
            this.problems = [];
            this.constellation.loadProblems([]);
            return;
        }

        this.currentCourseId = courseId;
        await this.loadProblems(courseId);
    }

    /**
     * Load problems for a course
     */
    async loadProblems(courseId) {
        try {
            // Show loading state
            const refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) {
                refreshBtn.innerHTML = '<span class="loading"></span> Loading...';
                refreshBtn.disabled = true;
            }

            const response = await Utils.ajax(`api/problems.php?course_id=${courseId}`);

            if (response && response.problems) {
                this.problems = response.problems;
                this.constellation.loadProblems(this.problems);

                Utils.notify(`${this.problems.length}개의 문제를 불러왔습니다`, 'success');
            } else {
                this.problems = [];
                this.constellation.loadProblems([]);
                Utils.notify('문제 데이터가 없습니다', 'info');
            }
        } catch (error) {
            console.error('Error loading problems:', error);
            Utils.notify('문제를 불러오는데 실패했습니다', 'error');
            this.problems = [];
            this.constellation.loadProblems([]);
        } finally {
            // Restore button
            const refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) {
                refreshBtn.innerHTML = '데이터 새로고침';
                refreshBtn.disabled = false;
            }
        }
    }

    /**
     * Refresh current data
     */
    async refreshData() {
        if (this.currentCourseId) {
            await this.loadProblems(this.currentCourseId);
        } else {
            await this.loadCourses();
            Utils.notify('코스 목록을 새로고침했습니다', 'info');
        }
    }

    /**
     * Handle point selection in constellation
     */
    onPointSelected(point) {
        const detailsDiv = document.getElementById('selected-problem-details');
        if (!detailsDiv) return;

        if (!point) {
            detailsDiv.innerHTML = '점을 클릭하여 문제 정보를 확인하세요';
            return;
        }

        // Display problem details
        const html = `
            <div class="problem-detail-item">
                <span class="problem-detail-label">이름:</span>
                ${this.escapeHtml(point.name)}
            </div>
            <div class="problem-detail-item">
                <span class="problem-detail-label">유형:</span>
                ${this.escapeHtml(point.type)}
            </div>
            <div class="problem-detail-item">
                <span class="problem-detail-label">난이도:</span>
                ${point.difficulty.toFixed(1)} / 10
            </div>
            <div class="problem-detail-item">
                <span class="problem-detail-label">점수:</span>
                ${point.score.toFixed(1)}%
            </div>
            ${point.data.time_limit ? `
            <div class="problem-detail-item">
                <span class="problem-detail-label">제한시간:</span>
                ${Utils.formatTime(point.data.time_limit)}
            </div>
            ` : ''}
        `;

        detailsDiv.innerHTML = html;

        // Add entrance animation
        detailsDiv.style.animation = 'fadeIn 0.3s ease-out';
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Enable floating animation for smartphone
     */
    enableFloatingAnimation() {
        const smartphone = document.querySelector('.smartphone-container');
        if (smartphone) {
            smartphone.classList.add('floating');
        }
    }

    /**
     * Create shooting star effect
     */
    createShootingStar() {
        const canvas = document.getElementById('constellation-canvas');
        if (!canvas) return;

        const star = document.createElement('div');
        star.className = 'shooting-star';
        star.style.left = Utils.randomInt(0, canvas.offsetWidth) + 'px';
        star.style.top = Utils.randomInt(0, canvas.offsetHeight / 2) + 'px';

        canvas.parentElement.appendChild(star);

        setTimeout(() => {
            star.remove();
        }, 3000);
    }
}

// Add CSS animation for fadeIn
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ScatterConstellationApp();

    // Create shooting stars periodically
    setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance every 5 seconds
            window.app.createShootingStar();
        }
    }, 5000);
});

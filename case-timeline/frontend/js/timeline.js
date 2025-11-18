/**
 * Timeline JavaScript
 * Handles timeline rendering and interactions
 */

class Timeline {
    constructor() {
        this.caseData = null;
        this.progressData = null;
        this.currentEventId = null;
        this.startTime = null;
    }

    /**
     * Initialize timeline with case data
     */
    async init(caseId, userId) {
        try {
            // Fetch case data
            await this.loadCaseData(caseId);

            // Fetch or create user progress
            await this.loadProgress(userId, caseId);

            // Render timeline
            this.renderTimeline();

            // Update UI
            this.updateHeader();
            this.updateProgress();

            // Hide loading screen
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('timeline-container').style.display = 'flex';

        } catch (error) {
            console.error('Error initializing timeline:', error);
            alert('Failed to load case. Please try again.');
        }
    }

    /**
     * Load case data from API
     */
    async loadCaseData(caseId) {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.GET_CASE}?id=${caseId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch case data');
        }
        this.caseData = await response.json();
    }

    /**
     * Load user progress from API
     */
    async loadProgress(userId, caseId) {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.PROGRESS}?user_id=${userId}&case_id=${caseId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch progress data');
        }
        this.progressData = await response.json();

        // Store progress ID
        localStorage.setItem(CONFIG.STORAGE_KEYS.PROGRESS_ID, this.progressData.id);
    }

    /**
     * Render timeline events
     */
    renderTimeline() {
        const container = document.getElementById('timeline-events');
        container.innerHTML = '';

        if (!this.caseData || !this.caseData.events) {
            return;
        }

        const completedEvents = this.progressData.completed_events || [];

        this.caseData.events.forEach((event, index) => {
            const isCompleted = completedEvents.includes(event.id);
            const isLocked = index > 0 && !completedEvents.includes(this.caseData.events[index - 1].id);

            const eventElement = this.createEventElement(event, isCompleted, isLocked);
            container.appendChild(eventElement);
        });
    }

    /**
     * Create event element
     */
    createEventElement(event, isCompleted, isLocked) {
        const div = document.createElement('div');
        div.className = `timeline-event ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`;
        div.dataset.eventId = event.id;

        if (!isLocked) {
            div.onclick = () => this.openEvent(event.id);
        }

        div.innerHTML = `
            <div class="event-marker"></div>
            <div class="event-card">
                <span class="event-time">${event.event_time}</span>
                <div class="event-type-badge ${event.event_type}">${event.event_type}</div>
                <div class="event-title">
                    ${event.title}
                    ${event.is_interactive ? '<span class="interactive-indicator">📝</span>' : ''}
                </div>
                <div class="event-preview">${this.stripHtml(event.content)}</div>
            </div>
        `;

        return div;
    }

    /**
     * Open event modal
     */
    openEvent(eventId) {
        const event = this.caseData.events.find(e => e.id === eventId);
        if (!event) return;

        this.currentEventId = eventId;
        this.startTime = Date.now();

        // Update modal content
        document.getElementById('modal-event-time').textContent = event.event_time;
        document.getElementById('modal-event-title').textContent = event.title;
        document.getElementById('modal-event-type').textContent = event.event_type;
        document.getElementById('modal-event-type').className = `event-type-badge ${event.event_type}`;
        document.getElementById('modal-event-content').innerHTML = event.content;

        // Handle media
        const mediaContainer = document.getElementById('modal-event-media');
        mediaContainer.innerHTML = '';
        if (event.media_url && event.media_type === 'image') {
            mediaContainer.innerHTML = `<img src="${event.media_url}" alt="${event.title}">`;
        }

        // Handle interactive response
        const responseSection = document.getElementById('modal-response-section');
        const continueButton = document.getElementById('btn-continue');
        const feedbackMessage = document.getElementById('feedback-message');

        feedbackMessage.className = 'feedback-message';
        feedbackMessage.textContent = '';

        if (event.requires_response) {
            responseSection.style.display = 'block';
            continueButton.style.display = 'none';
            document.getElementById('user-response').value = '';
        } else {
            responseSection.style.display = 'none';
            continueButton.style.display = 'block';
        }

        // Show modal
        document.getElementById('event-modal').style.display = 'flex';
    }

    /**
     * Submit response to interactive event
     */
    async submitResponse() {
        const response = document.getElementById('user-response').value.trim();
        if (!response) {
            alert('Please enter your answer.');
            return;
        }

        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        try {
            const result = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.PROGRESS}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    progress_id: this.progressData.id,
                    event_id: this.currentEventId,
                    response: response,
                    time_spent: timeSpent
                })
            });

            const data = await result.json();

            // Show feedback
            const feedbackMessage = document.getElementById('feedback-message');
            feedbackMessage.className = `feedback-message show ${data.is_correct ? 'correct' : 'incorrect'}`;
            feedbackMessage.textContent = data.feedback;

            // Update score if correct
            if (data.is_correct) {
                this.progressData.total_score += data.points_earned;
                this.progressData.completed_events.push(this.currentEventId);
                this.updateProgress();

                // Show continue button
                document.getElementById('btn-continue').style.display = 'block';
                document.getElementById('user-response').disabled = true;
                document.querySelector('.btn-submit').disabled = true;
            }

        } catch (error) {
            console.error('Error submitting response:', error);
            alert('Failed to submit response. Please try again.');
        }
    }

    /**
     * Continue to next event
     */
    async continueToNext() {
        // Mark current event as completed if not already
        if (!this.progressData.completed_events.includes(this.currentEventId)) {
            this.progressData.completed_events.push(this.currentEventId);
        }

        // Close modal
        this.closeEventModal();

        // Re-render timeline
        this.renderTimeline();

        // Update progress
        this.updateProgress();

        // Check if case is completed
        if (this.progressData.completed_events.length === this.caseData.events.length) {
            await this.completeCase();
        } else {
            // Update progress on server
            await this.updateProgressOnServer();
        }
    }

    /**
     * Update progress on server
     */
    async updateProgressOnServer() {
        try {
            await fetch(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.PROGRESS}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    progress_id: this.progressData.id,
                    event_id: this.currentEventId,
                    status: 'in_progress'
                })
            });
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    }

    /**
     * Complete case
     */
    async completeCase() {
        try {
            await fetch(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.PROGRESS}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    progress_id: this.progressData.id,
                    complete: true
                })
            });

            // Show completion screen
            this.showCompletionScreen();

        } catch (error) {
            console.error('Error completing case:', error);
        }
    }

    /**
     * Show completion screen
     */
    showCompletionScreen() {
        const percentage = Math.round((this.progressData.total_score / this.caseData.total_points) * 100);

        document.getElementById('final-score').textContent = this.progressData.total_score;
        document.getElementById('final-max-score').textContent = this.caseData.total_points;
        document.getElementById('score-percentage').textContent = `${percentage}%`;

        document.getElementById('completion-screen').style.display = 'flex';
    }

    /**
     * Close event modal
     */
    closeEventModal() {
        document.getElementById('event-modal').style.display = 'none';
        document.getElementById('user-response').disabled = false;
        document.querySelector('.btn-submit').disabled = false;
    }

    /**
     * Update header with case title and score
     */
    updateHeader() {
        document.getElementById('case-title').textContent = this.caseData.title;
        document.querySelector('.score').textContent = this.progressData.total_score;
        document.querySelector('.max-score').textContent = this.caseData.total_points;
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        const completedCount = this.progressData.completed_events.length;
        const totalCount = this.caseData.events.length;
        const percentage = Math.round((completedCount / totalCount) * 100);

        document.getElementById('progress-fill').style.width = `${percentage}%`;
        document.getElementById('progress-text').textContent = `${completedCount} / ${totalCount}`;
        document.querySelector('.score').textContent = this.progressData.total_score;
    }

    /**
     * Strip HTML tags
     */
    stripHtml(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    }
}

// Global timeline instance
let timeline = null;

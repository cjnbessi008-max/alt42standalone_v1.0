import './styles/main.css';
import { App3DInsight } from './components/App3DInsight';
import { MoodleAPI } from './services/MoodleAPI';

// Initialize the 3D Insight Mode application
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('3dinsight-app');

    if (!container) {
        console.warn('3D Insight Mode container not found');
        return;
    }

    // Get configuration from data attributes
    const config = {
        courseId: container.dataset.courseId,
        apiEndpoint: container.dataset.apiEndpoint,
        problemData: JSON.parse(container.dataset.problemData || '[]')
    };

    // Initialize Moodle API service
    const moodleAPI = new MoodleAPI(config.apiEndpoint, config.courseId);

    // Initialize the main app
    const app = new App3DInsight(container, config, moodleAPI);
    app.init();

    // Expose app instance for debugging
    window.App3DInsight = app;
});

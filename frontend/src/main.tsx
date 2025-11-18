import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Moodle API 초기화 (환경변수에서 설정)
import { initMoodleApi } from './services/moodleApi';

const moodleBaseUrl = import.meta.env.VITE_MOODLE_BASE_URL || 'http://localhost/moodle';
const moodleToken = import.meta.env.VITE_MOODLE_WS_TOKEN || '';

if (moodleToken) {
  initMoodleApi(moodleBaseUrl, moodleToken);
  console.log('Moodle API initialized');
} else {
  console.warn('Moodle token not found. API calls may fail.');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

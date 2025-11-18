import { useState, useEffect } from 'react';
import './styles/global.css';
import './styles/App.css';
import Header from './components/Header';
import CourseList from './components/CourseList';
import ModeSelector from './components/ModeSelector';
import ThemeSelector from './components/ThemeSelector';
import Settings from './components/Settings';
import { getCourses, getAppTheme, getNotificationMode } from './utils/storage';
import { getTheme } from './models/AppTheme';
import { scheduleAllNotifications } from './utils/notifications';

function App() {
  const [courses, setCourses] = useState([]);
  const [currentTheme, setCurrentTheme] = useState('OCEAN_BLUE');
  const [currentMode, setCurrentMode] = useState('FRESH');
  const [showSettings, setShowSettings] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    const loadedCourses = getCourses();
    const loadedTheme = getAppTheme();
    const loadedMode = getNotificationMode();

    setCourses(loadedCourses);
    setCurrentTheme(loadedTheme);
    setCurrentMode(loadedMode);

    // 알림 스케줄링
    if (loadedCourses.length > 0) {
      scheduleAllNotifications(loadedCourses);
    }
  }, []);

  // 테마 적용
  useEffect(() => {
    const theme = getTheme(currentTheme);
    document.body.style.backgroundColor = theme.backgroundColor;
    document.body.style.color = theme.textColor;
  }, [currentTheme]);

  const handleCoursesChange = (newCourses) => {
    setCourses(newCourses);
    scheduleAllNotifications(newCourses);
  };

  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
  };

  const handleModeChange = (newMode) => {
    setCurrentMode(newMode);
  };

  return (
    <div className="app">
      <Header
        onSettingsClick={() => setShowSettings(!showSettings)}
        theme={getTheme(currentTheme)}
      />

      <div className="container">
        <div className="main-content">
          {/* 모드 및 테마 선택 */}
          <div className="selectors-grid">
            <ModeSelector
              currentMode={currentMode}
              onModeChange={handleModeChange}
              theme={getTheme(currentTheme)}
            />
            <ThemeSelector
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
              theme={getTheme(currentTheme)}
            />
          </div>

          {/* 수업 목록 */}
          <CourseList
            courses={courses}
            onCoursesChange={handleCoursesChange}
            currentMode={currentMode}
            theme={getTheme(currentTheme)}
          />

          {/* 설정 */}
          {showSettings && (
            <Settings
              theme={getTheme(currentTheme)}
              onClose={() => setShowSettings(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

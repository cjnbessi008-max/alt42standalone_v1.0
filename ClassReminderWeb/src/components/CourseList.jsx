import React from 'react';
import './CourseList.css';
import CourseItem from './CourseItem';
import { getSampleCourses } from '../models/Course';
import { saveCourses, removeCourse } from '../utils/storage';
import { showTestNotification, requestNotificationPermission } from '../utils/notifications';

function CourseList({ courses, onCoursesChange, currentMode, theme }) {
  const handleLoadSample = async () => {
    const sampleCourses = getSampleCourses();
    saveCourses(sampleCourses);
    onCoursesChange(sampleCourses);

    // 알림 권한 요청
    await requestNotificationPermission();

    alert(`샘플 데이터가 로드되었습니다! (${sampleCourses.length}개 수업)`);
  };

  const handleDelete = (courseId) => {
    if (confirm('이 수업을 삭제하시겠습니까?')) {
      removeCourse(courseId);
      const updatedCourses = courses.filter(c => c.id !== courseId);
      onCoursesChange(updatedCourses);
    }
  };

  const handleTestNotification = async () => {
    if (courses.length === 0) {
      alert('등록된 수업이 없습니다. 샘플 데이터를 로드해주세요.');
      return;
    }

    const randomCourse = courses[Math.floor(Math.random() * courses.length)];
    await showTestNotification(randomCourse);
  };

  return (
    <div className="course-list-container fade-in">
      {/* 액션 버튼 */}
      <div className="action-buttons">
        <button
          className="btn btn-primary"
          onClick={handleLoadSample}
          style={{ backgroundColor: theme.primaryColor }}
        >
          📚 샘플 데이터 로드
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleTestNotification}
          style={{
            borderColor: theme.primaryColor,
            color: theme.textColor
          }}
        >
          🔔 알림 테스트
        </button>
      </div>

      {/* 수업 목록 제목 */}
      <h2 style={{ color: theme.textColor, marginBottom: '16px' }}>
        나의 시간표 ({courses.length}개 수업)
      </h2>

      {/* 수업 목록 */}
      {courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text">등록된 수업이 없습니다</div>
          <p style={{ color: theme.textColor, opacity: 0.6 }}>
            샘플 데이터를 로드하여 시작해보세요!
          </p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <CourseItem
              key={course.id}
              course={course}
              onDelete={handleDelete}
              theme={theme}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CourseList;

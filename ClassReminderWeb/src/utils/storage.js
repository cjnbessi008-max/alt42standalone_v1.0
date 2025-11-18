import { Course } from '../models/Course';

/**
 * LocalStorage 키
 */
const KEYS = {
  COURSES: 'courses',
  NOTIFICATION_MODE: 'notificationMode',
  APP_THEME: 'appTheme',
  NOTIFICATION_ENABLED: 'notificationEnabled',
  VIBRATION_ENABLED: 'vibrationEnabled',
  SOUND_ENABLED: 'soundEnabled'
};

/**
 * 수업 목록 가져오기
 */
export function getCourses() {
  try {
    const json = localStorage.getItem(KEYS.COURSES);
    if (!json) return [];

    const data = JSON.parse(json);
    return data.map(item => new Course(item));
  } catch (error) {
    console.error('Failed to load courses:', error);
    return [];
  }
}

/**
 * 수업 목록 저장
 */
export function saveCourses(courses) {
  try {
    const data = courses.map(course => course.toJSON());
    localStorage.setItem(KEYS.COURSES, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save courses:', error);
    return false;
  }
}

/**
 * 수업 추가
 */
export function addCourse(course) {
  const courses = getCourses();
  courses.push(course);
  return saveCourses(courses);
}

/**
 * 수업 삭제
 */
export function removeCourse(courseId) {
  const courses = getCourses();
  const filtered = courses.filter(c => c.id !== courseId);
  return saveCourses(filtered);
}

/**
 * 알림 모드 가져오기
 */
export function getNotificationMode() {
  return localStorage.getItem(KEYS.NOTIFICATION_MODE) || 'FRESH';
}

/**
 * 알림 모드 저장
 */
export function saveNotificationMode(mode) {
  localStorage.setItem(KEYS.NOTIFICATION_MODE, mode);
}

/**
 * 앱 테마 가져오기
 */
export function getAppTheme() {
  return localStorage.getItem(KEYS.APP_THEME) || 'OCEAN_BLUE';
}

/**
 * 앱 테마 저장
 */
export function saveAppTheme(theme) {
  localStorage.setItem(KEYS.APP_THEME, theme);
}

/**
 * 알림 활성화 여부
 */
export function isNotificationEnabled() {
  const value = localStorage.getItem(KEYS.NOTIFICATION_ENABLED);
  return value === null ? true : value === 'true';
}

/**
 * 알림 활성화 설정
 */
export function setNotificationEnabled(enabled) {
  localStorage.setItem(KEYS.NOTIFICATION_ENABLED, String(enabled));
}

/**
 * 진동 활성화 여부
 */
export function isVibrationEnabled() {
  const value = localStorage.getItem(KEYS.VIBRATION_ENABLED);
  return value === null ? true : value === 'true';
}

/**
 * 진동 활성화 설정
 */
export function setVibrationEnabled(enabled) {
  localStorage.setItem(KEYS.VIBRATION_ENABLED, String(enabled));
}

/**
 * 소리 활성화 여부
 */
export function isSoundEnabled() {
  const value = localStorage.getItem(KEYS.SOUND_ENABLED);
  return value === null ? true : value === 'true';
}

/**
 * 소리 활성화 설정
 */
export function setSoundEnabled(enabled) {
  localStorage.setItem(KEYS.SOUND_ENABLED, String(enabled));
}

/**
 * 모든 데이터 초기화
 */
export function clearAll() {
  localStorage.clear();
}

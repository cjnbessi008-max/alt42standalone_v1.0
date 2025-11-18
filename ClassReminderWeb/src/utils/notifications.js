import { getRandomMessage } from '../models/NotificationMode';
import { isNotificationEnabled, isVibrationEnabled, getNotificationMode } from './storage';

/**
 * 알림 권한 요청
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * 알림 표시
 */
export function showNotification(course) {
  if (!isNotificationEnabled()) {
    return;
  }

  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted');
    return;
  }

  const mode = getNotificationMode();
  const message = getRandomMessage(mode, course);

  const options = {
    body: message,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: isVibrationEnabled() ? [200, 100, 200, 100, 200] : undefined,
    tag: `course-${course.id}`,
    requireInteraction: true,
    data: {
      courseId: course.id,
      courseName: course.name
    }
  };

  const notification = new Notification('수업 알림', options);

  notification.onclick = function(event) {
    event.preventDefault();
    window.focus();
    notification.close();
  };

  return notification;
}

/**
 * 테스트 알림 표시
 */
export async function showTestNotification(course) {
  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    alert('알림 권한이 필요합니다. 브라우저 설정에서 알림을 허용해주세요.');
    return;
  }

  showNotification(course);
}

/**
 * 알림 스케줄링 (setTimeout 사용)
 */
const scheduledTimeouts = new Map();

export function scheduleNotification(course) {
  // 기존 스케줄 제거
  cancelNotification(course.id);

  const reminderTime = course.getNextReminderTime();
  const now = new Date();
  const delay = reminderTime.getTime() - now.getTime();

  if (delay <= 0) {
    // 이미 지난 시간이면 다음 주로 예약
    reminderTime.setDate(reminderTime.getDate() + 7);
    const newDelay = reminderTime.getTime() - now.getTime();

    const timeoutId = setTimeout(() => {
      showNotification(course);
      // 알림 후 다음 주로 재예약
      scheduleNotification(course);
    }, newDelay);

    scheduledTimeouts.set(course.id, timeoutId);
  } else {
    const timeoutId = setTimeout(() => {
      showNotification(course);
      // 알림 후 다음 주로 재예약
      scheduleNotification(course);
    }, delay);

    scheduledTimeouts.set(course.id, timeoutId);
  }

  console.log(`Scheduled notification for ${course.name} at ${reminderTime.toLocaleString()}`);
}

/**
 * 알림 취소
 */
export function cancelNotification(courseId) {
  const timeoutId = scheduledTimeouts.get(courseId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    scheduledTimeouts.delete(courseId);
  }
}

/**
 * 모든 알림 취소
 */
export function cancelAllNotifications() {
  scheduledTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
  scheduledTimeouts.clear();
}

/**
 * 모든 수업 알림 스케줄링
 */
export function scheduleAllNotifications(courses) {
  cancelAllNotifications();

  courses.forEach(course => {
    scheduleNotification(course);
  });
}

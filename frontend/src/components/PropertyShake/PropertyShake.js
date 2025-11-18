import React, { useEffect, useState } from 'react';
import './PropertyShake.css';

function PropertyShake({ propertyChange }) {
  const [notification, setNotification] = useState(null);
  const [vibrationSupported, setVibrationSupported] = useState(false);

  useEffect(() => {
    // Vibration API 지원 확인
    setVibrationSupported('vibrate' in navigator);
  }, []);

  useEffect(() => {
    if (!propertyChange || !propertyChange.hasChange) return;

    // 진동 트리거
    if (vibrationSupported && propertyChange.vibrationPattern) {
      try {
        navigator.vibrate(propertyChange.vibrationPattern);
      } catch (error) {
        console.error('진동 실행 오류:', error);
      }
    }

    // 알림 표시
    setNotification({
      type: propertyChange.type,
      description: propertyChange.description,
      timestamp: Date.now()
    });

    // 3초 후 알림 제거
    const timer = setTimeout(() => {
      setNotification(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [propertyChange, vibrationSupported]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'slope_change':
        return '↕️';
      case 'extremum':
        return '🔴';
      case 'inflection':
        return '🔵';
      default:
        return '📊';
    }
  };

  const getNotificationClass = (type) => {
    switch (type) {
      case 'slope_change':
        return 'notification-slope';
      case 'extremum':
        return 'notification-extremum';
      case 'inflection':
        return 'notification-inflection';
      default:
        return '';
    }
  };

  return (
    <div className="property-shake">
      {notification && (
        <div className={`shake-notification ${getNotificationClass(notification.type)} show`}>
          <span className="notification-icon">
            {getNotificationIcon(notification.type)}
          </span>
          <span className="notification-text">
            {notification.description}
          </span>
          {vibrationSupported && (
            <span className="vibration-indicator">📳</span>
          )}
        </div>
      )}

      {!vibrationSupported && (
        <div className="vibration-warning">
          ⚠️ 이 기기는 진동 기능을 지원하지 않습니다
        </div>
      )}
    </div>
  );
}

export default PropertyShake;

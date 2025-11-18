import React, { ReactNode } from 'react';
import styles from './MobilePhoneFrame.module.css';

interface MobilePhoneFrameProps {
  children: ReactNode;
  width?: number;
  height?: number;
  backgroundColor?: string;
  showNotch?: boolean;
}

export const MobilePhoneFrame: React.FC<MobilePhoneFrameProps> = ({
  children,
  width = 375,
  height = 667,
  backgroundColor = '#ffffff',
  showNotch = true,
}) => {
  return (
    <div className={styles.phoneFrame}>
      <div className={styles.phoneBezel}>
        {showNotch && <div className={styles.notch} />}
        <div
          className={styles.phoneScreen}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            backgroundColor,
          }}
        >
          {children}
        </div>
        <div className={styles.homeButton} />
      </div>
    </div>
  );
};

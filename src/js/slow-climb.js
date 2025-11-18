/**
 * Slow Climb Animation System
 * 로그가 천천히 증가하며 올라가는 애니메이션 효과
 */

class SlowClimbLogger {
    constructor() {
        this.logContainer = document.getElementById('log-list');
        this.logCount = 0;
        this.animationSpeed = 800; // ms
        this.maxLogs = 50; // 최대 표시 로그 개수
        this.autoScroll = true;

        // 샘플 학생 이름
        this.sampleStudents = [
            '김민수', '이지은', '박준호', '최서연', '정우진',
            '강하늘', '윤아름', '임태양', '한별이', '송지우'
        ];

        // 샘플 활동 유형
        this.activityTypes = [
            { type: 'answer', text: '문제를 풀었습니다', icon: '✏️' },
            { type: 'correct', text: '정답입니다!', icon: '✅' },
            { type: 'incorrect', text: '오답입니다', icon: '❌' },
            { type: 'hint', text: '힌트를 요청했습니다', icon: '💡' },
            { type: 'answer', text: '분수를 입력했습니다', icon: '🔢' },
            { type: 'correct', text: '단계를 완료했습니다', icon: '🎯' },
        ];

        this.init();
    }

    init() {
        // 이벤트 리스너 설정
        document.getElementById('add-log-btn').addEventListener('click', () => {
            this.addRandomLog();
        });

        document.getElementById('add-multiple-btn').addEventListener('click', () => {
            this.addMultipleLogs(5);
        });

        document.getElementById('clear-logs').addEventListener('click', () => {
            this.clearLogs();
        });

        document.getElementById('speed-slider').addEventListener('input', (e) => {
            this.animationSpeed = (11 - parseInt(e.target.value)) * 100;
            document.getElementById('speed-value').textContent = e.target.value;
        });

        document.getElementById('toggle-animation-btn').addEventListener('click', () => {
            this.toggleAnimationSpeed();
        });

        // Moodle API 연결 시작 (추후 구현)
        // this.connectToMoodle();

        // 초기 환영 로그
        this.addWelcomeLog();

        // 데모용: 5초마다 자동으로 로그 추가
        // setInterval(() => this.addRandomLog(), 5000);
    }

    /**
     * 환영 로그 추가
     */
    addWelcomeLog() {
        const log = {
            student: 'System',
            content: '학습 활동 모니터링을 시작합니다',
            type: 'hint',
            timestamp: new Date()
        };
        this.addLog(log);
    }

    /**
     * 랜덤 로그 생성 및 추가
     */
    addRandomLog() {
        const student = this.sampleStudents[Math.floor(Math.random() * this.sampleStudents.length)];
        const activity = this.activityTypes[Math.floor(Math.random() * this.activityTypes.length)];

        const log = {
            student: student,
            content: `${activity.icon} ${activity.text}`,
            type: activity.type,
            timestamp: new Date()
        };

        this.addLog(log);
    }

    /**
     * 연속으로 여러 로그 추가
     */
    addMultipleLogs(count) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.addRandomLog();
            }, i * (this.animationSpeed / 2));
        }
    }

    /**
     * 로그 추가 (Slow Climb 애니메이션 포함)
     */
    addLog(logData) {
        // 최대 로그 개수 제한
        if (this.logCount >= this.maxLogs) {
            const oldestLog = this.logContainer.firstElementChild;
            if (oldestLog) {
                oldestLog.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => oldestLog.remove(), 300);
                this.logCount--;
            }
        }

        // 새 로그 항목 생성
        const logElement = this.createLogElement(logData);

        // 기존 로그들에 climbing 클래스 추가 (위로 올라가는 애니메이션)
        const existingLogs = this.logContainer.querySelectorAll('.log-item');
        existingLogs.forEach(log => {
            if (!log.classList.contains('climbing')) {
                log.classList.add('preparing-climb');
            }
        });

        // 새 로그를 컨테이너 맨 아래에 추가
        this.logContainer.appendChild(logElement);

        // 애니메이션 트리거
        setTimeout(() => {
            // 새 로그 나타나기
            logElement.style.animation = `slideUp ${this.animationSpeed / 1000}s cubic-bezier(0.4, 0.0, 0.2, 1) forwards`;

            // Slow Climb: 기존 로그들이 천천히 위로 이동
            existingLogs.forEach((log, index) => {
                const delay = index * 50; // 순차적으로 올라가는 효과
                setTimeout(() => {
                    log.style.transition = `transform ${this.animationSpeed / 1000}s cubic-bezier(0.4, 0.0, 0.2, 1)`;
                    const currentTransform = log.style.transform || 'translateY(0)';
                    const match = currentTransform.match(/translateY\(([-\d.]+)px\)/);
                    const currentY = match ? parseFloat(match[1]) : 0;

                    // 한 칸씩 위로 (로그 높이 + gap 만큼)
                    const logHeight = logElement.offsetHeight + 8; // gap 포함
                    log.style.transform = `translateY(${currentY - logHeight}px)`;
                }, delay);
            });
        }, 10);

        this.logCount++;
        this.updateStats();

        // 자동 스크롤
        if (this.autoScroll) {
            this.scrollToBottom();
        }
    }

    /**
     * 로그 엘리먼트 생성
     */
    createLogElement(logData) {
        const logItem = document.createElement('div');
        logItem.className = 'log-item';

        const header = document.createElement('div');
        header.className = 'log-item-header';

        const student = document.createElement('span');
        student.className = 'log-student';
        student.textContent = logData.student;

        const time = document.createElement('span');
        time.className = 'log-time';
        time.textContent = this.formatTime(logData.timestamp);

        header.appendChild(student);
        header.appendChild(time);

        const content = document.createElement('div');
        content.className = 'log-content';
        content.textContent = logData.content;

        const typeTag = document.createElement('span');
        typeTag.className = `log-type ${logData.type}`;
        typeTag.textContent = this.getTypeLabel(logData.type);

        logItem.appendChild(header);
        logItem.appendChild(content);
        logItem.appendChild(typeTag);

        return logItem;
    }

    /**
     * 시간 포맷팅
     */
    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    /**
     * 로그 타입 라벨
     */
    getTypeLabel(type) {
        const labels = {
            'answer': '응답',
            'correct': '정답',
            'incorrect': '오답',
            'hint': '힌트'
        };
        return labels[type] || '기타';
    }

    /**
     * 모든 로그 지우기
     */
    clearLogs() {
        const logs = this.logContainer.querySelectorAll('.log-item');
        logs.forEach((log, index) => {
            setTimeout(() => {
                log.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => log.remove(), 300);
            }, index * 50);
        });

        this.logCount = 0;
        setTimeout(() => {
            this.updateStats();
            this.addWelcomeLog();
        }, logs.length * 50 + 300);
    }

    /**
     * 하단으로 스크롤
     */
    scrollToBottom() {
        const container = document.getElementById('log-container');
        container.scrollTop = container.scrollHeight;
    }

    /**
     * 통계 업데이트
     */
    updateStats() {
        document.getElementById('log-count').textContent = `${this.logCount}개`;

        // 중복 없는 학생 수 계산
        const students = new Set();
        this.logContainer.querySelectorAll('.log-student').forEach(el => {
            if (el.textContent !== 'System') {
                students.add(el.textContent);
            }
        });
        document.getElementById('student-count').textContent = `${students.size}명`;
    }

    /**
     * 애니메이션 속도 토글
     */
    toggleAnimationSpeed() {
        const speeds = [200, 500, 800, 1200];
        const currentIndex = speeds.indexOf(this.animationSpeed);
        const nextIndex = (currentIndex + 1) % speeds.length;
        this.animationSpeed = speeds[nextIndex];

        // 슬라이더 값도 업데이트
        const sliderValue = 11 - (this.animationSpeed / 100);
        document.getElementById('speed-slider').value = sliderValue;
        document.getElementById('speed-value').textContent = sliderValue;

        alert(`애니메이션 속도: ${this.animationSpeed}ms`);
    }

    /**
     * Moodle API 연결 (추후 구현)
     */
    async connectToMoodle() {
        try {
            // Moodle Web Service API 호출
            const response = await fetch('api/moodle-connector.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'get_activity_logs'
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.processMoodleLogs(data);
            }
        } catch (error) {
            console.error('Moodle 연결 오류:', error);
        }
    }

    /**
     * Moodle 로그 처리
     */
    processMoodleLogs(data) {
        if (data.logs && Array.isArray(data.logs)) {
            data.logs.forEach(logData => {
                this.addLog({
                    student: logData.username,
                    content: logData.description,
                    type: this.mapMoodleEventType(logData.eventname),
                    timestamp: new Date(logData.timecreated * 1000)
                });
            });
        }
    }

    /**
     * Moodle 이벤트 타입 매핑
     */
    mapMoodleEventType(eventname) {
        const typeMap = {
            'quiz_attempt_started': 'answer',
            'quiz_attempt_submitted': 'correct',
            'question_answered': 'answer',
            'hint_viewed': 'hint'
        };
        return typeMap[eventname] || 'answer';
    }

    /**
     * 실시간 업데이트 시작 (폴링 또는 WebSocket)
     */
    startRealTimeUpdates(interval = 5000) {
        setInterval(() => {
            this.connectToMoodle();
        }, interval);
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    const logger = new SlowClimbLogger();

    // 전역 접근을 위해 window에 저장
    window.slowClimbLogger = logger;

    console.log('Slow Climb Logger 초기화 완료');
});

// fadeOut 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.8);
        }
    }
`;
document.head.appendChild(style);

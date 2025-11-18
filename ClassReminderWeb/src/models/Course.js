/**
 * 요일 상수
 */
export const DayOfWeek = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
};

/**
 * 요일 이름 매핑
 */
export const DayNames = {
  0: '일요일',
  1: '월요일',
  2: '화요일',
  3: '수요일',
  4: '목요일',
  5: '금요일',
  6: '토요일'
};

/**
 * Course 클래스
 */
export class Course {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.instructor = data.instructor;
    this.room = data.room;
    this.dayOfWeek = data.dayOfWeek;
    this.startHour = data.startHour;
    this.startMinute = data.startMinute;
    this.endHour = data.endHour;
    this.endMinute = data.endMinute;
    this.color = data.color || '#FF6B6B';
  }

  /**
   * 수업 시작 시간을 Date 객체로 반환
   */
  getStartTime() {
    const now = new Date();
    const startTime = new Date(now);

    // 이번 주의 해당 요일로 설정
    const currentDay = now.getDay();
    const targetDay = this.dayOfWeek;
    const dayDiff = targetDay - currentDay;

    startTime.setDate(now.getDate() + dayDiff);
    startTime.setHours(this.startHour, this.startMinute, 0, 0);

    return startTime;
  }

  /**
   * 수업 시작 1시간 전 시간을 Date 객체로 반환
   */
  getReminderTime() {
    const startTime = this.getStartTime();
    const reminderTime = new Date(startTime);
    reminderTime.setHours(reminderTime.getHours() - 1);
    return reminderTime;
  }

  /**
   * 다음 수업 시작 시간 계산 (이미 지난 시간이면 다음 주)
   */
  getNextStartTime() {
    const startTime = this.getStartTime();
    const now = new Date();

    if (startTime <= now) {
      // 다음 주로 설정
      startTime.setDate(startTime.getDate() + 7);
    }

    return startTime;
  }

  /**
   * 다음 알림 시간 계산
   */
  getNextReminderTime() {
    const nextStartTime = this.getNextStartTime();
    const reminderTime = new Date(nextStartTime);
    reminderTime.setHours(reminderTime.getHours() - 1);
    return reminderTime;
  }

  /**
   * 시간 포맷 (09:00 - 10:30)
   */
  getTimeString() {
    const formatTime = (hour, minute) => {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    };

    return `${formatTime(this.startHour, this.startMinute)} - ${formatTime(this.endHour, this.endMinute)}`;
  }

  /**
   * 요일 이름 반환
   */
  getDayName() {
    return DayNames[this.dayOfWeek] || '알 수 없음';
  }

  /**
   * JSON으로 변환
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      instructor: this.instructor,
      room: this.room,
      dayOfWeek: this.dayOfWeek,
      startHour: this.startHour,
      startMinute: this.startMinute,
      endHour: this.endHour,
      endMinute: this.endMinute,
      color: this.color
    };
  }
}

/**
 * 샘플 시간표 데이터
 */
export function getSampleCourses() {
  return [
    new Course({
      id: 'CS101',
      name: '컴퓨터과학개론',
      instructor: '김교수',
      room: '공학관 101',
      dayOfWeek: DayOfWeek.MONDAY,
      startHour: 9,
      startMinute: 0,
      endHour: 10,
      endMinute: 30,
      color: '#FF6B6B'
    }),
    new Course({
      id: 'MATH201',
      name: '선형대수학',
      instructor: '이교수',
      room: '자연관 205',
      dayOfWeek: DayOfWeek.TUESDAY,
      startHour: 13,
      startMinute: 0,
      endHour: 14,
      endMinute: 30,
      color: '#4ECDC4'
    }),
    new Course({
      id: 'ENG301',
      name: '영어회화',
      instructor: '박교수',
      room: '인문관 302',
      dayOfWeek: DayOfWeek.WEDNESDAY,
      startHour: 10,
      startMinute: 30,
      endHour: 12,
      endMinute: 0,
      color: '#45B7D1'
    }),
    new Course({
      id: 'PHY101',
      name: '물리학실험',
      instructor: '최교수',
      room: '과학관 401',
      dayOfWeek: DayOfWeek.THURSDAY,
      startHour: 14,
      startMinute: 0,
      endHour: 17,
      endMinute: 0,
      color: '#F7DC6F'
    }),
    new Course({
      id: 'CS202',
      name: '자료구조',
      instructor: '정교수',
      room: '공학관 203',
      dayOfWeek: DayOfWeek.FRIDAY,
      startHour: 11,
      startMinute: 0,
      endHour: 12,
      endMinute: 30,
      color: '#BB8FCE'
    })
  ];
}

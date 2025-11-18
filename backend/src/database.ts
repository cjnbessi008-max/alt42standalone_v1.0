import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '../data.db'));

// Initialize database schema
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS problems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
      subject TEXT NOT NULL,
      priority_flag TEXT CHECK(priority_flag IN ('important', 'solve_first', 'review', NULL)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS problem_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id INTEGER NOT NULL,
      student_name TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL,
      attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (problem_id) REFERENCES problems(id)
    );

    CREATE INDEX IF NOT EXISTS idx_priority_flag ON problems(priority_flag);
    CREATE INDEX IF NOT EXISTS idx_difficulty ON problems(difficulty);
    CREATE INDEX IF NOT EXISTS idx_subject ON problems(subject);
  `);

  // Insert sample data if table is empty
  const count = db.prepare('SELECT COUNT(*) as count FROM problems').get() as { count: number };

  if (count.count === 0) {
    const insert = db.prepare(`
      INSERT INTO problems (title, description, difficulty, subject, priority_flag)
      VALUES (?, ?, ?, ?, ?)
    `);

    const sampleProblems = [
      ['분수의 덧셈', '1/2 + 1/3을 계산하세요', 'easy', 'mathematics', 'important'],
      ['이차방정식 풀이', 'x² - 5x + 6 = 0을 풀어보세요', 'medium', 'mathematics', 'solve_first'],
      ['미분 개념', 'f(x) = x²의 도함수를 구하세요', 'hard', 'mathematics', null],
      ['영어 문법: 현재완료', 'I ____ (live) here for 5 years. 빈칸을 채우세요', 'easy', 'english', 'review'],
      ['물리: 뉴턴의 제2법칙', 'F = ma 공식을 이용해 가속도를 계산하세요', 'medium', 'science', 'important'],
      ['화학: 주기율표', '산소의 원자번호는?', 'easy', 'science', null],
      ['한국사: 조선시대', '세종대왕의 주요 업적을 3가지 서술하세요', 'medium', 'history', 'solve_first'],
      ['프로그래밍: 반복문', 'for 루프를 사용해 1부터 10까지 출력하세요', 'easy', 'programming', null],
      ['자료구조: 스택', '스택의 LIFO 특성을 설명하세요', 'medium', 'programming', 'review'],
      ['알고리즘: 정렬', '퀵소트와 머지소트의 차이점을 설명하세요', 'hard', 'programming', 'important']
    ];

    const insertMany = db.transaction((problems) => {
      for (const problem of problems) {
        insert.run(...problem);
      }
    });

    insertMany(sampleProblems);
    console.log('Sample problems inserted successfully');
  }
}

export default db;

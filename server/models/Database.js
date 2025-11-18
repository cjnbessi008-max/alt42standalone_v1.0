import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseManager {
  constructor() {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/standalone.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  initialize() {
    this.createTables();
    this.seedInitialData();
    console.log('✅ Database initialized successfully');
  }

  createTables() {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        firstname TEXT NOT NULL,
        lastname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'student' CHECK(role IN ('student', 'teacher', 'admin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Problems table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS problems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        data_array TEXT NOT NULL,
        expected_answer INTEGER NOT NULL,
        difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy', 'medium', 'hard')),
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Attempts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        problem_id INTEGER NOT NULL,
        answer INTEGER NOT NULL,
        is_correct INTEGER DEFAULT 0 CHECK(is_correct IN (0, 1)),
        time_spent INTEGER,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
      )
    `);

    // Progress table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER UNIQUE NOT NULL,
        total_problems_attempted INTEGER DEFAULT 0,
        total_problems_correct INTEGER DEFAULT 0,
        total_attempts INTEGER DEFAULT 0,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_attempts_student ON attempts(student_id);
      CREATE INDEX IF NOT EXISTS idx_attempts_problem ON attempts(problem_id);
      CREATE INDEX IF NOT EXISTS idx_attempts_submitted ON attempts(submitted_at);
      CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    console.log('✅ Tables created successfully');
  }

  seedInitialData() {
    // Check if admin user exists
    const adminExists = this.db.prepare('SELECT id FROM users WHERE username = ?').get('admin');

    if (!adminExists) {
      // Create default admin user
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      this.db.prepare(`
        INSERT INTO users (username, password, firstname, lastname, email, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('admin', hashedPassword, 'Admin', 'User', 'admin@example.com', 'admin');

      // Create default student user
      const studentPassword = bcrypt.hashSync('student123', 10);
      this.db.prepare(`
        INSERT INTO users (username, password, firstname, lastname, email, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('student', studentPassword, '학생', '일', 'student@example.com', 'student');

      console.log('✅ Default users created (admin/admin123, student/student123)');
    }

    // Check if problems exist
    const problemsExist = this.db.prepare('SELECT COUNT(*) as count FROM problems').get();

    if (problemsExist.count === 0) {
      const problems = [
        {
          title: '부분합 문제 1 - 양수 배열',
          description: '다음 배열의 부분합을 계산하세요: [1, 2, 3, 4, 5]',
          data_array: JSON.stringify([1, 2, 3, 4, 5]),
          expected_answer: 15,
          difficulty: 'easy'
        },
        {
          title: '부분합 문제 2 - 혼합 배열',
          description: '다음 배열의 부분합을 계산하세요: [5, -2, 3, -1, 4]',
          data_array: JSON.stringify([5, -2, 3, -1, 4]),
          expected_answer: 9,
          difficulty: 'medium'
        },
        {
          title: '부분합 문제 3 - 큰 숫자',
          description: '다음 배열의 부분합을 계산하세요: [10, 20, 30, 40, 50]',
          data_array: JSON.stringify([10, 20, 30, 40, 50]),
          expected_answer: 150,
          difficulty: 'easy'
        },
        {
          title: '부분합 문제 4 - 피보나치 수열',
          description: '다음 피보나치 배열의 부분합을 계산하세요: [1, 1, 2, 3, 5, 8]',
          data_array: JSON.stringify([1, 1, 2, 3, 5, 8]),
          expected_answer: 20,
          difficulty: 'medium'
        },
        {
          title: '부분합 문제 5 - 음수 포함',
          description: '다음 배열의 부분합을 계산하세요: [-5, 10, -3, 8, -2]',
          data_array: JSON.stringify([-5, 10, -3, 8, -2]),
          expected_answer: 8,
          difficulty: 'hard'
        },
        {
          title: '부분합 문제 6 - 등차수열',
          description: '다음 등차수열 배열의 부분합을 계산하세요: [2, 4, 6, 8, 10]',
          data_array: JSON.stringify([2, 4, 6, 8, 10]),
          expected_answer: 30,
          difficulty: 'easy'
        },
        {
          title: '부분합 문제 7 - 제곱수',
          description: '다음 제곱수 배열의 부분합을 계산하세요: [1, 4, 9, 16, 25]',
          data_array: JSON.stringify([1, 4, 9, 16, 25]),
          expected_answer: 55,
          difficulty: 'medium'
        },
        {
          title: '부분합 문제 8 - 복합 배열',
          description: '다음 배열의 부분합을 계산하세요: [3, -7, 11, -4, 6, -9, 12]',
          data_array: JSON.stringify([3, -7, 11, -4, 6, -9, 12]),
          expected_answer: 12,
          difficulty: 'hard'
        },
        {
          title: '부분합 문제 9 - 간단한 배열',
          description: '다음 배열의 부분합을 계산하세요: [5, 5, 5, 5, 5]',
          data_array: JSON.stringify([5, 5, 5, 5, 5]),
          expected_answer: 25,
          difficulty: 'easy'
        },
        {
          title: '부분합 문제 10 - 도전 과제',
          description: '다음 배열의 부분합을 계산하세요: [12, -8, 15, -3, 7, -11, 20]',
          data_array: JSON.stringify([12, -8, 15, -3, 7, -11, 20]),
          expected_answer: 32,
          difficulty: 'hard'
        }
      ];

      const stmt = this.db.prepare(`
        INSERT INTO problems (title, description, data_array, expected_answer, difficulty, created_by)
        VALUES (?, ?, ?, ?, ?, 1)
      `);

      const insertMany = this.db.transaction((problems) => {
        for (const problem of problems) {
          stmt.run(
            problem.title,
            problem.description,
            problem.data_array,
            problem.expected_answer,
            problem.difficulty
          );
        }
      });

      insertMany(problems);
      console.log('✅ Sample problems created');
    }
  }

  getDb() {
    return this.db;
  }

  close() {
    this.db.close();
  }
}

export default DatabaseManager;

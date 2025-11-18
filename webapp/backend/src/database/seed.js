/**
 * Database Seeding Script - Sample Data for Testing
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../../data/concepts.db');
const db = new Database(DB_PATH);

console.log('🌱 Seeding database with sample data...');

// Sample concepts
const concepts = [
  { name: '분수의 기본 개념', description: '분수란 무엇인가, 분자와 분모', category: '수학-분수', difficulty_level: 'beginner' },
  { name: '분수의 덧셈', description: '같은 분모를 가진 분수의 덧셈', category: '수학-분수', difficulty_level: 'intermediate' },
  { name: '분수의 뺄셈', description: '같은 분모를 가진 분수의 뺄셈', category: '수학-분수', difficulty_level: 'intermediate' },
  { name: '통분', description: '서로 다른 분모를 같게 만들기', category: '수학-분수', difficulty_level: 'intermediate' },
  { name: '약분', description: '분수를 간단하게 만들기', category: '수학-분수', difficulty_level: 'intermediate' },
  { name: '대분수와 가분수', description: '대분수를 가분수로, 가분수를 대분수로', category: '수학-분수', difficulty_level: 'beginner' },
  { name: '분수의 곱셈', description: '분수끼리의 곱셈', category: '수학-분수', difficulty_level: 'advanced' },
  { name: '분수의 나눗셈', description: '분수끼리의 나눗셈', category: '수학-분수', difficulty_level: 'advanced' },
  { name: '소수의 개념', description: '소수점과 자릿수', category: '수학-소수', difficulty_level: 'beginner' },
  { name: '소수의 덧셈', description: '소수의 덧셈 방법', category: '수학-소수', difficulty_level: 'intermediate' },
];

const insertConcept = db.prepare(`
  INSERT INTO concepts (name, description, category, difficulty_level)
  VALUES (?, ?, ?, ?)
`);

const insertMany = db.transaction((items) => {
  for (const item of items) {
    insertConcept.run(item.name, item.description, item.category, item.difficulty_level);
  }
});

insertMany(concepts);
console.log(`✅ Inserted ${concepts.length} concepts`);

// Sample problems
const problems = [
  { title: '분수의 의미 이해', description: '1/2은 무엇을 의미하나요?', problem_type: 'multiple_choice', difficulty_level: 'easy', points: 10, hints: '전체를 2로 나눈 것 중 1개' },
  { title: '분수 읽기', description: '3/4를 올바르게 읽으세요', problem_type: 'text_input', difficulty_level: 'easy', points: 10 },
  { title: '같은 분모 분수 덧셈 1', description: '1/5 + 2/5 = ?', problem_type: 'calculation', difficulty_level: 'medium', points: 15, solution: '3/5' },
  { title: '같은 분모 분수 덧셈 2', description: '2/7 + 3/7 = ?', problem_type: 'calculation', difficulty_level: 'medium', points: 15, solution: '5/7' },
  { title: '같은 분모 분수 뺄셈 1', description: '4/6 - 1/6 = ?', problem_type: 'calculation', difficulty_level: 'medium', points: 15, solution: '3/6 또는 1/2' },
  { title: '같은 분모 분수 뺄셈 2', description: '5/8 - 2/8 = ?', problem_type: 'calculation', difficulty_level: 'medium', points: 15, solution: '3/8' },
  { title: '통분 연습 1', description: '1/2와 1/4를 통분하세요', problem_type: 'calculation', difficulty_level: 'hard', points: 20, solution: '2/4와 1/4' },
  { title: '통분 연습 2', description: '1/3과 1/6을 통분하세요', problem_type: 'calculation', difficulty_level: 'hard', points: 20, solution: '2/6과 1/6' },
  { title: '약분 연습 1', description: '4/8을 약분하세요', problem_type: 'calculation', difficulty_level: 'medium', points: 15, solution: '1/2' },
  { title: '약분 연습 2', description: '6/9를 약분하세요', problem_type: 'calculation', difficulty_level: 'medium', points: 15, solution: '2/3' },
  { title: '대분수를 가분수로', description: '2 1/3을 가분수로 나타내세요', problem_type: 'calculation', difficulty_level: 'medium', points: 15, solution: '7/3' },
  { title: '분수 곱셈 기초', description: '1/2 × 1/3 = ?', problem_type: 'calculation', difficulty_level: 'hard', points: 20, solution: '1/6' },
  { title: '분수 나눗셈 기초', description: '1/2 ÷ 1/4 = ?', problem_type: 'calculation', difficulty_level: 'hard', points: 25, solution: '2' },
  { title: '소수의 의미', description: '0.5는 분수로 어떻게 표현하나요?', problem_type: 'multiple_choice', difficulty_level: 'easy', points: 10, solution: '1/2' },
  { title: '소수 덧셈', description: '0.3 + 0.5 = ?', problem_type: 'calculation', difficulty_level: 'medium', points: 15, solution: '0.8' },
];

const insertProblem = db.prepare(`
  INSERT INTO problems (title, description, problem_type, difficulty_level, points, solution, hints)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertProblems = db.transaction((items) => {
  for (const item of items) {
    insertProblem.run(
      item.title,
      item.description,
      item.problem_type,
      item.difficulty_level,
      item.points,
      item.solution || null,
      item.hints || null
    );
  }
});

insertProblems(problems);
console.log(`✅ Inserted ${problems.length} problems`);

// Concept-Problem Mappings
const mappings = [
  { concept_id: 1, problem_id: 1, relevance_score: 1.0, is_primary: 1, mapping_type: 'direct' },
  { concept_id: 1, problem_id: 2, relevance_score: 1.0, is_primary: 1, mapping_type: 'direct' },
  { concept_id: 2, problem_id: 3, relevance_score: 1.0, is_primary: 1, mapping_type: 'direct' },
  { concept_id: 2, problem_id: 4, relevance_score: 1.0, is_primary: 1, mapping_type: 'direct' },
  { concept_id: 3, problem_id: 5, relevance_score: 1.0, is_primary: 1, mapping_type: 'direct' },
  { concept_id: 3, problem_id: 6, relevance_score: 1.0, is_primary: 1, mapping_type: 'direct' },
  { concept_id: 4, problem_id: 7, relevance_score: 1.0, is_primary: 1, mapping_type: 'direct' },
  { concept_id: 4, problem_id: 8, relevance_score: 1.0, is_primary: 1, mapping_type: 'direct' },
  { concept_id: 5, problem_id: 9, relevance_score: 1.0, is_primary: 1, mapping_type: 'direct' },
  { concept_id: 5, problem_id: 10, relevance_score: 1.0, is_primary: 1, mapping_type: 'direct' },
  { concept_id: 6, problem_id: 11, relevance_score: 1.0, is_primary: 1, mapping_type: 'direct' },
  { concept_id: 7, problem_id: 12, relevance_score: 1.0, is_primary: 1, mapping_type: 'direct' },
  { concept_id: 8, problem_id: 13, relevance_score: 1.0, is_primary: 1, mapping_type: 'direct' },
  { concept_id: 9, problem_id: 14, relevance_score: 1.0, is_primary: 1, mapping_type: 'direct' },
  { concept_id: 10, problem_id: 15, relevance_score: 1.0, is_primary: 1, mapping_type: 'direct' },
  // Prerequisites
  { concept_id: 2, problem_id: 1, relevance_score: 0.8, is_primary: 0, mapping_type: 'prerequisite' },
  { concept_id: 3, problem_id: 1, relevance_score: 0.8, is_primary: 0, mapping_type: 'prerequisite' },
  { concept_id: 4, problem_id: 3, relevance_score: 0.7, is_primary: 0, mapping_type: 'related' },
  { concept_id: 4, problem_id: 5, relevance_score: 0.7, is_primary: 0, mapping_type: 'related' },
];

const insertMapping = db.prepare(`
  INSERT INTO concept_problem_mappings (concept_id, problem_id, relevance_score, is_primary, mapping_type)
  VALUES (?, ?, ?, ?, ?)
`);

const insertMappings = db.transaction((items) => {
  for (const item of items) {
    insertMapping.run(
      item.concept_id,
      item.problem_id,
      item.relevance_score,
      item.is_primary,
      item.mapping_type
    );
  }
});

insertMappings(mappings);
console.log(`✅ Inserted ${mappings.length} concept-problem mappings`);

// Concept Prerequisites
const prerequisites = [
  { concept_id: 2, prerequisite_id: 1, importance: 'required' },
  { concept_id: 3, prerequisite_id: 1, importance: 'required' },
  { concept_id: 4, prerequisite_id: 2, importance: 'recommended' },
  { concept_id: 4, prerequisite_id: 3, importance: 'recommended' },
  { concept_id: 5, prerequisite_id: 1, importance: 'required' },
  { concept_id: 7, prerequisite_id: 2, importance: 'required' },
  { concept_id: 7, prerequisite_id: 5, importance: 'recommended' },
  { concept_id: 8, prerequisite_id: 7, importance: 'required' },
  { concept_id: 10, prerequisite_id: 9, importance: 'required' },
];

const insertPrereq = db.prepare(`
  INSERT INTO concept_prerequisites (concept_id, prerequisite_id, importance)
  VALUES (?, ?, ?)
`);

const insertPrereqs = db.transaction((items) => {
  for (const item of items) {
    insertPrereq.run(item.concept_id, item.prerequisite_id, item.importance);
  }
});

insertPrereqs(prerequisites);
console.log(`✅ Inserted ${prerequisites.length} concept prerequisites`);

// Sample students
const students = [
  { name: '김철수', email: 'chulsoo@example.com', grade_level: '4학년', learning_style: 'visual' },
  { name: '이영희', email: 'younghee@example.com', grade_level: '4학년', learning_style: 'kinesthetic' },
  { name: '박민수', email: 'minsu@example.com', grade_level: '5학년', learning_style: 'auditory' },
  { name: '최지현', email: 'jihyun@example.com', grade_level: '3학년', learning_style: 'visual' },
];

const insertStudent = db.prepare(`
  INSERT INTO students (name, email, grade_level, learning_style)
  VALUES (?, ?, ?, ?)
`);

const insertStudents = db.transaction((items) => {
  for (const item of items) {
    insertStudent.run(item.name, item.email, item.grade_level, item.learning_style);
  }
});

insertStudents(students);
console.log(`✅ Inserted ${students.length} students`);

// Sample student progress (for testing recommendations)
const progressData = [
  // 김철수: 분수 기본은 잘함, 덧셈에 어려움
  { student_id: 1, problem_id: 1, concept_id: 1, attempts: 2, correct_attempts: 2, best_score: 100, status: 'mastered' },
  { student_id: 1, problem_id: 2, concept_id: 1, attempts: 1, correct_attempts: 1, best_score: 100, status: 'mastered' },
  { student_id: 1, problem_id: 3, concept_id: 2, attempts: 4, correct_attempts: 1, best_score: 60, status: 'in_progress' },
  { student_id: 1, problem_id: 4, concept_id: 2, attempts: 3, correct_attempts: 0, best_score: 40, status: 'in_progress' },

  // 이영희: 전반적으로 우수
  { student_id: 2, problem_id: 1, concept_id: 1, attempts: 1, correct_attempts: 1, best_score: 100, status: 'mastered' },
  { student_id: 2, problem_id: 3, concept_id: 2, attempts: 1, correct_attempts: 1, best_score: 100, status: 'mastered' },
  { student_id: 2, problem_id: 5, concept_id: 3, attempts: 2, correct_attempts: 2, best_score: 95, status: 'mastered' },
  { student_id: 2, problem_id: 7, concept_id: 4, attempts: 2, correct_attempts: 1, best_score: 80, status: 'completed' },

  // 박민수: 중간 수준
  { student_id: 3, problem_id: 1, concept_id: 1, attempts: 2, correct_attempts: 1, best_score: 80, status: 'completed' },
  { student_id: 3, problem_id: 3, concept_id: 2, attempts: 3, correct_attempts: 2, best_score: 75, status: 'completed' },
  { student_id: 3, problem_id: 9, concept_id: 5, attempts: 2, correct_attempts: 0, best_score: 50, status: 'in_progress' },

  // 최지현: 초급 단계
  { student_id: 4, problem_id: 1, concept_id: 1, attempts: 3, correct_attempts: 1, best_score: 70, status: 'in_progress' },
  { student_id: 4, problem_id: 2, concept_id: 1, attempts: 2, correct_attempts: 0, best_score: 45, status: 'in_progress' },
];

const insertProgress = db.prepare(`
  INSERT INTO student_progress (
    student_id, problem_id, concept_id, attempts, correct_attempts,
    best_score, status, last_attempt_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

const insertProgressData = db.transaction((items) => {
  for (const item of items) {
    insertProgress.run(
      item.student_id,
      item.problem_id,
      item.concept_id,
      item.attempts,
      item.correct_attempts,
      item.best_score,
      item.status
    );
  }
});

insertProgressData(progressData);
console.log(`✅ Inserted ${progressData.length} student progress records`);

console.log('\n✅ Database seeding completed successfully!\n');

db.close();

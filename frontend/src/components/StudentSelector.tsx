import { useState } from 'react';
import { api, Student } from '../api/client';
import './StudentSelector.css';

interface Props {
  onStudentSelected: (student: Student) => void;
}

export default function StudentSelector({ onStudentSelected }: Props) {
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await api.createStudent({
        name: name.trim(),
        grade_level: gradeLevel.trim() || undefined,
      });

      onStudentSelected(response.data);
    } catch (err: any) {
      console.error('Failed to create student:', err);
      setError('학생 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-selector card">
      <h2>학생 정보를 입력하세요</h2>
      <p className="description">
        학습을 시작하기 전에 학생 정보를 등록해주세요.
      </p>

      <form onSubmit={handleSubmit} className="student-form">
        <div className="form-group">
          <label htmlFor="name">이름 *</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="grade">학년 (선택)</label>
          <input
            id="grade"
            type="text"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            placeholder="예: 3학년, 중학교 1학년"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? '등록 중...' : '학습 시작하기'}
        </button>
      </form>
    </div>
  );
}

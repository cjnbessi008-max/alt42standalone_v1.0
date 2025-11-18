import React from 'react';
import axios from 'axios';
import SubmissionForm from './components/SubmissionForm';
import { SubmissionResponse } from './types';
import './App.css';

// API 기본 URL 설정
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  // 서버로 제출하는 함수
  const handleSubmit = async (answer: string): Promise<SubmissionResponse> => {
    try {
      const response = await axios.post<SubmissionResponse>(
        `${API_BASE_URL}/api/submit`,
        {
          answer,
          problem_id: null,
          student_id: null
        }
      );

      return response.data;
    } catch (error) {
      console.error('제출 오류:', error);

      // 에러 발생 시 기본 응답 반환
      return {
        success: false,
        validationResult: {
          isValid: false,
          errors: [
            {
              field: 'answer',
              message: '서버 연결에 실패했습니다. 백엔드 서버가 실행 중인지 확인해주세요.',
              type: 'general'
            }
          ]
        },
        message: '✗ 제출에 실패했습니다. 서버 연결을 확인해주세요.'
      };
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎓 답안 제출 검증 시스템</h1>
        <p>수학 답안을 입력하고 실시간으로 검증받으세요</p>
      </header>

      <main>
        <SubmissionForm onSubmit={handleSubmit} />
      </main>

      <footer className="App-footer">
        <p>KAIST Touch Math Academy - AI Education System</p>
      </footer>
    </div>
  );
}

export default App;

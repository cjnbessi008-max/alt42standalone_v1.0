import React, { useState } from 'react';
import { BiasAnalysisService } from '../services/api';
import './Analysis.css';

const DataImport: React.FC = () => {
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [sessionFile, setSessionFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleStudentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStudentFile(e.target.files[0]);
    }
  };

  const handleSessionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSessionFile(e.target.files[0]);
    }
  };

  const uploadStudents = async () => {
    if (!studentFile) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await BiasAnalysisService.importCSV(studentFile, 'students');
      setMessage({
        type: 'success',
        text: `✅ Successfully imported ${result.imported} students. ${result.errors?.length > 0 ? `Errors: ${result.errors.length}` : ''}`
      });
      setStudentFile(null);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `❌ Import failed: ${error.response?.data?.detail || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadSessions = async () => {
    if (!sessionFile) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await BiasAnalysisService.importCSV(sessionFile, 'sessions');
      setMessage({
        type: 'success',
        text: `✅ Successfully imported ${result.imported} sessions. ${result.errors?.length > 0 ? `Errors: ${result.errors.length}` : ''}`
      });
      setSessionFile(null);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `❌ Import failed: ${error.response?.data?.detail || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analysis-container">
      <h2>📥 Data Import</h2>
      <p className="description">
        Import student and usage session data from CSV files.
      </p>

      {message && (
        <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
          {message.text}
        </div>
      )}

      <div className="import-section">
        <h3>Import Students</h3>
        <p>CSV Format: student_id, name, grade_level, performance_level, gender</p>
        <div className="file-input-wrapper">
          <label className="file-input-label">
            {studentFile ? studentFile.name : 'Choose Students CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleStudentFileChange}
            />
          </label>
          <button
            className="upload-btn"
            onClick={uploadStudents}
            disabled={loading || !studentFile}
          >
            Upload Students
          </button>
        </div>
      </div>

      <div className="import-section">
        <h3>Import Usage Sessions</h3>
        <p>CSV Format: student_id, tool_name, session_start, session_end, duration_seconds, success_rate, context</p>
        <div className="file-input-wrapper">
          <label className="file-input-label">
            {sessionFile ? sessionFile.name : 'Choose Sessions CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleSessionFileChange}
            />
          </label>
          <button
            className="upload-btn"
            onClick={uploadSessions}
            disabled={loading || !sessionFile}
          >
            Upload Sessions
          </button>
        </div>
      </div>

      <div className="import-section">
        <h3>📝 Sample Data</h3>
        <p>
          The system comes with sample concept tools pre-loaded (FractionVisualizer, NumberLine, etc.).
          Import student and session data to begin analysis.
        </p>
      </div>
    </div>
  );
};

export default DataImport;

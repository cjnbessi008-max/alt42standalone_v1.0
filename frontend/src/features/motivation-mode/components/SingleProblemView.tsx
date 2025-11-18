/**
 * Single Problem View Component
 *
 * Displays one problem at a time with minimal distractions
 */

import React, { useState } from 'react';
import { Box, Button, Paper, Typography, CircularProgress } from '@mui/material';
import { Problem } from '../types/motivationMode.types';

interface SingleProblemViewProps {
  problem: Problem;
  onSubmit: (answer: any) => void;
  isLoading?: boolean;
}

export const SingleProblemView: React.FC<SingleProblemViewProps> = ({
  problem,
  onSubmit,
  isLoading = false,
}) => {
  const [answer, setAnswer] = useState<any>(null);

  const handleSubmit = () => {
    if (answer !== null) {
      onSubmit(answer);
      setAnswer(null);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 4,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 800,
          width: '100%',
          padding: 6,
          backgroundColor: '#ffffff',
          borderRadius: 3,
          border: '1px solid #e9ecef',
        }}
      >
        {/* Problem Content */}
        <Box sx={{ marginBottom: 4 }}>
          <Typography
            variant="h5"
            sx={{
              fontSize: 20,
              lineHeight: 1.6,
              color: '#1f2937',
              marginBottom: 3,
            }}
          >
            {problem.problemData?.question || '문제를 불러오는 중...'}
          </Typography>

          {/* Interactive Element or Form */}
          <Box sx={{ marginTop: 3 }}>
            {problem.interactionType === 'form' && (
              <ProblemForm
                problemData={problem.problemData}
                onAnswerChange={setAnswer}
                currentAnswer={answer}
              />
            )}
            {/* Add other interaction types as needed */}
          </Box>
        </Box>

        {/* Submit Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={isLoading || answer === null}
            sx={{
              minWidth: 200,
              height: 48,
              fontSize: 16,
              fontWeight: 600,
              backgroundColor: '#6366f1',
              '&:hover': {
                backgroundColor: '#4f46e5',
              },
              '&:disabled': {
                backgroundColor: '#e9ecef',
                color: '#adb5bd',
              },
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              '제출하기'
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

/**
 * Problem Form Component (example for simple input)
 */
interface ProblemFormProps {
  problemData: any;
  onAnswerChange: (answer: any) => void;
  currentAnswer: any;
}

const ProblemForm: React.FC<ProblemFormProps> = ({
  problemData,
  onAnswerChange,
  currentAnswer,
}) => {
  return (
    <Box>
      <input
        type="text"
        value={currentAnswer || ''}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="답을 입력하세요"
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '18px',
          border: '2px solid #dee2e6',
          borderRadius: '8px',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#6366f1';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#dee2e6';
        }}
      />
    </Box>
  );
};

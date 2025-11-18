import React from 'react';
import { TextField, Box, Typography } from '@mui/material';
import type { Problem } from '../types';

interface AnswerInputProps {
  problem: Problem;
  answer: any;
  onChange: (answer: any) => void;
  disabled?: boolean;
}

const AnswerInput: React.FC<AnswerInputProps> = ({
  problem,
  answer,
  onChange,
  disabled = false,
}) => {
  const handleChange = (field: string, value: any) => {
    if (problem.problem_type === 'math') {
      // Determine if answer should be array or object based on problem
      if (field === 'solutions' || field === 'array') {
        // Parse comma-separated values into array
        const values = value.split(',').map((v: string) => {
          const trimmed = v.trim();
          const num = parseFloat(trimmed);
          return isNaN(num) ? trimmed : num;
        }).filter((v: any) => v !== '');
        onChange(values);
      } else if (field === 'x' || field === 'y') {
        // System of equations
        onChange({ ...answer, [field]: value });
      } else {
        // Single value
        const num = parseFloat(value);
        onChange(isNaN(num) ? value : num);
      }
    } else {
      onChange(value);
    }
  };

  const renderMathInput = () => {
    // Determine input type based on problem title/description
    const title = problem.title.toLowerCase();
    const desc = problem.description.toLowerCase();

    if (title.includes('연립') || desc.includes('연립')) {
      // System of equations - needs x and y
      return (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="x 값"
            type="number"
            fullWidth
            value={answer?.x || ''}
            onChange={(e) => handleChange('x', e.target.value)}
            disabled={disabled}
            helperText="x의 값을 입력하세요"
          />
          <TextField
            label="y 값"
            type="number"
            fullWidth
            value={answer?.y || ''}
            onChange={(e) => handleChange('y', e.target.value)}
            disabled={disabled}
            helperText="y의 값을 입력하세요"
          />
        </Box>
      );
    } else if (title.includes('이차방정식')) {
      // Quadratic equation - needs array of solutions
      const displayValue = Array.isArray(answer)
        ? answer.join(', ')
        : answer?.solutions
        ? answer.solutions.join(', ')
        : '';

      return (
        <TextField
          label="해 (쉼표로 구분)"
          fullWidth
          value={displayValue}
          onChange={(e) => handleChange('solutions', e.target.value)}
          disabled={disabled}
          helperText="예: 2, 3 (쉼표로 구분하여 입력)"
          placeholder="2, 3"
        />
      );
    } else {
      // Single value (e.g., Pythagorean)
      return (
        <TextField
          label="답"
          type="number"
          fullWidth
          value={typeof answer === 'number' ? answer : answer?.answer || ''}
          onChange={(e) => handleChange('single', e.target.value)}
          disabled={disabled}
          helperText="답을 입력하세요"
        />
      );
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        답안 입력
      </Typography>
      {problem.problem_type === 'math' && renderMathInput()}
      {problem.problem_type === 'text' && (
        <TextField
          label="답"
          fullWidth
          multiline
          rows={4}
          value={answer || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      )}
    </Box>
  );
};

export default AnswerInput;

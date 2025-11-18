import { Box, Typography, Paper, Chip } from '@mui/material';
import { Problem, FractionProblemData } from '../types';
import FractionVisualizer from './FractionVisualizer';

interface ProblemDisplayProps {
  problem: Problem;
}

const ProblemDisplay = ({ problem }: ProblemDisplayProps) => {
  const problemData = problem.problem_data as FractionProblemData;

  const getOperationSymbol = (operation: string): string => {
    const symbols: Record<string, string> = {
      add: '+',
      subtract: '-',
      multiply: '×',
      divide: '÷',
    };
    return symbols[operation] || operation;
  };

  const getOperationText = (operation: string): string => {
    const texts: Record<string, string> = {
      add: '더하기',
      subtract: '빼기',
      multiply: '곱하기',
      divide: '나누기',
      simplify: '간단히 하기',
      identify: '확인하기',
    };
    return texts[operation] || operation;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, 'success' | 'warning' | 'error'> = {
      easy: 'success',
      medium: 'warning',
      hard: 'error',
    };
    return colors[difficulty] || 'default';
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          분수 문제
        </Typography>
        <Chip label={problem.difficulty} color={getDifficultyColor(problem.difficulty)} />
      </Box>

      <Typography variant="h6" gutterBottom color="text.secondary">
        {getOperationText(problemData.operation)}
      </Typography>

      <Box display="flex" alignItems="center" justifyContent="center" gap={3} my={4}>
        {/* First fraction */}
        <Box>
          <FractionVisualizer
            fraction={{
              numerator: problemData.numerator1,
              denominator: problemData.denominator1,
            }}
            visualType={problem.visual_type as any}
            size={150}
          />
          <Typography variant="h4" textAlign="center" mt={2}>
            {problemData.numerator1}/{problemData.denominator1}
          </Typography>
        </Box>

        {/* Operation symbol */}
        {problemData.operation !== 'simplify' && problemData.operation !== 'identify' && (
          <>
            <Typography variant="h2" color="primary">
              {getOperationSymbol(problemData.operation)}
            </Typography>

            {/* Second fraction */}
            <Box>
              <FractionVisualizer
                fraction={{
                  numerator: problemData.numerator2 || 0,
                  denominator: problemData.denominator2 || 1,
                }}
                visualType={problem.visual_type as any}
                size={150}
              />
              <Typography variant="h4" textAlign="center" mt={2}>
                {problemData.numerator2}/{problemData.denominator2}
              </Typography>
            </Box>
          </>
        )}

        {/* Equals sign */}
        <Typography variant="h2" color="primary">
          =
        </Typography>

        {/* Question mark */}
        <Box>
          <Paper
            elevation={0}
            sx={{
              width: 150,
              height: 150,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
            }}
          >
            <Typography variant="h1" color="primary">
              ?
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Paper>
  );
};

export default ProblemDisplay;

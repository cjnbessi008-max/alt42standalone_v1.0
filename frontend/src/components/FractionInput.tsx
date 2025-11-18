import { useState, useEffect } from 'react';
import { Box, TextField, Typography, Paper } from '@mui/material';
import { Fraction } from '../types';

interface FractionInputProps {
  value: Fraction | null;
  onChange: (fraction: Fraction) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

const FractionInput = ({ value, onChange, disabled, error, helperText }: FractionInputProps) => {
  const [numerator, setNumerator] = useState<string>(value?.numerator?.toString() || '');
  const [denominator, setDenominator] = useState<string>(value?.denominator?.toString() || '');

  useEffect(() => {
    if (value) {
      setNumerator(value.numerator.toString());
      setDenominator(value.denominator.toString());
    }
  }, [value]);

  const handleNumeratorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNumerator(val);

    const num = parseInt(val);
    const den = parseInt(denominator);

    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      onChange({ numerator: num, denominator: den });
    }
  };

  const handleDenominatorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDenominator(val);

    const num = parseInt(numerator);
    const den = parseInt(val);

    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      onChange({ numerator: num, denominator: den });
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        답을 입력하세요
      </Typography>
      <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
        <TextField
          label="분자"
          type="number"
          value={numerator}
          onChange={handleNumeratorChange}
          disabled={disabled}
          error={error}
          sx={{ width: 120 }}
          inputProps={{
            style: { textAlign: 'center', fontSize: '1.5rem' },
          }}
        />
        <Typography variant="h4">/</Typography>
        <TextField
          label="분모"
          type="number"
          value={denominator}
          onChange={handleDenominatorChange}
          disabled={disabled}
          error={error}
          sx={{ width: 120 }}
          inputProps={{
            style: { textAlign: 'center', fontSize: '1.5rem' },
          }}
        />
      </Box>
      {helperText && (
        <Typography
          variant="body2"
          color={error ? 'error' : 'textSecondary'}
          sx={{ mt: 1, textAlign: 'center' }}
        >
          {helperText}
        </Typography>
      )}
    </Paper>
  );
};

export default FractionInput;

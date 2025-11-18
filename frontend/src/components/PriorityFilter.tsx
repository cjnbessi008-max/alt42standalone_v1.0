import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  SelectChangeEvent,
} from '@mui/material';
import {
  Star as StarIcon,
  Flag as FlagIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface PriorityFilterProps {
  priority: string;
  difficulty: string;
  subject: string;
  sort: string;
  onPriorityChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

export const PriorityFilter: React.FC<PriorityFilterProps> = ({
  priority,
  difficulty,
  subject,
  sort,
  onPriorityChange,
  onDifficultyChange,
  onSubjectChange,
  onSortChange,
}) => {
  const handlePriorityChange = (event: SelectChangeEvent) => {
    onPriorityChange(event.target.value);
  };

  const handleDifficultyChange = (event: SelectChangeEvent) => {
    onDifficultyChange(event.target.value);
  };

  const handleSubjectChange = (event: SelectChangeEvent) => {
    onSubjectChange(event.target.value);
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    onSortChange(event.target.value);
  };

  const activeFiltersCount = [priority, difficulty, subject].filter(f => f !== 'all').length;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>우선순위</InputLabel>
          <Select value={priority} onChange={handlePriorityChange} label="우선순위">
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="important">
              <StarIcon sx={{ mr: 1, fontSize: 18, color: '#ffa726' }} />⭐ 중요
            </MenuItem>
            <MenuItem value="solve_first">
              <FlagIcon sx={{ mr: 1, fontSize: 18, color: '#ef5350' }} />🚩 먼저 풀기
            </MenuItem>
            <MenuItem value="review">
              <RefreshIcon sx={{ mr: 1, fontSize: 18, color: '#42a5f5' }} />📌 복습 필요
            </MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>난이도</InputLabel>
          <Select value={difficulty} onChange={handleDifficultyChange} label="난이도">
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="easy">쉬움</MenuItem>
            <MenuItem value="medium">보통</MenuItem>
            <MenuItem value="hard">어려움</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>과목</InputLabel>
          <Select value={subject} onChange={handleSubjectChange} label="과목">
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="mathematics">수학</MenuItem>
            <MenuItem value="english">영어</MenuItem>
            <MenuItem value="science">과학</MenuItem>
            <MenuItem value="history">역사</MenuItem>
            <MenuItem value="programming">프로그래밍</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>정렬</InputLabel>
          <Select value={sort} onChange={handleSortChange} label="정렬">
            <MenuItem value="recent">최신순</MenuItem>
            <MenuItem value="priority">우선순위순</MenuItem>
            <MenuItem value="difficulty">난이도순</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {activeFiltersCount > 0 && (
        <Box>
          <Chip
            label={`${activeFiltersCount}개 필터 적용 중`}
            color="primary"
            size="small"
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  );
};

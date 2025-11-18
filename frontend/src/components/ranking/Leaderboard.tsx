/**
 * Leaderboard Component
 * Displays student rankings in a competitive leaderboard format
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  styled
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon
} from '@mui/icons-material';

// ====================================================================
// TYPES
// ====================================================================

interface RankingData {
  student_id: string;
  student_name: string;
  grade_level: string;
  global_rank: number | null;
  grade_rank: number | null;
  total_points: number;
  modules_completed: number;
  problems_solved: number;
  accuracy_percentage: number;
  current_streak_days: number;
  achievements_earned: number;
  last_activity_at: string | null;
}

interface LeaderboardProps {
  currentStudentId?: string; // Highlight current student
  scope?: 'global' | 'grade' | 'module';
  scopeId?: string; // grade level or module ID
  limit?: number;
}

// ====================================================================
// STYLED COMPONENTS
// ====================================================================

const RankBadge = styled(Box)<{ rank: number }>(({ rank }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  fontWeight: 'bold',
  fontSize: '18px',
  background: rank === 1 ? 'linear-gradient(135deg, #FFD700, #FFA500)' :
              rank === 2 ? 'linear-gradient(135deg, #C0C0C0, #808080)' :
              rank === 3 ? 'linear-gradient(135deg, #CD7F32, #8B4513)' :
              '#f5f5f5',
  color: rank <= 3 ? '#fff' : '#666',
  boxShadow: rank <= 3 ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
}));

const HighlightedRow = styled(TableRow)<{ highlighted?: boolean }>(({ highlighted }) => ({
  backgroundColor: highlighted ? '#e3f2fd' : 'transparent',
  '&:hover': {
    backgroundColor: highlighted ? '#bbdefb' : '#f5f5f5'
  },
  transition: 'background-color 0.3s ease'
}));

const StatsChip = styled(Chip)({
  margin: '0 4px',
  fontWeight: 600
});

// ====================================================================
// MAIN COMPONENT
// ====================================================================

export const Leaderboard: React.FC<LeaderboardProps> = ({
  currentStudentId,
  scope = 'global',
  scopeId,
  limit = 50
}) => {
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(scope);
  const [selectedGrade, setSelectedGrade] = useState<string>(scopeId || '3');
  const [error, setError] = useState<string | null>(null);

  // ====================================================================
  // DATA FETCHING
  // ====================================================================

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, selectedGrade]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = '';

      if (activeTab === 'global') {
        endpoint = `/api/v1/leaderboard/global?limit=${limit}`;
      } else if (activeTab === 'grade') {
        endpoint = `/api/v1/leaderboard/grade/${selectedGrade}?limit=${limit}`;
      } else if (activeTab === 'module' && scopeId) {
        endpoint = `/api/v1/leaderboard/module/${scopeId}?limit=${limit}`;
      }

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setRankings(activeTab === 'module' ? data : data.rankings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // ====================================================================
  // RENDER HELPERS
  // ====================================================================

  const renderRankBadge = (rank: number | null) => {
    if (!rank) return <RankBadge rank={999}>-</RankBadge>;

    return (
      <RankBadge rank={rank}>
        {rank <= 3 && <TrophyIcon sx={{ fontSize: '20px', mr: 0.5 }} />}
        {rank}
      </RankBadge>
    );
  };

  const renderStreakBadge = (days: number) => {
    if (days === 0) return null;

    return (
      <Chip
        icon={<TrendingUpIcon />}
        label={`${days}일 연속`}
        size="small"
        color={days >= 7 ? 'success' : 'default'}
        sx={{ ml: 1 }}
      />
    );
  };

  const getAccuracyColor = (accuracy: number): 'success' | 'warning' | 'error' => {
    if (accuracy >= 85) return 'success';
    if (accuracy >= 70) return 'warning';
    return 'error';
  };

  // ====================================================================
  // RENDER
  // ====================================================================

  return (
    <Card elevation={3}>
      <CardContent>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            <TrophyIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#FFD700' }} />
            리더보드 (Leaderboard)
          </Typography>
        </Box>

        {/* Tabs for scope selection */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="전체 순위 (Global)" value="global" />
            <Tab label="학년별 순위 (Grade)" value="grade" />
            {scopeId && <Tab label="모듈 순위 (Module)" value="module" />}
          </Tabs>
        </Box>

        {/* Grade selector for grade tab */}
        {activeTab === 'grade' && (
          <Box sx={{ mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>학년 (Grade)</InputLabel>
              <Select
                value={selectedGrade}
                label="학년 (Grade)"
                onChange={(e) => setSelectedGrade(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((grade) => (
                  <MenuItem key={grade} value={grade.toString()}>
                    {grade}학년
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Loading state */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error state */}
        {error && (
          <Box sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
            <Typography>오류가 발생했습니다: {error}</Typography>
          </Box>
        )}

        {/* Leaderboard table */}
        {!loading && !error && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>순위 (Rank)</TableCell>
                  <TableCell>학생 (Student)</TableCell>
                  <TableCell align="center">학년 (Grade)</TableCell>
                  <TableCell align="center">포인트 (Points)</TableCell>
                  <TableCell align="center">완료 모듈 (Modules)</TableCell>
                  <TableCell align="center">정확도 (Accuracy)</TableCell>
                  <TableCell align="center">성취 (Achievements)</TableCell>
                  <TableCell align="center">연속 기록 (Streak)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rankings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        아직 순위 데이터가 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rankings.map((student) => (
                    <HighlightedRow
                      key={student.student_id}
                      highlighted={student.student_id === currentStudentId}
                    >
                      {/* Rank */}
                      <TableCell>
                        {renderRankBadge(
                          activeTab === 'grade' ? student.grade_rank : student.global_rank
                        )}
                      </TableCell>

                      {/* Student Name */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: '#1976d2' }}>
                            {student.student_name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography fontWeight="bold">
                              {student.student_name}
                            </Typography>
                            {student.student_id === currentStudentId && (
                              <Chip label="나" size="small" color="primary" sx={{ mt: 0.5 }} />
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Grade */}
                      <TableCell align="center">
                        <Typography>{student.grade_level}학년</Typography>
                      </TableCell>

                      {/* Points */}
                      <TableCell align="center">
                        <StatsChip
                          icon={<StarIcon />}
                          label={student.total_points.toLocaleString()}
                          color="warning"
                          size="small"
                        />
                      </TableCell>

                      {/* Modules Completed */}
                      <TableCell align="center">
                        <Typography fontWeight="bold">
                          {student.modules_completed}
                        </Typography>
                      </TableCell>

                      {/* Accuracy */}
                      <TableCell align="center">
                        <StatsChip
                          label={`${student.accuracy_percentage.toFixed(1)}%`}
                          color={getAccuracyColor(student.accuracy_percentage)}
                          size="small"
                        />
                      </TableCell>

                      {/* Achievements */}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <TrophyIcon sx={{ color: '#FFD700', mr: 0.5 }} />
                          <Typography fontWeight="bold">
                            {student.achievements_earned}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Streak */}
                      <TableCell align="center">
                        {student.current_streak_days > 0 ? (
                          renderStreakBadge(student.current_streak_days)
                        ) : (
                          <Typography color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                    </HighlightedRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Footer info */}
        {!loading && !error && rankings.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              총 {rankings.length}명의 학생 표시
              {activeTab === 'global' && ' • 전체 순위'}
              {activeTab === 'grade' && ` • ${selectedGrade}학년 순위`}
              {activeTab === 'module' && ' • 모듈별 순위'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;

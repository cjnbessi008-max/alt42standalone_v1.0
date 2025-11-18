import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Paper,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Dashboard as DashboardIcon } from '@mui/icons-material';
import { RuleForm } from './components/RuleForm';
import { RuleDashboard } from './components/RuleDashboard';
import { Rule, RuleFormData, ComplexityAnalysis } from './types/rule';

type TabValue = 'dashboard' | 'create';

function App() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [currentTab, setCurrentTab] = useState<TabValue>('dashboard');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleCreateRule = (data: RuleFormData, analysis: ComplexityAnalysis) => {
    const newRule: Rule = {
      id: crypto.randomUUID(),
      ...data,
      complexity: analysis,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setRules([newRule, ...rules]);
    setSnackbar({
      open: true,
      message: '규칙이 성공적으로 생성되었습니다!',
      severity: 'success',
    });
    setCurrentTab('dashboard');
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
    setSnackbar({
      open: true,
      message: '규칙이 삭제되었습니다.',
      severity: 'info',
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            LMS 규칙 복잡도 분석기
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            헷갈릴 만한 조건 자동 감지
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              value="dashboard"
              label="대시보드"
              icon={<DashboardIcon />}
              iconPosition="start"
            />
            <Tab
              value="create"
              label="새 규칙 추가"
              icon={<AddIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {currentTab === 'dashboard' && (
          <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                규칙 목록 ({rules.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCurrentTab('create')}
              >
                새 규칙 추가
              </Button>
            </Box>
            <RuleDashboard
              rules={rules}
              onDelete={handleDeleteRule}
            />
          </Box>
        )}

        {currentTab === 'create' && (
          <RuleForm onSubmit={handleCreateRule} />
        )}

        <Box sx={{ mt: 6, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            복잡도 평가 기준
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="primary">
                조건 개수
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 5개 이상: 높은 복잡도
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 10개 이상: 매우 높은 복잡도
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="primary">
                중첩 깊이
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 3레벨 이상: 높은 복잡도
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 5레벨 이상: 매우 높은 복잡도
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="primary">
                엔티티 수
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 4개 이상: 중간 복잡도
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 6개 이상: 높은 복잡도
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="primary">
                순환 참조
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 감지 시: 매우 높은 복잡도
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;

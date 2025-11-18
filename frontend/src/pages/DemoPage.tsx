import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  ButtonGroup,
  AppBar,
  Toolbar,
  Paper,
} from '@mui/material';
import { ProblemDisplay } from '@/components/ProblemDisplay';
import {
  allSampleProblems,
  sampleFractionProblem,
  sampleGeometryProblem,
  sampleEquationProblem,
} from '@/config/sampleProblems';
import { Problem } from '@/types';

/**
 * DemoPage - Interactive demonstration of the condition highlighting system
 */
export const DemoPage: React.FC = () => {
  const [selectedProblem, setSelectedProblem] = useState<Problem>(sampleFractionProblem);

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            교육 문제 조건 강조 시스템
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            KAIST Touch Math Academy
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Introduction */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            문제 조건 색상 강조 시스템
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            이 시스템은 교육용 문제의 조건들을 색깔별로 시각화하여 학생들이 문제를 더 쉽게 이해할 수 있도록 돕습니다.
            각 조건 유형은 고유한 색상으로 표시되어 구분이 쉽습니다.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            아래 버튼을 클릭하여 다양한 문제 유형을 확인해보세요.
          </Typography>
        </Paper>

        {/* Problem Selector */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <ButtonGroup variant="contained" size="large">
            <Button
              onClick={() => setSelectedProblem(sampleFractionProblem)}
              variant={selectedProblem.id === sampleFractionProblem.id ? 'contained' : 'outlined'}
            >
              분수 문제
            </Button>
            <Button
              onClick={() => setSelectedProblem(sampleGeometryProblem)}
              variant={selectedProblem.id === sampleGeometryProblem.id ? 'contained' : 'outlined'}
            >
              기하 문제
            </Button>
            <Button
              onClick={() => setSelectedProblem(sampleEquationProblem)}
              variant={selectedProblem.id === sampleEquationProblem.id ? 'contained' : 'outlined'}
            >
              방정식 문제
            </Button>
          </ButtonGroup>
        </Box>

        {/* Problem Display */}
        <ProblemDisplay problem={selectedProblem} showLegend={true} />

        {/* Footer Info */}
        <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            시스템 특징
          </Typography>
          <Box component="ul" sx={{ mt: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>색상 코딩:</strong> 조건 유형별로 다른 색상을 사용하여 시각적 구분
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>인터랙티브:</strong> 조건을 클릭하면 상세 설명 확인 가능
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>접근성:</strong> WCAG 2.1 AA 준수, 고대비 색상 사용
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              <strong>반응형:</strong> 모바일, 태블릿, 데스크톱 모두 지원
            </Typography>
            <Typography component="li" variant="body2">
              <strong>확장 가능:</strong> 다양한 문제 유형 추가 가능
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DemoPage;

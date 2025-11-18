/**
 * Learning Insights Panel Component
 * Displays AI-generated learning insights
 */

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import { apiService } from '../services/apiService';
import type { LearningInsight, InsightType } from '../../../shared/types';

interface LearningInsightsPanelProps {
  studentId: string;
}

export default function LearningInsightsPanel({ studentId }: LearningInsightsPanelProps) {
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, [studentId]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const data = await apiService.getLearningInsights(studentId);
      setInsights(data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (insightType: InsightType) => {
    const icons: Record<string, JSX.Element> = {
      pattern_detected: <TrendingUpIcon />,
      attention_warning: <WarningIcon />,
      strength_identified: <CheckCircleIcon />,
      improvement_opportunity: <LightbulbIcon />,
      milestone_achieved: <CheckCircleIcon />
    };
    return icons[insightType] || <InfoIcon />;
  };

  const getSeverityColor = (severity: string): "success" | "info" | "warning" | "error" => {
    const colors: Record<string, any> = {
      info: 'info',
      warning: 'warning',
      critical: 'error'
    };
    return colors[severity] || 'info';
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🎯 학습 인사이트
        </Typography>

        {insights.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              아직 인사이트가 없습니다. 학습을 계속하면 맞춤형 인사이트를 제공받을 수 있습니다.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {insights.map((insight, index) => (
              <Alert
                key={index}
                severity={getSeverityColor(insight.severity)}
                icon={getInsightIcon(insight.insightType)}
              >
                <AlertTitle>{insight.title}</AlertTitle>
                <Typography variant="body2" gutterBottom>
                  {insight.description}
                </Typography>

                {insight.actionable && insight.suggestedActions.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      추천 행동:
                    </Typography>
                    <List dense>
                      {insight.suggestedActions.map((action, actionIndex) => (
                        <ListItem key={actionIndex} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <span>•</span>
                          </ListItemIcon>
                          <ListItemText
                            primary={action}
                            primaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Alert>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

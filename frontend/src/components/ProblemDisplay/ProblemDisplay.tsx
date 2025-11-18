import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Grid,
  Chip,
  Alert,
} from '@mui/material';
import { Problem, Condition, ConditionType } from '@/types';
import { ConditionHighlighter } from '@/components/ConditionHighlighter';
import { conditionTypeLabels, colorScheme } from '@/config/colorScheme';

interface ProblemDisplayProps {
  problem: Problem;
  showLegend?: boolean;
}

/**
 * ProblemDisplay - Displays a complete problem with color-coded conditions
 */
export const ProblemDisplay: React.FC<ProblemDisplayProps> = ({
  problem,
  showLegend = true,
}) => {
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);

  const handleConditionClick = (condition: Condition) => {
    setSelectedCondition(condition);
  };

  // Group conditions by type
  const groupedConditions = problem.conditions.reduce((acc, condition) => {
    if (!acc[condition.type]) {
      acc[condition.type] = [];
    }
    acc[condition.type].push(condition);
    return acc;
  }, {} as Record<ConditionType, Condition[]>);

  return (
    <Card elevation={3} sx={{ maxWidth: 1200, margin: 'auto', mt: 3 }}>
      <CardContent>
        {/* Problem Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {problem.title}
          </Typography>
          <Chip
            label={problem.problemType.toUpperCase()}
            color="primary"
            size="small"
            sx={{ mb: 2 }}
          />
          <Typography variant="body1" color="text.secondary" paragraph>
            {problem.description}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Conditions Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            문제 조건
          </Typography>

          {/* Conditions by Type */}
          {Object.entries(groupedConditions).map(([type, conditions]) => (
            <Box key={type} sx={{ mb: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 500,
                  color: colorScheme[type as ConditionType].primary,
                  mb: 1,
                }}
              >
                {conditionTypeLabels[type as ConditionType]}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {conditions.map((condition) => (
                  <ConditionHighlighter
                    key={condition.id}
                    condition={condition}
                    onClick={handleConditionClick}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Box>

        {/* Selected Condition Details */}
        {selectedCondition && (
          <Alert
            severity="info"
            onClose={() => setSelectedCondition(null)}
            sx={{ mb: 3 }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              선택된 조건: {selectedCondition.text}
            </Typography>
            {selectedCondition.description && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {selectedCondition.description}
              </Typography>
            )}
          </Alert>
        )}

        {/* Legend */}
        {showLegend && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                색상 범례
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(conditionTypeLabels).map(([type, label]) => {
                  const colors = colorScheme[type as ConditionType];
                  return (
                    <Grid item xs={12} sm={6} md={4} key={type}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1.5,
                          borderLeft: `4px solid ${colors.border}`,
                          backgroundColor: colors.background,
                          borderRadius: 1,
                        }}
                      >
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: colors.primary,
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {label}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProblemDisplay;

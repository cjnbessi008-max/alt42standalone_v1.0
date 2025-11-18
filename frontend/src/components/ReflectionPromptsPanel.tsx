/**
 * Reflection Prompts Panel
 * Display metacognitive reflection questions
 */

import { Card, CardContent, Typography, List, ListItem, ListItemText, Chip, Box, Button } from '@mui/material';
import {
  QuestionMark as QuestionMarkIcon,
  Help as HelpIcon,
  EmojiObjects as LightbulbIcon
} from '@mui/icons-material';
import type { ReflectionPrompt, ReflectionPromptType } from '../../../shared/types';

interface ReflectionPromptsPanelProps {
  prompts: ReflectionPrompt[];
  onPromptClick?: (promptId: string) => void;
}

export default function ReflectionPromptsPanel({ prompts, onPromptClick }: ReflectionPromptsPanelProps) {
  const getPriorityColor = (priority: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    const colors: Record<string, any> = {
      high: 'error',
      medium: 'warning',
      low: 'info'
    };
    return colors[priority] || 'default';
  };

  const getPromptIcon = (promptType: ReflectionPromptType) => {
    const icons: Record<string, JSX.Element> = {
      awareness: <QuestionMarkIcon />,
      understanding: <HelpIcon />,
      strategy: <LightbulbIcon />,
      progress: <QuestionMarkIcon />,
      engagement: <QuestionMarkIcon />
    };
    return icons[promptType] || <QuestionMarkIcon />;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          💭 생각해볼 질문들
        </Typography>

        {prompts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              현재 생각해볼 질문이 없습니다
            </Typography>
          </Box>
        ) : (
          <List>
            {prompts.map((prompt) => (
              <ListItem
                key={prompt.id}
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  mb: 1,
                  border: 1,
                  borderColor: 'divider',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => onPromptClick?.(prompt.id)}
              >
                <Box sx={{ mr: 2, color: 'primary.main' }}>
                  {getPromptIcon(prompt.promptType)}
                </Box>

                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {prompt.prompt}
                      </Typography>
                      <Chip
                        label={prompt.priority}
                        size="small"
                        color={getPriorityColor(prompt.priority)}
                      />
                    </Box>
                  }
                  secondary={
                    prompt.suggestedAction && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        💡 {prompt.suggestedAction}
                      </Typography>
                    )
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        {prompts.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button variant="outlined" size="small">
              더 많은 질문 보기
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

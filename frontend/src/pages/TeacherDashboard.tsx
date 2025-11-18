import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useParams } from 'react-router-dom';
import { ChecklistView } from '../components/ChecklistView';
import { checklistApi } from '../services/api';
import { Checklist } from '../types/checklist';

export const TeacherDashboard: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock teacher ID - in real app, get from auth context
  const teacherId = 'mock-teacher-id';

  useEffect(() => {
    if (moduleId) {
      loadChecklists();
    }
  }, [moduleId]);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checklistApi.getModuleChecklists(moduleId!);
      setChecklists(data);
    } catch (err) {
      setError('Failed to load checklists');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateChecklist = async () => {
    try {
      setLoading(true);
      const newChecklist = await checklistApi.generatePipelineChecklist(
        moduleId!,
        teacherId
      );
      setChecklists([...checklists, newChecklist]);
    } catch (err) {
      setError('Failed to generate checklist');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = async (itemId: string, isCompleted: boolean) => {
    try {
      await checklistApi.updateItemProgress({
        item_id: itemId,
        is_completed: isCompleted,
      });
      // Reload checklists to get updated progress
      await loadChecklists();
    } catch (err) {
      setError('Failed to update item');
      console.error(err);
    }
  };

  if (loading && checklists.length === 0) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h3">Module Generation Pipeline</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleGenerateChecklist}
          disabled={loading}
        >
          Generate Checklist
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Checklists */}
      {checklists.length === 0 ? (
        <Alert severity="info">
          No checklists found. Click "Generate Checklist" to create a new pipeline
          checklist for this module.
        </Alert>
      ) : (
        <Box>
          {checklists.map((checklist) => (
            <Box key={checklist.id} mb={4}>
              <ChecklistView
                checklist={checklist}
                onItemToggle={handleItemToggle}
              />
            </Box>
          ))}
        </Box>
      )}
    </Container>
  );
};

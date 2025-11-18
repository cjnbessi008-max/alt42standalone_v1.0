import React, { useEffect, useState } from 'react';
import {
  Container,
  CircularProgress,
  Box,
  Alert,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';
import { ChecklistView } from '../components/ChecklistView';
import { checklistApi } from '../services/api';
import { Checklist } from '../types/checklist';

export const StudentChecklistView: React.FC = () => {
  const { checklistId } = useParams<{ checklistId: string }>();
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (checklistId) {
      loadChecklist();
    }
  }, [checklistId]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checklistApi.getChecklist(checklistId!);
      setChecklist(data);
    } catch (err) {
      setError('Failed to load checklist');
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
      // Reload checklist to get updated progress
      await loadChecklist();
    } catch (err) {
      setError('Failed to update item');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!checklist) {
    return (
      <Container>
        <Alert severity="error">Checklist not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <ChecklistView
        checklist={checklist}
        onItemToggle={handleItemToggle}
      />
    </Container>
  );
};

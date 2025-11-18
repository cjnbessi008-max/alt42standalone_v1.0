import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import { useGraphStore } from '../../store/graphStore';

export const Header: React.FC = () => {
  const { graph, saveGraph, clearGraph } = useGraphStore();

  const handleSave = () => {
    saveGraph();
    alert('그래프가 저장되었습니다!');
  };

  const handleLoad = () => {
    const saved = localStorage.getItem('savedGraph');
    const savedText = localStorage.getItem('savedInputText');

    if (saved) {
      const { loadGraph, setInputText } = useGraphStore.getState();
      loadGraph(JSON.parse(saved));
      if (savedText) {
        setInputText(savedText);
      }
      alert('저장된 그래프를 불러왔습니다!');
    } else {
      alert('저장된 그래프가 없습니다.');
    }
  };

  const handleClear = () => {
    if (confirm('현재 그래프를 삭제하시겠습니까?')) {
      clearGraph();
    }
  };

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <AutoGraphIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          LMS 그래프 자동 스케치
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="그래프 저장">
            <span>
              <Button
                color="inherit"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={!graph}
              >
                저장
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="저장된 그래프 불러오기">
            <Button
              color="inherit"
              startIcon={<FolderOpenIcon />}
              onClick={handleLoad}
            >
              불러오기
            </Button>
          </Tooltip>

          <Tooltip title="그래프 삭제">
            <span>
              <IconButton
                color="inherit"
                onClick={handleClear}
                disabled={!graph}
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

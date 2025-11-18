import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { format } from 'date-fns';
import { incidentsApi } from '../services/api';
import type { Incident } from '../types';
import { IncidentType, IncidentSeverity } from '../types';

export default function IncidentsList() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');

  useEffect(() => {
    loadIncidents();
  }, [filterType, filterSeverity]);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (filterType) params.incident_type = filterType;
      if (filterSeverity) params.severity = filterSeverity;

      const data = await incidentsApi.getIncidents(params);
      setIncidents(data);
    } catch (error) {
      console.error('Failed to load incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: IncidentSeverity): 'info' | 'warning' | 'error' => {
    switch (severity) {
      case IncidentSeverity.INFO:
        return 'info';
      case IncidentSeverity.WARNING:
        return 'warning';
      case IncidentSeverity.ERROR:
      case IncidentSeverity.CRITICAL:
        return 'error';
      default:
        return 'info';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        사고 목록
      </Typography>

      {/* 필터 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>사고 유형</InputLabel>
              <Select
                value={filterType}
                label="사고 유형"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="">전체</MenuItem>
                {Object.values(IncidentType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>심각도</InputLabel>
              <Select
                value={filterSeverity}
                label="심각도"
                onChange={(e) => setFilterSeverity(e.target.value)}
              >
                <MenuItem value="">전체</MenuItem>
                {Object.values(IncidentSeverity).map((severity) => (
                  <MenuItem key={severity} value={severity}>
                    {severity}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>유형</TableCell>
              <TableCell>심각도</TableCell>
              <TableCell>제목</TableCell>
              <TableCell>학생 ID</TableCell>
              <TableCell>과정 ID</TableCell>
              <TableCell>발생 시각</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  사고가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              incidents.map((incident) => (
                <TableRow key={incident.id} hover>
                  <TableCell>{incident.id}</TableCell>
                  <TableCell>
                    <Chip label={incident.type} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={incident.severity}
                      color={getSeverityColor(incident.severity)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{incident.title}</TableCell>
                  <TableCell>{incident.student_id || '-'}</TableCell>
                  <TableCell>{incident.course_id || '-'}</TableCell>
                  <TableCell>
                    {format(new Date(incident.created_at), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

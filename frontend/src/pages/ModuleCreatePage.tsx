import { Box, Typography, Paper, TextField, Button } from '@mui/material'
import { useState } from 'react'

export default function ModuleCreatePage() {
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Creating module:', description)
    // TODO: Implement API call
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Create New Module
      </Typography>
      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Describe your educational module"
            placeholder="예: 3학년 학생들을 위한 분수 학습 모듈을 만들어주세요..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!description.trim()}
          >
            Generate Module
          </Button>
        </form>
      </Paper>
    </Box>
  )
}

import { Container, Typography } from '@mui/material';

export default function ProblemsPage() {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Problems
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Browse and solve reflection problems
      </Typography>
      {/* TODO: Implement problems list */}
    </Container>
  );
}

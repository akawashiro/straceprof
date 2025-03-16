import { Paper, Typography, Divider } from '@mui/material';

interface NoProcessesFoundProps {
  fileContent: string;
}

const NoProcessesFound = ({ fileContent }: NoProcessesFoundProps) => {
  return (
    <Paper
      elevation={3}
      sx={{
        mt: 3,
        p: 2,
        maxHeight: '300px',
        overflow: 'auto',
        textAlign: 'left',
      }}
    >
      <Typography variant="h6" gutterBottom>
        File Content (No processes found):
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Typography
        component="pre"
        sx={{
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {fileContent}
      </Typography>
    </Paper>
  );
};

export default NoProcessesFound;

import { useState, useRef } from 'react';
import {
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Paper,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(content);
      };
      reader.readAsText(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3, textAlign: 'center' }}>
      <Typography variant="h3" component="h1" gutterBottom>
        straceprof
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Button
            variant="contained"
            startIcon={<UploadFileIcon />}
            onClick={handleUploadClick}
            sx={{ mb: 2 }}
          >
            Upload File
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {selectedFile && (
            <Box sx={{ mt: 3, textAlign: 'left' }}>
              <Typography variant="h6" gutterBottom>
                File Information:
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1">Name: {selectedFile.name}</Typography>
              <Typography variant="body1">
                Size: {(selectedFile.size / 1024).toFixed(2)} KB
              </Typography>
              <Typography variant="body1">
                Type: {selectedFile.type || 'Unknown'}
              </Typography>
            </Box>
          )}

          {fileContent && (
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
                File Content:
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
          )}
        </CardContent>
      </Card>

      <Typography variant="body2" color="text.secondary">
        straceprof - A profiling tool for strace
      </Typography>
    </Box>
  );
}

export default App;

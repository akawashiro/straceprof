import { useState, useRef, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Process, getProcessesFromLog } from './ProcessUtils';
import { NPM_INSTALL_LOG } from './NpmInstallLog';
import ProcessVisualizer from './ProcessVisualizer';
import ProcessTable from './ProcessTable';
import NoProcessesFound from './NoProcessesFound';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>(NPM_INSTALL_LOG);
  const [processes, setProcesses] = useState<Process[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse the default log on component mount
  useEffect(() => {
    try {
      const parsedProcesses = getProcessesFromLog(NPM_INSTALL_LOG);
      setProcesses(parsedProcesses);
    } catch (error) {
      console.error('Error parsing default log:', error);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(content);

        // Parse the strace log
        try {
          const parsedProcesses = getProcessesFromLog(content);
          setProcesses(parsedProcesses);
        } catch (error) {
          console.error('Error parsing strace log:', error);
        }
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

          {processes.length > 0 && <ProcessTable processes={processes} />}

          {fileContent && processes.length === 0 && (
            <NoProcessesFound fileContent={fileContent} />
          )}

          {processes.length > 0 && (
            <ProcessVisualizer
              processes={processes}
              title={
                selectedFile ? selectedFile.name : 'Sample Log Visualization'
              }
            />
          )}
        </CardContent>
      </Card>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        straceprof - A profiling tool for strace
      </Typography>
    </Box>
  );
}

export default App;

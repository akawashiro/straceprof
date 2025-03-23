import React, { useRef, useState, useEffect } from 'react';
import {
  Grid2,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  Container,
} from '@mui/material';
import { fetchLog } from './LogUtils';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { exampleLogs } from './LogExamples';

interface LogFileSelectorProps {
  selectedExample: string;
  onExampleChange: (event: SelectChangeEvent<string>) => void;
  onFileContentChange: (content: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setTitle: (title: string) => void;
}

const copyCommandToClipBoard = () => {
  navigator.clipboard.writeText(
    'strace --trace=execve,execveat,exit,exit_group --follow-forks --string-limit=1000 -ttt --output=straceprof.log <comamnd to profile>'
  );
};

/**
 * LogFileSelector component for selecting log files to visualize
 */
const LogFileSelector: React.FC<LogFileSelectorProps> = ({
  selectedExample,
  onExampleChange,
  onFileContentChange,
  isLoading,
  setIsLoading,
  setTitle,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);

    if (file) {
      // Set loading state to true when file is selected
      setIsLoading(true);

      // Update the title based on the file name
      setTitle(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileContentChange(content);
        setIsLoading(false);
      };

      reader.onerror = () => {
        console.error('Error reading file');
        setIsLoading(false);
      };

      reader.readAsText(file);
    }
  };

  // Fetch and parse logs when selected example changes
  useEffect(() => {
    if (selectedFile) {
      // If a file is uploaded, don't use example logs
      return;
    }

    if (!selectedExample) {
      // No example selected, clear content
      onFileContentChange('');
      setTitle('Sample Log Visualization');
      return;
    }

    // Fetch the selected example log
    setIsLoading(true);
    fetchLog(exampleLogs[selectedExample].path)
      .then((logContent) => {
        onFileContentChange(logContent);
        setTitle(`Example: ${exampleLogs[selectedExample].name}`);
      })
      .catch((error) => {
        console.error('Error fetching example log:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [
    selectedExample,
    selectedFile,
    onFileContentChange,
    setIsLoading,
    setTitle,
  ]);

  return (
    <Container maxWidth="lg">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <Grid2 container spacing={2}>
        <Grid2 size={6}>
          <Button
            variant="contained"
            startIcon={<ContentCopyIcon />}
            onClick={copyCommandToClipBoard}
          >
            Copy the command line snippet to take a profile log
          </Button>
        </Grid2>
        <Grid2 size={3}>
          <Button
            variant="contained"
            startIcon={<UploadFileIcon />}
            onClick={handleUploadClick}
            disabled={isLoading}
          >
            Upload log
          </Button>
        </Grid2>
        <Grid2 size={3}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="example-select-label">Load a sample Log</InputLabel>
            <Select
              labelId="example-select-label"
              value={selectedExample}
              onChange={onExampleChange}
              label="Load a sample log"
              disabled={isLoading}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 48 * 4.5,
                  },
                },
              }}
            >
              {Object.entries(exampleLogs).map(([key, { name }]) => (
                <MenuItem key={key} value={key}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid2>
      </Grid2>
    </Container>
  );
};

export default LogFileSelector;

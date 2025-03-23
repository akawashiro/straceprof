import React, { useRef } from 'react';
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
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { exampleLogs } from './LogExamples';

interface LogFileSelectorProps {
  selectedExample: string;
  onExampleChange: (event: SelectChangeEvent<string>) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
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
  onFileChange,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Container maxWidth="lg">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
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

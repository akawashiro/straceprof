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
import {
  Process,
  getProcessesFromLog,
  calculateThresholdToShowProcess,
} from './ProcessUtils';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { exampleLogs } from './LogExamples';

interface LogFileSelectorProps {
  setProcesses: (processes: Process[]) => void;
  setThresholdToShowProcess: (threshold: number) => void;
  setTimeRange: (timeRange: [number, number]) => void;
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
  setProcesses,
  setThresholdToShowProcess,
  setTimeRange,
  isLoading,
  setIsLoading,
  setTitle,
}) => {
  const [selectedExample, setSelectedExample] = useState<string>('npm_install');

  const handleExampleChange = (event: SelectChangeEvent<string>) => {
    setSelectedExample(event.target.value);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

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
        setFileContent(content);
        setIsLoading(false);
      };

      reader.onerror = () => {
        console.error('Error reading file');
        setIsLoading(false);
      };

      reader.readAsText(file);
    }
  };

  // Fetch logs when selected example changes
  useEffect(() => {
    if (selectedFile) {
      // If a file is uploaded, don't use example logs
      return;
    }

    if (!selectedExample) {
      // No example selected, clear content
      setFileContent('');
      setTitle('Sample Log Visualization');
      return;
    }

    // Fetch the selected example log
    setIsLoading(true);
    fetchLog(exampleLogs[selectedExample].path)
      .then((logContent) => {
        setFileContent(logContent);
        setTitle(`Example: ${exampleLogs[selectedExample].name}`);
      })
      .catch((error) => {
        console.error('Error fetching example log:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedExample, selectedFile, setIsLoading, setTitle]);

  // Process file content when it changes
  useEffect(() => {
    if (!fileContent) {
      // No content, clear processes
      setProcesses([]);
      return;
    }

    // Parse the strace log
    try {
      const parsedProcesses = getProcessesFromLog(fileContent);
      setProcesses(parsedProcesses);

      // Calculate and set the initial threshold
      const calculatedThreshold =
        calculateThresholdToShowProcess(parsedProcesses);
      setThresholdToShowProcess(calculatedThreshold);

      // Calculate and set the initial time range
      if (parsedProcesses.length > 0) {
        const minTime = Math.min(...parsedProcesses.map((p) => p.startTime));
        const maxTime = Math.max(...parsedProcesses.map((p) => p.endTime));
        // Use relative time range
        setTimeRange([0, maxTime - minTime]);
      }
    } catch (error) {
      console.error('Error parsing strace log:', error);
    }
  }, [fileContent, setProcesses, setThresholdToShowProcess, setTimeRange]);

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
              onChange={handleExampleChange}
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

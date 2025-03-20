import { useState, useRef, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  Divider,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Process, getProcessesFromLog } from './ProcessUtils';
import ProcessVisualizer from './ProcessVisualizer';
import ProcessTable from './ProcessTable';
import NoProcessesFound from './NoProcessesFound';
import { fetchLog } from './LogUtils';
import './App.css';

// Mapping of example names to their display names and log file paths
const exampleLogs: Record<string, { name: string; path: string }> = {
  npm_install: { name: 'NPM Install', path: 'npm_install.log' },
  linux_build: { name: 'Linux Build', path: 'linux_build.log' },
};

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedExample, setSelectedExample] = useState<string>('npm_install');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch and parse logs when selected example changes
  useEffect(() => {
    if (selectedFile) {
      // If a file is uploaded, don't use example logs
      return;
    }

    if (!selectedExample) {
      // No example selected, clear processes
      setProcesses([]);
      setFileContent('');
      return;
    }

    // Fetch the selected example log
    setIsLoading(true);
    fetchLog(exampleLogs[selectedExample].path)
      .then((logContent) => {
        setFileContent(logContent);
        const parsedProcesses = getProcessesFromLog(logContent);
        setProcesses(parsedProcesses);
      })
      .catch((error) => {
        console.error('Error fetching example log:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedExample, selectedFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);

    if (file) {
      // Clear selected example when a file is uploaded
      setSelectedExample('');

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

  const handleExampleChange = (event: SelectChangeEvent<string>) => {
    setSelectedExample(event.target.value);
    // Clear selected file when an example is selected
    setSelectedFile(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ width: '100%', height: '100%', textAlign: 'center' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          mb: 2,
        }}
      >
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="example-select-label">Example Logs</InputLabel>
          <Select
            labelId="example-select-label"
            value={selectedExample}
            onChange={handleExampleChange}
            label="Example Log"
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

        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={handleUploadClick}
        >
          Upload File
        </Button>
      </Box>
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

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && fileContent && processes.length === 0 && (
        <NoProcessesFound fileContent={fileContent} />
      )}

      {!isLoading && processes.length > 0 && (
        <ProcessVisualizer
          processes={processes}
          title={
            selectedFile
              ? selectedFile.name
              : selectedExample
                ? `${exampleLogs[selectedExample].name} Visualization`
                : 'Sample Log Visualization'
          }
        />
      )}

      <Accordion>
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon />}
          aria-controls="panel2-content"
          id="panel2-header"
        >
          <Typography component="span">Parsed Processes</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {processes.length > 0 && <ProcessTable processes={processes} />}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default App;

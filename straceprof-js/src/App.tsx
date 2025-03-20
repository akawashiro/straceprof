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
  Chip,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Process, getProcessesFromLog } from './ProcessUtils';
import NPM_INSTALL_LOG from './npm_install.log?raw';
import ProcessVisualizer from './ProcessVisualizer';
import ProcessTable from './ProcessTable';
import NoProcessesFound from './NoProcessesFound';
import LINUX_BUILD_LOG from './linux_build_log.txt?raw';
import './App.css';

// Mapping of example names to their display names and log data
const exampleLogs: Record<string, { name: string; data: string }> = {
  npm_install: { name: 'NPM Install', data: NPM_INSTALL_LOG },
  linux_build: { name: 'Linux Build', data: LINUX_BUILD_LOG },
};

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedExamples, setSelectedExamples] = useState<string[]>(['npm_install']);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse logs when selected examples change
  useEffect(() => {
    if (selectedFile) {
      // If a file is uploaded, don't use example logs
      return;
    }

    try {
      if (selectedExamples.length === 0) {
        // No examples selected, clear processes
        setProcesses([]);
        setFileContent('');
        return;
      }

      // Combine selected example logs
      const combinedLogContent = selectedExamples
        .map(example => exampleLogs[example].data)
        .join('\n');

      setFileContent(combinedLogContent);
      const parsedProcesses = getProcessesFromLog(combinedLogContent);
      setProcesses(parsedProcesses);
    } catch (error) {
      console.error('Error parsing example logs:', error);
    }
  }, [selectedExamples, selectedFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);

    if (file) {
      // Clear selected examples when a file is uploaded
      setSelectedExamples([]);

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

  const handleExampleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedExamples(typeof value === 'string' ? [value] : value);
    // Clear selected file when examples are selected
    setSelectedFile(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ width: '100%', height: '100%', textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="example-select-label">Example Logs</InputLabel>
          <Select
            labelId="example-select-label"
            multiple
            value={selectedExamples}
            onChange={handleExampleChange}
            input={<OutlinedInput label="Example Logs" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={exampleLogs[value].name} />
                ))}
              </Box>
            )}
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

      {fileContent && processes.length === 0 && (
        <NoProcessesFound fileContent={fileContent} />
      )}

      {processes.length > 0 && (
        <ProcessVisualizer
          processes={processes}
          title={
            selectedFile
              ? selectedFile.name
              : selectedExamples.length > 0
                ? `${selectedExamples.map(ex => exampleLogs[ex].name).join(' + ')} Visualization`
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

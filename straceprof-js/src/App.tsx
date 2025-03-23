import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, CircularProgress, Container } from '@mui/material';
import {
  Process,
  getProcessesFromLog,
  calculateThresholdToShowProcess,
} from './ProcessUtils';
import ProcessVisualizer from './ProcessVisualizer';
import ProcessController from './ProcessController';
import LogFileSelector from './LogFileSelector';
import { exampleLogs } from './LogExamples';
import { fetchLog } from './LogUtils';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedExample, setSelectedExample] = useState<string>('npm_install');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Canvas control state
  const [thresholdToShowProcess, setThresholdToShowProcess] =
    useState<number>(0);
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 0]);

  // Calculate global time range from all processes
  const globalTimeRange = useMemo(() => {
    if (processes.length === 0) return [0, 0] as [number, number];

    const minTime = Math.min(...processes.map((p) => p.startTime));
    const maxTime = Math.max(...processes.map((p) => p.endTime));

    // Use relative time: [0, maxTime - minTime] instead of [minTime, maxTime]
    return [0, maxTime - minTime] as [number, number];
  }, [processes]);

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
      // Set loading state to true when file is selected
      setIsLoading(true);

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

          // Calculate and set the initial threshold
          const calculatedThreshold =
            calculateThresholdToShowProcess(parsedProcesses);
          setThresholdToShowProcess(calculatedThreshold);

          // Calculate and set the initial time range
          if (parsedProcesses.length > 0) {
            const minTime = Math.min(
              ...parsedProcesses.map((p) => p.startTime)
            );
            const maxTime = Math.max(...parsedProcesses.map((p) => p.endTime));
            // Use relative time range
            setTimeRange([0, maxTime - minTime]);
          }
        } catch (error) {
          console.error('Error parsing strace log:', error);
        } finally {
          // Set loading state to false when processing is complete
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        console.error('Error reading file');
        setIsLoading(false);
      };

      reader.readAsText(file);
    }
  };

  // Handle process controller changes
  const handleThresholdChange = (value: number) => {
    setThresholdToShowProcess(value);
  };

  // Handle time range changes
  const handleTimeRangeChange = (value: [number, number]) => {
    setTimeRange(value);
  };

  // Filter processes based on both threshold and time range
  const filteredProcesses = useMemo(() => {
    if (processes.length === 0) return [];

    const minTime = Math.min(...processes.map((p) => p.startTime));

    return processes.filter(
      (p) =>
        p.endTime - p.startTime >= thresholdToShowProcess &&
        p.startTime - minTime <= timeRange[1] &&
        p.endTime - minTime >= timeRange[0]
    );
  }, [processes, thresholdToShowProcess, timeRange]);

  return (
    <Box sx={{ width: '100%', height: '100%', textAlign: 'center' }}>
      <Container maxWidth={'lg'}>
        <Typography variant={'h1'}>straceprof</Typography>
        <Typography>
          straceprof is a profiler designed for multi-process programs.
          straceprof can take profile of any process when you can run it under
          strace. It is particularly well-suited for profiling build processes
          such as those initiated by make, cmake, shell scripts, or docker
          build. Upload the result of{' '}
          <code>
            {' '}
            strace --trace=execve,execveat,exit,exit_group --follow-forks
            --string-limit=1000 -ttt --output=straceprof.log &lt;comamnd to
            profile&gt;{' '}
          </code>{' '}
          and visualize it.
        </Typography>
      </Container>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && processes.length > 0 && (
        <>
          <Box sx={{ mt: 4, mb: 2 }}>
            <LogFileSelector
              selectedExample={selectedExample}
              onExampleChange={(event) => {
                setSelectedExample(event.target.value);
                // Clear selected file when an example is selected
                setSelectedFile(null);
              }}
              onFileChange={handleFileChange}
            />
            <ProcessController
              thresholdToShowProcess={thresholdToShowProcess}
              onThresholdChange={handleThresholdChange}
              timeRange={timeRange}
              globalTimeRange={globalTimeRange}
              onTimeRangeChange={handleTimeRangeChange}
            />
          </Box>
          <ProcessVisualizer
            processes={filteredProcesses}
            title={
              selectedFile
                ? selectedFile.name
                : selectedExample
                  ? `Example: ${exampleLogs[selectedExample].name}`
                  : 'Sample Log Visualization'
            }
            thresholdToShowProcess={thresholdToShowProcess}
            timeRange={timeRange}
          />
        </>
      )}
    </Box>
  );
}

export default App;

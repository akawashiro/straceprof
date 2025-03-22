import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Container } from '@mui/material';
import {
  Process,
  getProcessesFromLog,
  calculateThresholdToShowProcess,
  calculateProcessVcpuAllocation,
} from './ProcessUtils';
import ProcessVisualizer from './ProcessVisualizer';
import ProcessController from './ProcessController';
import { exampleLogs } from './LogExamples';
import NoProcessesFound from './NoProcessesFound';
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
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: window.innerWidth * 0.9, // Initial width based on window size
    height: 800, // Initial height, will be auto-adjusted based on processes
  });

  // State for hover functionality
  const [hoveredProcess, setHoveredProcess] = useState<Process | null>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

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

        // Set initial canvas dimensions based on window size and processes
        updateCanvasDimensions(parsedProcesses, calculatedThreshold);
      })
      .catch((error) => {
        console.error('Error fetching example log:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedExample, selectedFile]);

  // Add window resize event listener
  useEffect(() => {
    const handleResize = () => {
      setCanvasDimensions((prev) => ({
        ...prev,
        width: window.innerWidth * 0.9, // 90% of window width
      }));
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update canvas dimensions based on processes and threshold
  const updateCanvasDimensions = (procs: Process[], threshold: number) => {
    // Set width to 90% of window width, with min/max constraints
    const windowWidth = window.innerWidth;
    const responsiveWidth = windowWidth * 0.9 + 1000;

    // Use calculateProcessVcpuAllocation to determine how many vCPU rows we need
    const processToVcpu = calculateProcessVcpuAllocation(procs, threshold);
    const maxVcpu =
      processToVcpu.length > 0 ? Math.max(...processToVcpu) + 1 : 0;

    // Calculate height based on number of vCPUs (30px per row + 30px for title/axis)
    const PROCESS_ROW_HEIGHT = 30;
    const calculatedHeight = maxVcpu * PROCESS_ROW_HEIGHT + 30;

    // Set minimum height of 200px
    const initialHeight = Math.max(calculatedHeight, 200);

    setCanvasDimensions({
      width: responsiveWidth,
      height: initialHeight,
    });
  };

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

          // Set initial canvas dimensions
          updateCanvasDimensions(parsedProcesses, calculatedThreshold);
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
    updateCanvasDimensions(processes, value);
  };

  // Handle hover events from ProcessCanvas
  const handleHover = (
    process: Process | null,
    position: { x: number; y: number } | null
  ) => {
    setHoveredProcess(process);
    setMousePosition(position);
  };

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

      {!isLoading && fileContent && processes.length === 0 && (
        <NoProcessesFound fileContent={fileContent} />
      )}

      {!isLoading && processes.length > 0 && (
        <>
          <Box sx={{ mt: 4, mb: 2 }}>
            <ProcessController
              thresholdToShowProcess={thresholdToShowProcess}
              onThresholdChange={handleThresholdChange}
              selectedExample={selectedExample}
              onExampleChange={(event) => {
                setSelectedExample(event.target.value);
                // Clear selected file when an example is selected
                setSelectedFile(null);
              }}
              onFileChange={handleFileChange}
            />
          </Box>
          <ProcessVisualizer
            processes={processes}
            title={
              selectedFile
                ? selectedFile.name
                : selectedExample
                  ? `Example: ${exampleLogs[selectedExample].name}`
                  : 'Sample Log Visualization'
            }
            thresholdToShowProcess={thresholdToShowProcess}
            canvasWidth={canvasDimensions.width}
            canvasHeight={canvasDimensions.height}
            onHoverProcess={handleHover}
            hoveredProcess={hoveredProcess}
            mousePosition={mousePosition}
          />
        </>
      )}
    </Box>
  );
}

export default App;

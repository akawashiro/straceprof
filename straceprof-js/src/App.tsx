import { useState, useMemo } from 'react';
import { Box, Typography, Container } from '@mui/material';
import { Process, calculateGlobalTimeRange } from './ProcessUtils';
import ProcessVisualizer from './ProcessVisualizer';
import ProcessController from './ProcessController';
import LogFileSelector from './LogFileSelector';
// Removed unused imports

function App() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('Sample Log Visualization');

  // Canvas control state
  const [thresholdToShowProcess, setThresholdToShowProcess] =
    useState<number>(0);
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 0]);
  const [regexpFilterProcess, setRegexpFilterProcess] =
    useState<string>('^.*$');

  // Calculate global time range from all processes
  const globalTimeRange = useMemo(() => {
    return calculateGlobalTimeRange(processes);
  }, [processes]);

  return (
    <Box sx={{ width: '100%', height: '100%', textAlign: 'center' }}>
      <Container maxWidth={'lg'}>
        <Typography variant={'h1'}>straceprof</Typography>
        <Typography>
          straceprof is a profiler designed for multi-process programs.
          straceprof can take profile of any process when you can run it under
          strace. It is particularly well-suited for profiling build processes
          such as those initiated by make, cmake, shell scripts, or docker
          build. Upload the result of the follwoing command and visualize it.
        </Typography>
        <code>
          {' '}
          strace --trace=execve,execveat,exit,exit_group --follow-forks
          --string-limit=1000 -ttt --output=straceprof.log &lt;comamnd to
          profile&gt;{' '}
        </code>{' '}
      </Container>

      <Box sx={{ mt: 4, mb: 2 }}>
        <LogFileSelector
          setProcesses={setProcesses}
          setThresholdToShowProcess={setThresholdToShowProcess}
          setTimeRange={setTimeRange}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setTitle={setTitle}
        />
        <ProcessController
          thresholdToShowProcess={thresholdToShowProcess}
          setThresholdToShowProcess={setThresholdToShowProcess}
          timeRange={timeRange}
          globalTimeRange={globalTimeRange}
          setTimeRange={setTimeRange}
          isLoading={isLoading}
          regexpFilterProcess={regexpFilterProcess}
          setRegexpFilterProcess={setRegexpFilterProcess}
        />
      </Box>
      <ProcessVisualizer
        processes={processes}
        title={title}
        thresholdToShowProcess={thresholdToShowProcess}
        timeRange={timeRange}
        isLoading={isLoading}
        regexpFilterProcess={regexpFilterProcess}
      />
    </Box>
  );
}

export default App;

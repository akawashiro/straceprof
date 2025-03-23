import { useState, useMemo } from 'react';
import { Box, Typography, Container } from '@mui/material';
import { Process } from './ProcessUtils';
import ProcessVisualizer from './ProcessVisualizer';
import ProcessController from './ProcessController';
import LogFileSelector from './LogFileSelector';
// Removed unused imports

function App() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedExample, setSelectedExample] = useState<string>('npm_install');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('Sample Log Visualization');

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

      <Box sx={{ mt: 4, mb: 2 }}>
        <LogFileSelector
          selectedExample={selectedExample}
          onExampleChange={(event) => {
            setSelectedExample(event.target.value);
          }}
          onProcessesChange={setProcesses}
          onThresholdCalculated={setThresholdToShowProcess}
          onTimeRangeCalculated={setTimeRange}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setTitle={setTitle}
        />
        <ProcessController
          thresholdToShowProcess={thresholdToShowProcess}
          onThresholdChange={handleThresholdChange}
          timeRange={timeRange}
          globalTimeRange={globalTimeRange}
          onTimeRangeChange={handleTimeRangeChange}
          isLoading={isLoading}
        />
      </Box>
      <ProcessVisualizer
        processes={filteredProcesses}
        title={title}
        thresholdToShowProcess={thresholdToShowProcess}
        timeRange={timeRange}
        isLoading={isLoading}
      />
    </Box>
  );
}

export default App;

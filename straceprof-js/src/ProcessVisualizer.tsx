import React, { useMemo } from 'react';
import { Process, generateColorMap } from './ProcessUtils';
import { Box, Container, Typography } from '@mui/material';
import ProcessCanvas from './ProcessCanvas';

interface ProcessVisualizerProps {
  processes: Process[];
  title?: string;
  thresholdToShowProcess: number;
  timeRange: [number, number];
  isLoading: boolean;
  regexpFilterProcess: string;
}

/**
 * ProcessVisualizer component for visualizing strace log processes
 */
const ProcessVisualizer: React.FC<ProcessVisualizerProps> = ({
  processes,
  title = 'Process Visualization',
  thresholdToShowProcess,
  timeRange,
  isLoading,
  regexpFilterProcess,
}) => {
  // Filter processes based on threshold, time range, and regexp pattern
  const filteredProcesses = useMemo(() => {
    if (processes.length === 0) return [];

    const minTime = Math.min(...processes.map((p) => p.startTime));

    // Create RegExp object from the filter string
    let regexpFilter: RegExp;
    try {
      regexpFilter = new RegExp(regexpFilterProcess);
    } catch (error) {
      // If invalid regexp, use a regexp that matches everything
      console.error('Invalid regexp:', error);
      regexpFilter = new RegExp('.*');
    }

    return processes.filter(
      (p) =>
        p.endTime - p.startTime >= thresholdToShowProcess &&
        p.startTime - minTime <= timeRange[1] &&
        p.endTime - minTime >= timeRange[0] &&
        regexpFilter.test(p.fullCommand)
    );
  }, [processes, thresholdToShowProcess, timeRange, regexpFilterProcess]);

  // ProcessCanvas handles its own dimensions and tooltip functionality

  // Generate color map once when filtered processes change
  const colorMap = useMemo(() => generateColorMap(processes), [processes]);

  // Return nothing when loading
  if (isLoading) {
    return null;
  }

  return (
    <Container
      maxWidth={false}
      sx={{ px: 3, display: 'flex', justifyContent: 'center' }}
    >
      {filteredProcesses.length === 0 ? (
        <Typography variant="body1">
          No processes to display. Try reducing the minimum duration, adjusting
          the time range, or modifying the regexp filter.
        </Typography>
      ) : (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <ProcessCanvas
            processes={filteredProcesses}
            title={title}
            thresholdToShowProcess={thresholdToShowProcess}
            timeRange={timeRange}
            colorMap={colorMap}
          />
        </Box>
      )}
    </Container>
  );
};

export default ProcessVisualizer;

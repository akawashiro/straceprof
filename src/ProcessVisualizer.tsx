import React, { useMemo } from 'react';
import { Process, generateColorMap } from './ProcessUtils';
import { Box, Container } from '@mui/material';
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
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <ProcessCanvas
          processes={processes}
          title={title}
          thresholdToShowProcess={thresholdToShowProcess}
          timeRange={timeRange}
          colorMap={colorMap}
          regexpFilterProcess={regexpFilterProcess}
        />
      </Box>
    </Container>
  );
};

export default ProcessVisualizer;

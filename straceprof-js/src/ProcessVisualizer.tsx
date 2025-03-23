import React, { useMemo, useState, useEffect } from 'react';
import {
  Process,
  generateColorMap,
  calculateProcessVcpuAllocation,
} from './ProcessUtils';
import { Box, Container, Typography } from '@mui/material';
import ProcessCanvas from './ProcessCanvas';

interface ProcessVisualizerProps {
  processes: Process[];
  title?: string;
  thresholdToShowProcess: number;
  timeRange: [number, number];
  isLoading: boolean;
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
}) => {
  // Canvas dimensions state
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
    const PROCESS_ROW_HEIGHT = 32;
    const calculatedHeight = maxVcpu * PROCESS_ROW_HEIGHT + 50;

    // Set minimum height of 200px
    const initialHeight = Math.max(calculatedHeight, 200);

    setCanvasDimensions({
      width: responsiveWidth,
      height: initialHeight,
    });
  };

  // Handle hover events from ProcessCanvas
  const handleHover = (
    process: Process | null,
    position: { x: number; y: number } | null
  ) => {
    setHoveredProcess(process);
    setMousePosition(position);
  };

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

  // Update canvas dimensions when processes or threshold changes
  useEffect(() => {
    if (processes.length > 0) {
      updateCanvasDimensions(processes, thresholdToShowProcess);
    }
  }, [processes, thresholdToShowProcess]);

  // Generate color map once when processes change
  const colorMap = useMemo(() => generateColorMap(processes), [processes]);

  // Return nothing when loading
  if (isLoading) {
    return null;
  }

  return (
    <Container maxWidth={false} sx={{ px: 3 }}>
      {processes.length === 0 ? (
        <Typography variant="body1">
          No processes to display. Try reducing the minimum duration or
          adjusting the time range.
        </Typography>
      ) : (
        <Box sx={{ width: '100%' }}>
          <ProcessCanvas
            processes={processes}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            title={title}
            thresholdToShowProcess={thresholdToShowProcess}
            timeRange={timeRange}
            onHover={handleHover}
            colorMap={colorMap}
          />
          {hoveredProcess && mousePosition && (
            <div
              style={{
                position: 'fixed',
                top: mousePosition.y + 10,
                left: mousePosition.x + 10,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '8px',
                borderRadius: '4px',
                maxWidth: '400px',
                zIndex: 1000,
                pointerEvents: 'none',
              }}
            >
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                Command: {hoveredProcess.fullCommand}
              </Typography>
              <Typography variant="body2">PID: {hoveredProcess.pid}</Typography>
              <Typography variant="body2">
                Duration:{' '}
                {Math.round(hoveredProcess.endTime - hoveredProcess.startTime)}{' '}
                sec
              </Typography>
            </div>
          )}
        </Box>
      )}
    </Container>
  );
};

export default ProcessVisualizer;

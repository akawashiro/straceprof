import React, { useMemo, useState, useRef, useEffect } from 'react';
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

  // State for hover functionality
  const [hoveredProcess, setHoveredProcess] = useState<Process | null>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Ref for tooltip to measure its dimensions
  const tooltipRef = useRef<HTMLDivElement>(null);
  // State to store tooltip dimensions
  const [tooltipDimensions, setTooltipDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Update tooltip dimensions when it changes
  useEffect(() => {
    if (tooltipRef.current && hoveredProcess) {
      const { width, height } = tooltipRef.current.getBoundingClientRect();
      setTooltipDimensions({ width, height });
    }
  }, [hoveredProcess]);

  // Function to calculate tooltip position to ensure it stays within the window
  const calculateTooltipPosition = (
    mousePos: { x: number; y: number },
    tooltipDims: { width: number; height: number }
  ) => {
    // Default offset
    const offset = 10;

    // Get window dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate positions
    let top = mousePos.y + offset;
    let left = mousePos.x + offset;

    // Check if tooltip would go beyond the right edge
    if (left + tooltipDims.width > windowWidth) {
      // Position to the left of the cursor instead
      left = mousePos.x - tooltipDims.width - offset;
    }

    // Check if tooltip would go beyond the bottom edge
    if (top + tooltipDims.height > windowHeight) {
      // Position above the cursor instead
      top = mousePos.y - tooltipDims.height - offset;
    }

    // Ensure tooltip doesn't go beyond the left edge
    if (left < 0) {
      left = offset;
    }

    // Ensure tooltip doesn't go beyond the top edge
    if (top < 0) {
      top = offset;
    }

    return { top, left };
  };

  // Handle hover events from ProcessCanvas
  const handleHover = (
    process: Process | null,
    position: { x: number; y: number } | null
  ) => {
    setHoveredProcess(process);
    setMousePosition(position);
  };

  // No resize event listener needed anymore as ProcessCanvas handles its own dimensions

  // Generate color map once when filtered processes change
  const colorMap = useMemo(() => generateColorMap(processes), [processes]);

  // Return nothing when loading
  if (isLoading) {
    return null;
  }

  return (
    <Container maxWidth={false} sx={{ px: 3 }}>
      {filteredProcesses.length === 0 ? (
        <Typography variant="body1">
          No processes to display. Try reducing the minimum duration, adjusting
          the time range, or modifying the regexp filter.
        </Typography>
      ) : (
        <Box sx={{ width: '100%' }}>
          <ProcessCanvas
            processes={filteredProcesses}
            title={title}
            thresholdToShowProcess={thresholdToShowProcess}
            timeRange={timeRange}
            onHover={handleHover}
            colorMap={colorMap}
          />
          {hoveredProcess && mousePosition && (
            <div
              ref={tooltipRef}
              style={{
                position: 'fixed',
                top: calculateTooltipPosition(mousePosition, tooltipDimensions)
                  .top,
                left: calculateTooltipPosition(mousePosition, tooltipDimensions)
                  .left,
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

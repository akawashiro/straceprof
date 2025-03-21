import React, { useRef, useState, useEffect } from 'react';
import {
  Process,
  calculateThresholdToShowProcess,
  calculateProcessVcpuAllocation,
} from './ProcessUtils';
import { Box, Typography } from '@mui/material';
import ProcessCanvas from './ProcessCanvas';
import ProcessCanvasController from './ProcessCanvasController';

interface ProcessVisualizerProps {
  processes: Process[];
  title?: string;
}

/**
 * ProcessVisualizer component for visualizing strace log processes
 */
const ProcessVisualizer: React.FC<ProcessVisualizerProps> = ({
  processes,
  title = 'Process Visualization',
}) => {
  const [thresholdToShowProcess, setthresholdToShowProcess] =
    useState<number>(0);

  // Calculate and set the initial threshold when processes change
  useEffect(() => {
    const calculatedThreshold = calculateThresholdToShowProcess(processes);
    setthresholdToShowProcess(calculatedThreshold);
  }, [processes]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setDimensions] = useState({
    width: 1200,
    height: 800,
  });

  // Set initial canvas dimensions based on window size and processes
  useEffect(() => {
    // Set initial width to 90% of window width, with min/max constraints
    const windowWidth = window.innerWidth;
    const initialWidth = Math.min(Math.max(windowWidth * 0.9, 400), 2000);

    // Use calculateProcessVcpuAllocation to determine how many vCPU rows we need
    const processToVcpu = calculateProcessVcpuAllocation(
      processes,
      thresholdToShowProcess
    );
    const maxVcpu =
      processToVcpu.length > 0 ? Math.max(...processToVcpu) + 1 : 0;

    // Calculate height based on number of vCPUs (30px per row + 30px for title/axis)
    // Use the constant PROCESS_ROW_HEIGHT from ProcessCanvas.tsx
    const PROCESS_ROW_HEIGHT = 30;
    const calculatedHeight = maxVcpu * PROCESS_ROW_HEIGHT + 30;

    // Set minimum height of 200px
    const initialHeight = Math.max(calculatedHeight, 200);

    setDimensions({
      width: initialWidth,
      height: initialHeight,
    });
  }, [processes, thresholdToShowProcess]); // Re-calculate when processes or threshold changes

  // State for hover functionality
  const [hoveredProcess, setHoveredProcess] = useState<Process | null>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Width and height sliders
  const handleWidthChange = (_: Event, value: number | number[]) => {
    setDimensions((prev) => ({
      ...prev,
      width: value as number,
    }));
  };

  const handleHeightChange = (_: Event, value: number | number[]) => {
    setDimensions((prev) => ({
      ...prev,
      height: value as number,
    }));
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
    <Box>
      <Box sx={{ mt: 4, mb: 2 }}>
        <ProcessCanvasController
          thresholdToShowProcess={thresholdToShowProcess}
          canvasWidth={canvasDimensions.width}
          canvasHeight={canvasDimensions.height}
          onThresholdChange={(value) => setthresholdToShowProcess(value)}
          onWidthChange={handleWidthChange}
          onHeightChange={handleHeightChange}
        />
      </Box>

      {processes.length === 0 ? (
        <Typography variant="body1">
          No processes to display. Try reducing the minimum duration.
        </Typography>
      ) : (
        <Box sx={{ overflowX: 'auto' }} ref={containerRef}>
          <ProcessCanvas
            processes={processes}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            title={title}
            thresholdToShowProcess={thresholdToShowProcess}
            onHover={handleHover}
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
    </Box>
  );
};

export default ProcessVisualizer;

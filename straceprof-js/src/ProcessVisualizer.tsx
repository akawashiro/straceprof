import React, { useRef, useState, useEffect } from 'react';
import { Process, calculateThresholdToShowProcess } from './ProcessUtils';
import { Box, Typography, Slider } from '@mui/material';
import ProcessCanvas from './ProcessCanvas';

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

  // Set initial canvas width based on window size
  useEffect(() => {
    // Set initial width to 90% of window width, with min/max constraints
    const windowWidth = window.innerWidth;
    const initialWidth = Math.min(Math.max(windowWidth * 0.9, 400), 2000);

    setDimensions((prev) => ({
      ...prev,
      width: initialWidth,
    }));
  }, []); // Empty dependency array means this runs once on mount

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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ mr: 2, minWidth: 180 }}>
            Threshold to show processes (sec):
          </Typography>
          <Slider
            size="small"
            value={thresholdToShowProcess}
            onChange={(_, value) => setthresholdToShowProcess(value as number)}
            min={0}
            max={30}
            step={1}
            valueLabelDisplay="auto"
            sx={{ flex: 1 }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ mr: 2, minWidth: 180 }}>
            Canvas Width (px):
          </Typography>
          <Slider
            size="small"
            value={canvasDimensions.width}
            onChange={handleWidthChange}
            min={400}
            max={2000}
            step={50}
            valueLabelDisplay="auto"
            sx={{ flex: 1 }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ mr: 2, minWidth: 180 }}>
            Canvas Height (px):
          </Typography>
          <Slider
            size="small"
            value={canvasDimensions.height}
            onChange={handleHeightChange}
            min={200}
            max={1200}
            step={50}
            valueLabelDisplay="auto"
            sx={{ flex: 1 }}
          />
        </Box>
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
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {hoveredProcess.program.split('/').pop() ||
                  hoveredProcess.program}
              </Typography>
              <Typography variant="body2">
                Duration:{' '}
                {Math.round(hoveredProcess.endTime - hoveredProcess.startTime)}{' '}
                sec
              </Typography>
              <Typography variant="body2">PID: {hoveredProcess.pid}</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                Command: {hoveredProcess.fullCommand}
              </Typography>
            </div>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ProcessVisualizer;

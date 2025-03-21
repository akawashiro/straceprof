import React, { useRef, useState, useLayoutEffect } from 'react';
import { Process } from './ProcessUtils';
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
  const [minimumDuration, setMinimumDuration] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setDimensions] = useState({
    width: 1200,
    height: 400,
  });

  // State for hover functionality
  const [hoveredProcess, setHoveredProcess] = useState<Process | null>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Update dimensions when container size changes
  useLayoutEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // 50 is subtracted to account for padding
        const width = containerRef.current.clientWidth - 50;
        const height = containerRef.current.clientHeight - 50;
        setDimensions({ width, height });
      }
    };

    handleResize(); // Initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            value={minimumDuration}
            onChange={(_, value) => setMinimumDuration(value as number)}
            min={0}
            max={30}
            step={1}
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
            minimumDuration={minimumDuration}
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

import React, { useRef, useEffect, useMemo } from 'react';
import {
  Process,
  calculateProcessVcpuAllocation,
  generateColorMap,
} from './ProcessUtils';
import { Box, Typography } from '@mui/material';
import ProcessCanvas from './ProcessCanvas';

interface ProcessVisualizerProps {
  processes: Process[];
  title?: string;
  thresholdToShowProcess: number;
  canvasWidth: number;
  canvasHeight: number;
  onHoverProcess: (
    process: Process | null,
    position: { x: number; y: number } | null
  ) => void;
  hoveredProcess: Process | null;
  mousePosition: { x: number; y: number } | null;
}

/**
 * ProcessVisualizer component for visualizing strace log processes
 */
const ProcessVisualizer: React.FC<ProcessVisualizerProps> = ({
  processes,
  title = 'Process Visualization',
  thresholdToShowProcess,
  canvasWidth,
  canvasHeight,
  onHoverProcess,
  hoveredProcess,
  mousePosition,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate color map once when processes change
  const colorMap = useMemo(() => generateColorMap(processes), [processes]);

  return (
    <Box>
      {processes.length === 0 ? (
        <Typography variant="body1">
          No processes to display. Try reducing the minimum duration.
        </Typography>
      ) : (
        <Box sx={{ overflowX: 'auto' }} ref={containerRef}>
          <ProcessCanvas
            processes={processes}
            width={canvasWidth}
            height={canvasHeight}
            title={title}
            thresholdToShowProcess={thresholdToShowProcess}
            onHover={onHoverProcess}
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
    </Box>
  );
};

export default ProcessVisualizer;

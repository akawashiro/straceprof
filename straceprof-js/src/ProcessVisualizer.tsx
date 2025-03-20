import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Process } from './ProcessUtils';
import { Box, Typography, Paper, Slider } from '@mui/material';

interface ProcessVisualizerProps {
  processes: Process[];
  title?: string;
}

/**
 * Generate a color map for processes based on program names
 * Similar to the Python implementation's gen_color_map function
 */
function generateColorMap(processes: Process[]): Record<string, string> {
  // Count total duration for each program
  const histogram: Record<string, number> = {};

  for (const process of processes) {
    const programName = process.program.split('/').pop() || process.program;
    if (histogram[programName]) {
      histogram[programName] += process.endTime - process.startTime;
    } else {
      histogram[programName] = process.endTime - process.startTime;
    }
  }

  // Sort programs by total duration
  const coloredPrograms = Object.entries(histogram);
  coloredPrograms.sort((a, b) => b[1] - a[1]);

  // Assign colors to programs
  const colorList = [
    '#FF0000', // red
    '#FFA500', // orange
    '#FFFF00', // yellow
    '#FF00FF', // magenta
    '#800080', // purple
    '#0000FF', // blue
    '#00FFFF', // cyan
    '#008000', // green
  ];

  const colorMap: Record<string, string> = {};
  for (let i = 0; i < Math.min(coloredPrograms.length, colorList.length); i++) {
    colorMap[coloredPrograms[i][0]] = colorList[i];
  }

  return colorMap;
}

/**
 * Generate text for a process rectangle
 * Similar to the Python implementation's gen_text function
 */
function generateText(
  process: Process,
  rectWidthPx: number,
  fontSize: number
): string {
  // Heuristic for calculating how many characters can fit
  const fontWidthInPixels = fontSize * 0.6;
  const maxChars = Math.floor(rectWidthPx / fontWidthInPixels) - 1;

  if (rectWidthPx < 10) {
    return '';
  }

  const duration = Math.round(process.endTime - process.startTime);

  const text = `${process.fullCommand} (${duration} sec)`;

  // Truncate if too long
  if (text.length > maxChars) {
    return text.substring(0, maxChars) + '...';
  }

  // No longer repeating text to fill space

  return text;
}

// Interface for storing rectangle information for hover detection
interface ProcessRect {
  process: Process;
  x: number;
  y: number;
  width: number;
  height: number;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasDimensions, setDimensions] = useState({
    width: 1200,
    height: 400,
  });

  // State for hover functionality
  const [processRects, setProcessRects] = useState<ProcessRect[]>([]);
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

  // Filter and sort processes
  const filteredProcesses = processes
    .filter((p) => p.endTime - p.startTime >= minimumDuration)
    .sort((a, b) => a.startTime - b.startTime);

  // Function to check if mouse is over a process rectangle
  const checkHover = (x: number, y: number) => {
    for (const rect of processRects) {
      if (
        x >= rect.x &&
        x <= rect.x + rect.width &&
        y >= rect.y &&
        y <= rect.y + rect.height
      ) {
        setHoveredProcess(rect.process);
        return;
      }
    }
    setHoveredProcess(null);
  };

  // Mouse event handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x: e.clientX, y: e.clientY });
    checkHover(x, y);
  };

  const handleMouseLeave = () => {
    setHoveredProcess(null);
    setMousePosition(null);
  };

  useEffect(() => {
    if (!canvasRef.current || filteredProcesses.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset process rectangles
    const newProcessRects: ProcessRect[] = [];

    // Calculate time range
    let offsetTime = Number.MAX_SAFE_INTEGER;
    let maxTime = 0;

    for (const process of filteredProcesses) {
      offsetTime = Math.min(offsetTime, process.startTime);
      maxTime = Math.max(maxTime, process.endTime);
    }

    const timeRange = maxTime - offsetTime;

    // Calculate process layout (which vCPU each process runs on)
    const vcpuUsedTimes: number[] = [];
    const processToVcpu: number[] = [];

    for (const process of filteredProcesses) {
      let assigned = false;

      for (let j = 0; j < vcpuUsedTimes.length; j++) {
        if (vcpuUsedTimes[j] <= process.startTime) {
          vcpuUsedTimes[j] = process.endTime;
          processToVcpu.push(j);
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        vcpuUsedTimes.push(process.endTime);
        processToVcpu.push(vcpuUsedTimes.length - 1);
      }
    }

    const maxVcpu = Math.max(...processToVcpu) + 1;

    // Set canvas dimensions
    canvas.width = canvasDimensions.width;
    canvas.height = Math.max(maxVcpu * 20, canvasDimensions.height);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Generate color map
    const colorMap = generateColorMap(filteredProcesses);

    // Draw time axis
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';

    const xTickInterval = Math.max(Math.floor(timeRange / 10), 1);
    for (let t = 0; t <= timeRange; t += xTickInterval) {
      const x = (t / timeRange) * canvasDimensions.width;
      ctx.fillText(`${t}s`, x, canvasDimensions.height - 5);

      // Draw light grid line
      ctx.strokeStyle = '#EEEEEE';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasDimensions.height - 20);
      ctx.stroke();
    }

    // Draw title
    ctx.font = '16px Arial';
    ctx.fillText(title, 10, 20);

    // Draw processes
    for (let i = 0; i < filteredProcesses.length; i++) {
      const process = filteredProcesses[i];
      const vcpu = processToVcpu[i];

      // Calculate rectangle dimensions
      const startX =
        ((process.startTime - offsetTime) / timeRange) * canvasDimensions.width;
      const endX =
        ((process.endTime - offsetTime) / timeRange) * canvasDimensions.width;
      const rectWidth = endX - startX;

      const vcpuHeight = (canvasDimensions.height - 30) / maxVcpu;
      const startY = vcpu * vcpuHeight + 30;

      // Store rectangle information for hover detection
      newProcessRects.push({
        process,
        x: startX,
        y: startY,
        width: rectWidth,
        height: vcpuHeight - 2,
      });

      // Draw rectangle
      const programName = process.program.split('/').pop() || process.program;
      ctx.fillStyle = colorMap[programName] || '#CCCCCC';
      ctx.fillRect(startX, startY, rectWidth, vcpuHeight - 2);

      // Draw border
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(startX, startY, rectWidth, vcpuHeight - 2);

      // Draw text if rectangle is wide enough
      if (rectWidth > 10) {
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';

        const text = generateText(process, rectWidth, 12);
        const textX = startX + rectWidth / 2;
        const textY = startY + vcpuHeight / 2;

        // Center text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, textX, textY);
      }
    }

    // Update process rectangles state
    setProcessRects(newProcessRects);
  }, [
    filteredProcesses,
    canvasDimensions.width,
    canvasDimensions.height,
    minimumDuration,
    title,
  ]);

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
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

      {filteredProcesses.length === 0 ? (
        <Typography variant="body1">
          No processes to display. Try reducing the minimum duration.
        </Typography>
      ) : (
        <Box sx={{ overflowX: 'auto' }} ref={containerRef}>
          <Box sx={{ position: 'relative' }}>
            <canvas
              ref={canvasRef}
              style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                maxWidth: '100%',
                height: 'auto',
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
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
                <Typography>
                  Duration:{' '}
                  {Math.round(
                    hoveredProcess.endTime - hoveredProcess.startTime
                  )}{' '}
                  sec
                </Typography>
                <Typography>PID: {hoveredProcess.pid}</Typography>
                <Typography sx={{ wordBreak: 'break-word' }}>
                  Command: {hoveredProcess.fullCommand}
                </Typography>
              </div>
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default ProcessVisualizer;

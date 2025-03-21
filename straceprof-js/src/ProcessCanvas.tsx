import React, { useEffect, useRef, useState } from 'react';
import { Process, calculateProcessVcpuAllocation } from './ProcessUtils';
import { Box, Typography } from '@mui/material';

interface ProcessCanvasProps {
  processes: Process[];
  width: number;
  height: number;
  title: string;
  thresholdToShowProcess: number;
  onHover?: (
    process: Process | null,
    position: { x: number; y: number } | null
  ) => void;
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
  let text = `${process.fullCommand} (${duration} sec)`;

  // Truncate if too long
  if (text.length > maxChars) {
    return text.substring(0, maxChars) + '...';
  }

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

// Fixed height for each process row, slightly larger than text size
const PROCESS_ROW_HEIGHT = 30; // For 12px font

/**
 * ProcessCanvas component for rendering the process visualization canvas
 */
const ProcessCanvas: React.FC<ProcessCanvasProps> = ({
  processes,
  width,
  height,
  title,
  thresholdToShowProcess,
  onHover,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State for hover functionality
  const [processRects, setProcessRects] = useState<ProcessRect[]>([]);
  const [hoveredProcess, setHoveredProcess] = useState<Process | null>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Filter processes based on thresholdToShowProcess
  const filteredProcesses = processes
    .filter((p) => p.endTime - p.startTime >= thresholdToShowProcess)
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
        if (onHover) {
          onHover(rect.process, mousePosition);
        }
        return;
      }
    }
    setHoveredProcess(null);
    if (onHover) {
      onHover(null, null);
    }
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
    if (onHover) {
      onHover(null, null);
    }
  };

  useEffect(() => {
    if (!canvasRef.current || filteredProcesses.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
    const processToVcpu = calculateProcessVcpuAllocation(
      processes,
      thresholdToShowProcess
    );
    const maxVcpu =
      processToVcpu.length > 0 ? Math.max(...processToVcpu) + 1 : 0;

    // Calculate required canvas height based on fixed process row height
    const requiredHeight = maxVcpu * PROCESS_ROW_HEIGHT + 50; // +50 for title and time axis

    // Adjust canvas height if needed
    if (requiredHeight > height) {
      canvas.height = requiredHeight;
    }

    // Generate color map
    const colorMap = generateColorMap(filteredProcesses);

    // Draw title
    ctx.font = '16px Arial';
    ctx.fillText(title, 10, 20);

    // Draw time axis
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';

    const xTickInterval = Math.max(Math.floor(timeRange / 10), 1);
    for (let t = 0; t <= timeRange; t += xTickInterval) {
      const x = (t / timeRange) * width;
      ctx.fillText(`${t}s`, x, 35); // Position at top below title

      // Draw light grid line
      ctx.strokeStyle = '#EEEEEE';
      ctx.beginPath();
      ctx.moveTo(x, 45); // Start below time labels
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw processes
    for (let i = 0; i < filteredProcesses.length; i++) {
      const process = filteredProcesses[i];
      const vcpu = processToVcpu[i];

      // Calculate rectangle dimensions
      const startX = ((process.startTime - offsetTime) / timeRange) * width;
      const endX = ((process.endTime - offsetTime) / timeRange) * width;
      const rectWidth = endX - startX;

      const startY = vcpu * PROCESS_ROW_HEIGHT + 50; // Adjusted to account for time axis at top
      const rectHeight = PROCESS_ROW_HEIGHT - 2; // -2 for spacing between rows

      // Store rectangle information for hover detection
      newProcessRects.push({
        process,
        x: startX,
        y: startY,
        width: rectWidth,
        height: rectHeight,
      });

      // Draw rectangle
      const programName = process.program.split('/').pop() || process.program;
      ctx.fillStyle = colorMap[programName] || '#CCCCCC';
      ctx.fillRect(startX, startY, rectWidth, rectHeight);

      // Draw border
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(startX, startY, rectWidth, rectHeight);

      // Draw text if rectangle is wide enough
      if (rectWidth > 10) {
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';

        const text = generateText(process, rectWidth, 12);
        const textX = startX + rectWidth / 2;
        const textY = startY + PROCESS_ROW_HEIGHT / 2;

        // Center text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, textX, textY);
      }
    }

    // Update process rectangles state
    setProcessRects(newProcessRects);
  }, [
    processes,
    filteredProcesses,
    width,
    height,
    thresholdToShowProcess,
    title,
  ]);

  return (
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
      {hoveredProcess && mousePosition && !onHover && (
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
            {Math.round(hoveredProcess.endTime - hoveredProcess.startTime)} sec
          </Typography>
        </div>
      )}
    </Box>
  );
};

export default ProcessCanvas;

import React, { useEffect, useRef, useState } from 'react';
import { Process, calculateProcessVcpuAllocation } from './ProcessUtils';
import { Box, useTheme } from '@mui/material';

interface ProcessCanvasProps {
  processes: Process[];
  width: number;
  height: number;
  title: string;
  thresholdToShowProcess: number;
  timeRange: [number, number];
  colorMap: Record<string, string>;
  onHover?: (
    process: Process | null,
    position: { x: number; y: number } | null
  ) => void;
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

// Padding inside the canvas (in pixels)
const CANVAS_PADDING = 5;

/**
 * ProcessCanvas component for rendering the process visualization canvas
 */
const ProcessCanvas: React.FC<ProcessCanvasProps> = ({
  processes,
  width,
  height,
  title,
  thresholdToShowProcess,
  timeRange,
  colorMap,
  onHover,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();

  // State for hover detection
  const [processRects, setProcessRects] = useState<ProcessRect[]>([]);
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
        if (onHover) {
          onHover(rect.process, mousePosition);
        }
        return;
      }
    }
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

    // Use the provided time range instead of calculating it from processes
    const [startTime, endTime] = timeRange;
    const visibleTimeRange = endTime - startTime;

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

    // Calculate effective drawing area with padding
    const effectiveWidth = canvas.width - CANVAS_PADDING * 2;
    const effectiveHeight = canvas.height - CANVAS_PADDING * 2;

    // Draw title
    ctx.font = `20px ${theme.typography.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, 20 + CANVAS_PADDING);
    ctx.textAlign = 'left'; // Reset text alignment for other text elements

    // Draw time axis
    ctx.fillStyle = '#000000';
    ctx.font = `10px ${theme.typography.fontFamily}`;

    // Calculate tick interval based on visible time range
    const xTickInterval = Math.max(Math.floor(visibleTimeRange / 10), 1);

    // Draw time axis ticks and grid lines
    for (let t = 0; t <= visibleTimeRange; t += xTickInterval) {
      const currentTime = startTime + t;
      const x = (t / visibleTimeRange) * effectiveWidth + CANVAS_PADDING;

      // Format time label (seconds from start time)
      const timeLabel = `${t.toFixed(1)}s`;
      ctx.fillText(timeLabel, x, 45 + CANVAS_PADDING); // Position at top below title

      // Draw light grid line
      ctx.strokeStyle = '#EEEEEE';
      ctx.beginPath();
      ctx.moveTo(x, 45 + CANVAS_PADDING); // Start below time labels
      ctx.lineTo(x, effectiveHeight + CANVAS_PADDING);
      ctx.stroke();
    }

    // Draw processes
    for (let i = 0; i < filteredProcesses.length; i++) {
      const process = filteredProcesses[i];
      const vcpu = processToVcpu[i];

      // Calculate visible portion of the process within the time range
      const visibleStartTime = Math.max(process.startTime, startTime);
      const visibleEndTime = Math.min(process.endTime, endTime);

      // Skip if process is completely outside the visible time range
      if (visibleEndTime <= visibleStartTime) continue;

      // Calculate rectangle dimensions with padding
      const startX =
        ((visibleStartTime - startTime) / visibleTimeRange) * effectiveWidth +
        CANVAS_PADDING;
      const endX =
        ((visibleEndTime - startTime) / visibleTimeRange) * effectiveWidth +
        CANVAS_PADDING;
      const rectWidth = endX - startX;

      const startY = vcpu * PROCESS_ROW_HEIGHT + 60 + CANVAS_PADDING; // Adjusted to account for time axis at top
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

      // Draw text if rectangle is wide enough
      if (rectWidth > 10) {
        ctx.fillStyle = '#000000';
        ctx.font = `12px ${theme.typography.fontFamily}`;

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
    timeRange,
    title,
    colorMap,
  ]);

  return (
    <Box sx={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
      <canvas
        ref={canvasRef}
        style={{
          border: '1px solid #ddd',
          borderRadius: '4px',
          maxWidth: '100%',
          height: 'auto',
          display: 'block', // Prevents extra space below canvas
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </Box>
  );
};

export default ProcessCanvas;

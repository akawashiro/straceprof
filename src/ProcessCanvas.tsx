import React, { useEffect, useRef, useState } from 'react';
import { Process, calculateProcessVcpuAllocation } from './ProcessUtils';
import { Box, useTheme } from '@mui/material';
import { ProcessRect } from './ProcessTooltip';
import ProcessTooltip from './ProcessTooltip';

interface ProcessCanvasProps {
  processes: Process[];
  title: string;
  thresholdToShowProcess: number;
  timeRange: [number, number];
  colorMap: Record<string, string>;
  regexpFilterProcess: string;
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

/**
 * Generate filtered processes based on threshold and regexp
 * Returns processes that exceed the threshold duration and match the regexp, sorted by start time
 */
function generateFilteredProcesses(
  processes: Process[],
  thresholdToShowProcess: number,
  regexpFilterProcess: string
): Process[] {
  // Create RegExp object from the filter string
  let regexpFilter: RegExp;
  try {
    regexpFilter = new RegExp(regexpFilterProcess);
  } catch (error) {
    // If invalid regexp, use a regexp that matches everything
    console.error('Invalid regexp:', error);
    regexpFilter = new RegExp('.*');
  }

  return processes
    .filter(
      (p) =>
        p.endTime - p.startTime >= thresholdToShowProcess &&
        regexpFilter.test(p.fullCommand)
    )
    .sort((a, b) => a.startTime - b.startTime);
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
  title,
  thresholdToShowProcess,
  timeRange,
  colorMap,
  regexpFilterProcess,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();

  // State for hover detection and copy feedback
  const [processRects, setProcessRects] = useState<ProcessRect[]>([]);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [hoveredProcess, setHoveredProcess] = useState<Process | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState<boolean>(false);

  // State for canvas dimensions
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: window.innerWidth * 0.9, // Initial width based on window size
    height: 800, // Initial height, will be auto-adjusted based on processes
  });

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
    setMousePosition(null);
    setHoveredProcess(null);
  };

  // Handle click on process rectangle to copy information
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if a process rectangle was clicked
    for (const processRect of processRects) {
      if (
        x >= processRect.x &&
        x <= processRect.x + processRect.width &&
        y >= processRect.y &&
        y <= processRect.y + processRect.height
      ) {
        const process = processRect.process;

        // Format the text to copy
        const textToCopy =
          `Command: ${process.fullCommand}\n` +
          `PID: ${process.pid}\n` +
          `Duration: ${Math.round(process.endTime - process.startTime)} sec`;

        // Copy to clipboard
        navigator.clipboard
          .writeText(textToCopy)
          .then(() => {
            // Show copy feedback
            setCopiedFeedback(true);

            // Hide feedback after 2 seconds
            setTimeout(() => {
              setCopiedFeedback(false);
            }, 2000);
          })
          .catch((err) => {
            console.error('Failed to copy text: ', err);
          });

        break;
      }
    }
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

  // Update canvas dimensions based on processes
  useEffect(() => {
    const filteredProcesses = generateFilteredProcesses(
      processes,
      thresholdToShowProcess,
      regexpFilterProcess
    );
    if (filteredProcesses.length > 0) {
      // Calculate process layout (which vCPU each process runs on)
      const processToVcpu = calculateProcessVcpuAllocation(
        processes,
        thresholdToShowProcess,
        regexpFilterProcess
      );
      const maxVcpu =
        processToVcpu.length > 0 ? Math.max(...processToVcpu) + 1 : 0;

      // Calculate height based on number of vCPUs (30px per row + 100px for title/axis)
      const calculatedHeight = maxVcpu * PROCESS_ROW_HEIGHT + 100;

      // Set minimum height of 200px
      const newHeight = Math.max(calculatedHeight, 200);

      setCanvasDimensions((prev) => ({
        ...prev,
        height: newHeight,
      }));
    }
  }, [processes, thresholdToShowProcess, regexpFilterProcess]);

  useEffect(() => {
    const filteredProcesses = generateFilteredProcesses(
      processes,
      thresholdToShowProcess,
      regexpFilterProcess
    );
    if (!canvasRef.current || filteredProcesses.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvasDimensions.width;
    canvas.height = canvasDimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reset process rectangles
    const newProcessRects: ProcessRect[] = [];

    // Get the minimum start time to calculate relative times
    const processMinTime = Math.min(...processes.map((p) => p.startTime));

    // Use the provided time range (which is now relative to the start of the trace)
    const [startTime, endTime] = timeRange;
    const visibleTimeRange = endTime - startTime;

    // Calculate process layout (which vCPU each process runs on)
    const processToVcpu = calculateProcessVcpuAllocation(
      processes,
      thresholdToShowProcess,
      regexpFilterProcess
    );
    const maxVcpu =
      processToVcpu.length > 0 ? Math.max(...processToVcpu) + 1 : 0;

    // Calculate required canvas height based on fixed process row height
    const requiredHeight = maxVcpu * PROCESS_ROW_HEIGHT + 50; // +50 for title and time axis

    // Adjust canvas height if needed
    if (requiredHeight > canvasDimensions.height) {
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
      const x = (t / visibleTimeRange) * effectiveWidth + CANVAS_PADDING;

      // Format time label (seconds from start time)
      const timeLabel = `${(t + startTime).toFixed(1)}s`;
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

      // Calculate visible portion of the process within the time range using relative time
      const relativeStartTime = process.startTime - processMinTime;
      const relativeEndTime = process.endTime - processMinTime;

      const visibleStartTime = Math.max(relativeStartTime, startTime);
      const visibleEndTime = Math.min(relativeEndTime, endTime);

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
    canvasDimensions,
    thresholdToShowProcess,
    timeRange,
    title,
    colorMap,
    theme.typography.fontFamily,
    regexpFilterProcess,
  ]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        overflowX: 'auto',
        display: 'flex',
        justifyContent: 'center', // Center the canvas horizontally
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          border: '1px solid #ddd',
          borderRadius: '4px',
          maxWidth: '100%',
          height: 'auto',
          display: 'block', // Prevents extra space below canvas
          cursor: hoveredProcess ? 'pointer' : 'default', // Change cursor when hovering over a process
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      <ProcessTooltip
        hoveredProcess={hoveredProcess}
        mousePosition={mousePosition}
      />
      {copiedFeedback && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            zIndex: 1001,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Process information copied to clipboard!
        </div>
      )}
    </Box>
  );
};

export default ProcessCanvas;

import React, { useEffect, useRef, useState } from 'react';
import { Process } from './ProcessUtils';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Slider,
  TextField,
} from '@mui/material';

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

  const programName = process.program.split('/').pop() || process.program;
  const duration = Math.round(process.endTime - process.startTime);

  let text = `${programName} (${duration} sec) (PID: ${process.pid})`;

  // Add command if there's space
  if (text.length < maxChars - 10) {
    text += ` (cmd: ${process.fullCommand})`;
  }

  // Truncate if too long
  if (text.length > maxChars) {
    return text.substring(0, maxChars) + '...';
  }

  // Repeat text to fill space if it's short
  if (text.length <= maxChars / 2) {
    const repeatCount = Math.floor(maxChars / (text.length + 1));
    text = (text + ' ').repeat(repeatCount).trim();
  }

  return text;
}

/**
 * ProcessVisualizer component for visualizing strace log processes
 */
const ProcessVisualizer: React.FC<ProcessVisualizerProps> = ({
  processes,
  title = 'Process Visualization',
}) => {
  const [minimumDuration, setMinimumDuration] = useState<number>(0);
  const [visualizerWidth, setVisualizerWidth] = useState<number>(800);
  const [visualizerHeight, setVisualizerHeight] = useState<number>(400);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Filter and sort processes
  const filteredProcesses = processes
    .filter((p) => p.endTime - p.startTime >= minimumDuration)
    .sort((a, b) => a.startTime - b.startTime);

  useEffect(() => {
    if (!canvasRef.current || filteredProcesses.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    // Generate color map
    const colorMap = generateColorMap(filteredProcesses);

    // Draw time axis
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';

    const xTickInterval = Math.max(Math.floor(timeRange / 10), 1);
    for (let t = 0; t <= timeRange; t += xTickInterval) {
      const x = (t / timeRange) * visualizerWidth;
      ctx.fillText(`${t}s`, x, visualizerHeight - 5);

      // Draw light grid line
      ctx.strokeStyle = '#EEEEEE';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, visualizerHeight - 20);
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
        ((process.startTime - offsetTime) / timeRange) * visualizerWidth;
      const endX =
        ((process.endTime - offsetTime) / timeRange) * visualizerWidth;
      const rectWidth = endX - startX;

      const vcpuHeight = (visualizerHeight - 30) / maxVcpu;
      const startY = vcpu * vcpuHeight + 30;

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
        ctx.font = '10px Arial';

        const text = generateText(process, rectWidth, 10);
        const textX = startX + rectWidth / 2;
        const textY = startY + vcpuHeight / 2;

        // Center text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, textX, textY);
      }
    }
  }, [
    filteredProcesses,
    visualizerWidth,
    visualizerHeight,
    minimumDuration,
    title,
  ]);

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Process Visualization ({filteredProcesses.length} processes)
      </Typography>

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Visualization Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ mr: 2, minWidth: 180 }}>
            Minimum Duration (sec):
          </Typography>
          <Slider
            value={minimumDuration}
            onChange={(_, value) => setMinimumDuration(value as number)}
            min={0}
            max={30}
            step={1}
            valueLabelDisplay="auto"
            sx={{ flex: 1 }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ mr: 2, minWidth: 180 }}>
            Visualization Width:
          </Typography>
          <TextField
            type="number"
            value={visualizerWidth}
            onChange={(e) => setVisualizerWidth(Number(e.target.value))}
            inputProps={{ min: 400, max: 2000, step: 100 }}
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ mr: 2, minWidth: 180 }}>
            Visualization Height:
          </Typography>
          <TextField
            type="number"
            value={visualizerHeight}
            onChange={(e) => setVisualizerHeight(Number(e.target.value))}
            inputProps={{ min: 200, max: 1000, step: 50 }}
            size="small"
          />
        </Box>
      </Box>

      {filteredProcesses.length === 0 ? (
        <Typography variant="body1">
          No processes to display. Try reducing the minimum duration.
        </Typography>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <canvas
            ref={canvasRef}
            width={visualizerWidth}
            height={visualizerHeight}
            style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              maxWidth: '100%',
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default ProcessVisualizer;

import React, { useEffect, useRef, useState } from 'react';
import { Process } from './ProcessUtils';
import { Typography } from '@mui/material';

// Interface for storing rectangle information for hover detection
export interface ProcessRect {
  process: Process;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TooltipProps {
  hoveredProcess: Process | null;
  mousePosition: { x: number; y: number } | null;
}

/**
 * ProcessTooltip component for displaying information about a hovered process
 */
const ProcessTooltip: React.FC<TooltipProps> = ({
  hoveredProcess,
  mousePosition,
}) => {
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

  if (!hoveredProcess || !mousePosition) {
    return null;
  }

  return (
    <div
      ref={tooltipRef}
      style={{
        position: 'fixed',
        top: calculateTooltipPosition(mousePosition, tooltipDimensions).top,
        left: calculateTooltipPosition(mousePosition, tooltipDimensions).left,
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
  );
};

export default ProcessTooltip;

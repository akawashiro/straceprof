import React from 'react';
import {
  Typography,
  Slider,
  Grid2,
  Container,
  Box,
} from '@mui/material';

interface ProcessControllerProps {
  thresholdToShowProcess: number;
  onThresholdChange: (value: number) => void;
  timeRange: [number, number];
  globalTimeRange: [number, number];
  onTimeRangeChange: (value: [number, number]) => void;
}

/**
 * ProcessController component for controlling canvas parameters
 */
const ProcessController: React.FC<ProcessControllerProps> = ({
  thresholdToShowProcess,
  onThresholdChange,
  timeRange,
  globalTimeRange,
  onTimeRangeChange,
}) => {

  // Format time values for display (convert to seconds with 1 decimal place)
  const formatTime = (value: number) => {
    return `${value.toFixed(1)} sec`;
  };

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          mb: 2,
        }}
      ></Box>

      <Grid2 container spacing={2}>
        <Grid2 size={3}>
          <Typography align="right">
            Threshold to show processes (sec)
          </Typography>
        </Grid2>
        <Grid2 size={9}>
          <Slider
            size="small"
            value={thresholdToShowProcess}
            onChange={(_, value) => onThresholdChange(value as number)}
            min={0}
            max={30}
            step={1}
            marks={[
              { value: 0, label: '0 sec' },
              { value: 30, label: '30 sec' },
            ]}
            valueLabelDisplay="on"
          />
        </Grid2>
        <Grid2 size={3}>
          <Typography align="right">Time range to visualize (sec)</Typography>
        </Grid2>
        <Grid2 size={9}>
          <Slider
            size="small"
            value={timeRange}
            onChange={(_, value) =>
              onTimeRangeChange(value as [number, number])
            }
            min={globalTimeRange[0]}
            max={globalTimeRange[1]}
            marks={[
              {
                value: globalTimeRange[0],
                label: formatTime(globalTimeRange[0]),
              },
              {
                value: globalTimeRange[1],
                label: formatTime(globalTimeRange[1]),
              },
            ]}
            valueLabelDisplay="on"
            valueLabelFormat={formatTime}
            disableSwap
          />
        </Grid2>
      </Grid2>
    </Container>
  );
};

export default ProcessController;

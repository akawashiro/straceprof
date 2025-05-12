import React from 'react';
import {
  Typography,
  Slider,
  Grid2,
  Container,
  Box,
  CircularProgress,
  TextField,
} from '@mui/material';

interface ProcessControllerProps {
  thresholdToShowProcess: number;
  setThresholdToShowProcess: (value: number) => void;
  timeRange: [number, number];
  globalTimeRange: [number, number];
  setTimeRange: (value: [number, number]) => void;
  isLoading: boolean;
  regexpFilterProcess: string;
  setRegexpFilterProcess: (value: string) => void;
}

/**
 * ProcessController component for controlling canvas parameters
 */
const ProcessController: React.FC<ProcessControllerProps> = ({
  thresholdToShowProcess,
  setThresholdToShowProcess,
  timeRange,
  globalTimeRange,
  setTimeRange,
  isLoading,
  regexpFilterProcess,
  setRegexpFilterProcess,
}) => {
  // Format time values for display (convert to seconds with 1 decimal place)
  const formatTime = (value: number) => {
    return `${value.toFixed(1)} sec`;
  };

  return (
    <Container maxWidth="lg">
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
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
                onChange={(_, value) =>
                  setThresholdToShowProcess(value as number)
                }
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
              <Typography align="right">
                Time range to visualize (sec)
              </Typography>
            </Grid2>
            <Grid2 size={9}>
              <Slider
                size="small"
                value={timeRange}
                onChange={(_, value) => setTimeRange(value as [number, number])}
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
            <Grid2 size={3}>
              <Typography align="right">Filter processes by regexp</Typography>
            </Grid2>
            <Grid2 size={9}>
              <TextField
                fullWidth
                size="small"
                value={regexpFilterProcess}
                onChange={(e) => setRegexpFilterProcess(e.target.value)}
                placeholder="Regular expression to filter processes"
                helperText="Default: ^.*$ (matches all processes)"
              />
            </Grid2>
          </Grid2>
        </>
      )}
    </Container>
  );
};

export default ProcessController;

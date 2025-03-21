import React from 'react';
import { Typography, Slider, Grid } from '@mui/material';

interface ProcessCanvasControllerProps {
  thresholdToShowProcess: number;
  canvasWidth: number;
  canvasHeight: number;
  onThresholdChange: (value: number) => void;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
}

/**
 * ProcessCanvasController component for controlling canvas parameters
 */
const ProcessCanvasController: React.FC<ProcessCanvasControllerProps> = ({
  thresholdToShowProcess,
  canvasWidth,
  canvasHeight,
  onThresholdChange,
  onWidthChange,
  onHeightChange,
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Grid container alignItems="center">
          <Grid item xs={3}>
            <Typography>Threshold to show processes (sec):</Typography>
          </Grid>
          <Grid item xs={9}>
            <Slider
              size="small"
              value={thresholdToShowProcess}
              onChange={(_, value) => onThresholdChange(value as number)}
              min={0}
              max={30}
              step={1}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Grid container alignItems="center">
          <Grid item xs={3}>
            <Typography>Canvas Width (px):</Typography>
          </Grid>
          <Grid item xs={9}>
            <Slider
              size="small"
              value={canvasWidth}
              onChange={(_, value) => onWidthChange(value as number)}
              min={400}
              max={2000}
              step={50}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Grid container alignItems="center">
          <Grid item xs={3}>
            <Typography>Canvas Height (px):</Typography>
          </Grid>
          <Grid item xs={9}>
            <Slider
              size="small"
              value={canvasHeight}
              onChange={(_, value) => onHeightChange(value as number)}
              min={200}
              max={1200}
              step={50}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ProcessCanvasController;

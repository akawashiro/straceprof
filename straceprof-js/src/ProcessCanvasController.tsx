import React from 'react';
import { Typography, Slider, Grid2, Container } from '@mui/material';

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
    <Container maxWidth="lg">
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
          <Typography align="right">Canvas Width (px)</Typography>
        </Grid2>
        <Grid2 size={9}>
          <Slider
            size="small"
            value={canvasWidth}
            onChange={(_, value) => onWidthChange(value as number)}
            min={400}
            max={10000}
            step={50}
            marks={[
              { value: 400, label: '400 px' },
              { value: 10000, label: '10000 px' },
            ]}
            valueLabelDisplay="on"
          />
        </Grid2>

        <Grid2 size={3}>
          <Typography align="right">Canvas Height (px)</Typography>
        </Grid2>
        <Grid2 size={9}>
          <Slider
            size="small"
            value={canvasHeight}
            onChange={(_, value) => onHeightChange(value as number)}
            min={200}
            max={10000}
            step={50}
            marks={[
              { value: 200, label: '200 px' },
              { value: 10000, label: '10000 px' },
            ]}
            valueLabelDisplay="on"
          />
        </Grid2>
      </Grid2>
    </Container>
  );
};

export default ProcessCanvasController;

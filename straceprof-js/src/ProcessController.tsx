import React, { useRef } from 'react';
import {
  Typography,
  Slider,
  Grid2,
  Container,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { exampleLogs } from './LogExamples';

interface ProcessControllerProps {
  thresholdToShowProcess: number;
  onThresholdChange: (value: number) => void;
  timeRange: [number, number];
  globalTimeRange: [number, number];
  onTimeRangeChange: (value: [number, number]) => void;
  selectedExample: string;
  onExampleChange: (event: SelectChangeEvent<string>) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const copyCommandToClipBoard = () => {
  navigator.clipboard.writeText(
    'strace --trace=execve,execveat,exit,exit_group --follow-forks --string-limit=1000 -ttt --output=straceprof.log <comamnd to profile>'
  );
};

/**
 * ProcessController component for controlling canvas parameters and log selection
 */
const ProcessController: React.FC<ProcessControllerProps> = ({
  thresholdToShowProcess,
  onThresholdChange,
  timeRange,
  globalTimeRange,
  onTimeRangeChange,
  selectedExample,
  onExampleChange,
  onFileChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

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
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        style={{ display: 'none' }}
      />

      <Grid2 container spacing={2}>
        <Grid2 size={6}>
          <Button
            variant="contained"
            startIcon={<ContentCopyIcon />}
            onClick={copyCommandToClipBoard}
          >
            Copy the command line snippet to take a profile log
          </Button>
        </Grid2>
        <Grid2 size={3}>
          <Button
            variant="contained"
            startIcon={<UploadFileIcon />}
            onClick={handleUploadClick}
          >
            Upload log
          </Button>
        </Grid2>
        <Grid2 size={3}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="example-select-label">Load a sample Log</InputLabel>
            <Select
              labelId="example-select-label"
              value={selectedExample}
              onChange={onExampleChange}
              label="Load a sample log"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 48 * 4.5,
                  },
                },
              }}
            >
              {Object.entries(exampleLogs).map(([key, { name }]) => (
                <MenuItem key={key} value={key}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid2>
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
            step={(globalTimeRange[1] - globalTimeRange[0]) / 100} // Dynamic step based on range
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

import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import { Process } from './ProcessUtils';

interface ProcessTableProps {
  processes: Process[];
}

const ProcessTable: React.FC<ProcessTableProps> = ({ processes }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        mt: 3,
        p: 2,
        maxHeight: '500px',
        overflow: 'auto',
        textAlign: 'left',
      }}
    >
      <Divider sx={{ mb: 2 }} />

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>PID</TableCell>
              <TableCell>Program</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Duration (sec)</TableCell>
              <TableCell>Command</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processes.map((process) => (
              <TableRow key={`${process.pid}-${process.startTime}`}>
                <TableCell>{process.pid}</TableCell>
                <TableCell>{process.program.split('/').pop()}</TableCell>
                <TableCell>{process.startTime.toFixed(6)}</TableCell>
                <TableCell>{process.endTime.toFixed(6)}</TableCell>
                <TableCell>
                  {(process.endTime - process.startTime).toFixed(6)}
                </TableCell>
                <TableCell
                  sx={{
                    maxWidth: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {process.fullCommand}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ProcessTable;

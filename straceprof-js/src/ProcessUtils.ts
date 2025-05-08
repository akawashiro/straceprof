import {
  blue,
  cyan,
  deepOrange,
  deepPurple,
  green,
  indigo,
  pink,
  purple,
  red,
  teal,
} from '@mui/material/colors';

/**
 * Maximum number of processes to display in the visualization
 */
export const MAX_PROCESSES_TO_DISPLAY = 100;

// Define the Process type to store information about each process
export type Process = {
  pid: number;
  startTime: number;
  endTime: number;
  program: string;
  fullCommand: string;
};

/**
 * Parse an execve line from strace output
 * Example format:
 * [PID] [TIMESTAMP] execve("[PROGRAM_PATH]", ["ARG1", "ARG2"], [ENV_VARS]) = [RETURN_CODE]
 */
export function parseExecveLine(line: string): Process {
  // Split the line by spaces, handling quotes and parentheses
  const words = line.replace('(', ' ').replace('"', ' ').split(/\s+/);

  // Extract PID and time
  const pid = parseInt(words[0], 10);
  const time = parseFloat(words[1]);

  // Extract program path
  const program = words[3];

  // Extract full command from within square brackets
  let fullCommandInLog = '';
  let inFullCommand = false;

  for (const char of line) {
    if (char === '[') {
      inFullCommand = true;
    }
    if (inFullCommand) {
      fullCommandInLog += char;
    }
    if (char === ']') {
      inFullCommand = false;
    }
  }

  // Clean up the full command string
  const fullCommand = fullCommandInLog
    .replace('[', '')
    .replace(']', '')
    .replace(/"/g, '')
    .replace(/,/g, '');

  return {
    pid,
    startTime: time,
    endTime: 1 << 32, // Use a large number as initial end time
    program,
    fullCommand,
  };
}

/**
 * Process the entire strace log and extract all processes
 */
export function getProcessesFromLog(logContent: string): Process[] {
  // Map to store processes by PID
  const processesMap: Record<number, Process> = {};

  // Process each line in the log
  const lines = logContent.split('\n');
  let n_execve = 0;
  let n_execveat = 0;
  let n_exit = 0;
  let n_exit_group = 0;

  for (const line of lines) {
    if (!line.trim()) continue;

    const words = line.replace('(', ' ').replace('"', ' ').split(/\s+/);

    // Check if this is an execve line (process start)
    if (words.length > 2 && words[2] === 'execve') {
      n_execve++;
      try {
        const process = parseExecveLine(line);
        processesMap[process.pid] = process;
      } catch (error) {
        console.error('Error parsing execve line:', line, error);
      }
    }
    if (words.length > 2 && words[2] === 'execveat') {
      n_execveat++;
      console.error('execveat is not supported yet');
    }

    // Check if this is an exit or exit_group line (process end)
    if (
      words.length > 2 &&
      (words[2] === 'exit' || words[2] === 'exit_group')
    ) {
      if (words[2] === 'exit') {
        n_exit++;
      } else {
        n_exit_group++;
      }
      try {
        const pid = parseInt(words[0], 10);
        if (processesMap[pid]) {
          processesMap[pid].endTime = parseFloat(words[1]);
        } else {
          console.warn(`Cannot find execve corresponding to PID ${pid}`);
        }
      } catch (error) {
        console.error('Error parsing exit line:', line, error);
      }
    }
  }
  console.log(
    `Parsed ${n_execve} execve, ${n_execveat} execveat, ${n_exit} exit, ${n_exit_group} exit_group`
  );

  // Filter out processes without end times
  const legitimateProcesses: Process[] = [];
  for (const pid in processesMap) {
    const process = processesMap[pid];
    if (process.endTime === 1 << 32) {
      console.warn(`PID ${process.pid} ${process.program} has no end time`);
    } else {
      legitimateProcesses.push(process);
    }
  }

  return legitimateProcesses;
}

/**
 * Calculate threshold to show at most MAX_PROCESSES_TO_DISPLAY processes
 * @param processes Array of Process objects
 * @returns Threshold in seconds
 */
export function calculateThresholdToShowProcess(processes: Process[]): number {
  // If we have MAX_PROCESSES_TO_DISPLAY or fewer processes, show all of them
  if (processes.length <= MAX_PROCESSES_TO_DISPLAY) {
    return 0;
  }

  // Calculate duration for each process
  const processDurations = processes.map((p) => p.endTime - p.startTime);

  // Sort durations in descending order
  processDurations.sort((a, b) => b - a);

  // Get the duration of the process at the MAX_PROCESSES_TO_DISPLAY index (0-indexed array)
  const thresholdDuration = processDurations[MAX_PROCESSES_TO_DISPLAY - 1];

  // Return the threshold (rounded to nearest integer for better UX)
  return Math.ceil(thresholdDuration);
}

/**
 * Calculate vCPU allocation for processes
 * @param processes Array of Process objects
 * @param thresholdToShowProcess Minimum duration threshold in seconds
 * @returns Array of vCPU assignments for each process
 */

/**
 * Generate a color map for processes based on program names
 * Using MUI color palette for better visual consistency
 */
export function generateColorMap(processes: Process[]): Record<string, string> {
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

  // Assign colors to programs using MUI color palette
  // Using higher saturation values (700, 800) for better visibility
  const colorList = [
    red[700], // red
    deepOrange[700], // deep orange
    purple[700], // purple
    deepPurple[700], // deep purple
    indigo[700], // indigo
    blue[700], // blue
    cyan[700], // cyan
    teal[700], // teal
    green[700], // green
    pink[700], // pink
  ];

  const colorMap: Record<string, string> = {};
  for (let i = 0; i < Math.min(coloredPrograms.length, colorList.length); i++) {
    colorMap[coloredPrograms[i][0]] = colorList[i];
  }

  return colorMap;
}

export function calculateProcessVcpuAllocation(
  processes: Process[],
  thresholdToShowProcess: number
): number[] {
  // Filter processes based on thresholdToShowProcess
  const filteredProcesses = processes
    .filter((p) => p.endTime - p.startTime >= thresholdToShowProcess)
    .sort((a, b) => a.startTime - b.startTime);

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

  return processToVcpu;
}

/**
 * Calculate global time range from all processes
 * @param processes Array of Process objects
 * @returns Tuple of [min, max] time range, using relative time [0, maxTime - minTime]
 */
export function calculateGlobalTimeRange(
  processes: Process[]
): [number, number] {
  if (processes.length === 0) return [0, 0];

  const minTime = Math.min(...processes.map((p) => p.startTime));
  const maxTime = Math.max(...processes.map((p) => p.endTime));

  // Use relative time: [0, maxTime - minTime] instead of [minTime, maxTime]
  return [0, maxTime - minTime];
}

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

  for (const line of lines) {
    if (!line.trim()) continue;

    const words = line.replace('(', ' ').replace('"', ' ').split(/\s+/);

    // Check if this is an execve line (process start)
    if (words.length > 2 && words[2] === 'execve') {
      const process = parseExecveLine(line);
      processesMap[process.pid] = process;
    }

    // Check if this is an exit or exit_group line (process end)
    if (
      words.length > 2 &&
      (words[2] === 'exit' || words[2] === 'exit_group')
    ) {
      const pid = parseInt(words[0], 10);
      if (processesMap[pid]) {
        processesMap[pid].endTime = parseFloat(words[1]);
      } else {
        console.warn(`Cannot find execve corresponding to PID ${pid}`);
      }
    }
  }

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

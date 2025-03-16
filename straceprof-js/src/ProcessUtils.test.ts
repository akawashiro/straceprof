import { describe, expect, test } from '@jest/globals';
import { getProcessesFromLog, parseExecveLine } from './ProcessUtils';

/**
 * Tests for ProcessUtils functions
 *
 * This test suite uses the sample input from straceprof-js/ls.log
 * embedded directly in the code.
 */
describe('ProcessUtils', () => {
  test('parseExecveLine should parse an execve line correctly', () => {
    // Sample execve line
    const execveLine =
      '22627 1742129218.860822 execve("/usr/bin/ls", ["ls", "-1"], 0x7fff06887510 /* 66 vars */) = 0';

    // Call the function with the sample input
    const process = parseExecveLine(execveLine);

    // Check the parsed values
    expect(process.pid).toBe(22627);
    expect(process.startTime).toBe(1742129218.860822);
    expect(process.program).toContain('/usr/bin/ls');
    expect(process.fullCommand).toContain('ls');
    expect(process.fullCommand).toContain('-1');
    // End time should be initialized to a large number
    expect(process.endTime).toBe(1 << 32);
  });

  test('getProcessesFromLog should parse strace log correctly', () => {
    // Sample log content from straceprof-js/ls.log
    const sampleLogContent = `22627 1742129218.860822 execve("/usr/bin/ls", ["ls", "-1"], 0x7fff06887510 /* 66 vars */) = 0
22627 1742129218.871370 exit_group(0)   = ?
22627 1742129218.871699 +++ exited with 0 +++`;

    // Call the function with the sample input
    const actualProcesses = getProcessesFromLog(sampleLogContent);

    // Use Jest's expect to compare results
    expect(actualProcesses).toHaveLength(1);

    // Check each property individually
    const actual = actualProcesses[0];
    expect(actual.pid).toBe(22627);
    expect(actual.startTime).toBe(1742129218.860822);
    expect(actual.endTime).toBe(1742129218.87137);
    // For string properties, use includes to be more flexible with formatting
    expect(actual.program).toContain('/usr/bin/ls');
    expect(actual.fullCommand).toContain('ls');
    expect(actual.fullCommand).toContain('-1');
  });
});

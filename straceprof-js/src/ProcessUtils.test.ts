import { getProcessesFromLog, Process } from './ProcessUtils';

/**
 * Test for getProcessesFromLog function
 *
 * This test uses the sample input from straceprof-js/ls.log
 * embedded directly in the code.
 */
function testGetProcessesFromLog() {
  // Sample log content from straceprof-js/ls.log
  const sampleLogContent = `22627 1742129218.860822 execve("/usr/bin/ls", ["ls", "-1"], 0x7fff06887510 /* 66 vars */) = 0
22627 1742129218.871370 exit_group(0)   = ?
22627 1742129218.871699 +++ exited with 0 +++`;

  // Expected output based on the sample input
  const expectedProcesses: Process[] = [
    {
      pid: 22627,
      startTime: 1742129218.860822,
      endTime: 1742129218.87137,
      program: '/usr/bin/ls',
      fullCommand: 'ls, -1',
    },
  ];

  // Call the function with the sample input
  const actualProcesses = getProcessesFromLog(sampleLogContent);

  // Compare the actual output with the expected output
  const testPassed =
    actualProcesses.length === expectedProcesses.length &&
    actualProcesses[0].pid === expectedProcesses[0].pid &&
    actualProcesses[0].startTime === expectedProcesses[0].startTime &&
    actualProcesses[0].endTime === expectedProcesses[0].endTime &&
    actualProcesses[0].program === expectedProcesses[0].program &&
    actualProcesses[0].fullCommand === expectedProcesses[0].fullCommand;

  // Log the results
  console.log('Test getProcessesFromLog:');
  console.log('Expected:', JSON.stringify(expectedProcesses, null, 2));
  console.log('Actual:', JSON.stringify(actualProcesses, null, 2));
  console.log('Test passed:', testPassed);

  return testPassed;
}

// Run the test
const testResult = testGetProcessesFromLog();
console.log('All tests passed:', testResult);

// Export the test function for potential reuse
export { testGetProcessesFromLog };

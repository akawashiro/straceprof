import { useEffect } from 'react';
import { getProcessesFromLog } from './ProcessUtils';
import NPM_INSTALL_LOG from './npm_install.log?raw';

/**
 * Test component to debug the process parsing
 */
const TestParser = () => {
  useEffect(() => {
    console.log('TestParser: Running parser test...');

    try {
      // Log a small sample of the input
      console.log(
        'TestParser: Sample log content:',
        NPM_INSTALL_LOG.substring(0, 200) + '...'
      );

      // Try to parse the processes
      const processes = getProcessesFromLog(NPM_INSTALL_LOG);

      // Log the result
      console.log('TestParser: Parsed processes:', processes);
      console.log(`TestParser: Found ${processes.length} processes`);

      if (processes.length === 0) {
        // Analyze the log to see if it contains execve and exit lines
        const lines = NPM_INSTALL_LOG.split('\n');
        const execveLines = lines.filter((line) => line.includes('execve('));
        const exitLines = lines.filter(
          (line) => line.includes('exit(') || line.includes('exit_group(')
        );

        console.log(
          `TestParser: Log contains ${execveLines.length} execve lines`
        );
        console.log(`TestParser: Log contains ${exitLines.length} exit lines`);

        if (execveLines.length > 0) {
          console.log('TestParser: Sample execve line:', execveLines[0]);
        }

        if (exitLines.length > 0) {
          console.log('TestParser: Sample exit line:', exitLines[0]);
        }
      }
    } catch (error) {
      console.error('TestParser: Error parsing log:', error);
    }
  }, []);

  return null; // This component doesn't render anything
};

export default TestParser;

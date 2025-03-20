/**
 * Utility functions for fetching log files
 */

/**
 * Fetch a log file from the public directory
 * @param logName The name of the log file to fetch
 * @returns The content of the log file as a string
 */
export async function fetchLog(logName: string): Promise<string> {
  const response = await fetch(`/straceprof/${logName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch log: ${logName}`);
  }
  return response.text();
}

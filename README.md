# Access [https://akawashiro.com/software/straceprof/](https://akawashiro.com/software/straceprof/)!

# straceprof

A web-based visualization tool for strace logs.

## Features

- Upload and parse strace log files
- Visualize processes in a timeline view
- View process details on hover
- Filter processes by:
  - Minimum duration threshold
  - Regular expression pattern matching
  - Time range selection
- Color-coded visualization by program name
- Responsive canvas-based visualization
- Copy strace command to clipboard with one click
- Includes sample logs (NPM Install, Linux Build) for demonstration

## Introduction

`straceprof` is a profiler designed for multi-process programs. It can visualize the execution of any process when you can run it under [strace](https://strace.io/). It is particularly well-suited for profiling build processes such as those initiated by `make`, `cmake`, shell scripts, or `docker build`.

The web interface allows you to:

- Upload strace log files or select from provided examples
- Visualize processes in a timeline view with color coding by program type
- Filter processes using multiple criteria (duration, time range, regexp)
- Hover over processes to view detailed information
- Copy the strace command to clipboard for easy profiling

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (usually comes with Node.js)

### Installation Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/akawashiro/straceprof.git
   cd straceprof
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Running the Application

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open your browser and navigate to the URL shown in the terminal (usually http://localhost:5173)

### Using the Interface

1. **Getting Started**:

   - Click the "Upload File" button to upload a strace log file
   - Or select a sample log from the dropdown menu
   - Use the "Copy the command line snippet" button to copy the strace command to your clipboard

2. **Visualization Controls**:

   - **Threshold to show processes**: Filter out processes shorter than the specified duration
   - **Time range to visualize**: Focus on a specific time window of the execution
   - **Filter processes by regexp**: Enter a regular expression to filter processes by command name

3. **Interacting with the Visualization**:
   - Hover over process rectangles to see detailed information:
     - Full command
     - Process ID (PID)
     - Duration in seconds
   - Processes are color-coded by program name for easy identification
   - Processes are arranged in rows to avoid overlap

### Generating Strace Logs

To generate a strace log file for use with straceprof, run the following command:

```bash
strace \
    --trace=execve,execveat,exit,exit_group \
    --follow-forks \
    --string-limit=1000 \
    -ttt \
    --output=straceprof.log \
    --seccomp-bpf \
    <command to profile>
```

Replace `<command to profile>` with the command you want to profile, such as `make`, `npm install`, etc.

## How It Works

straceprof parses strace log files to extract information about processes:

1. It looks for `execve` lines to identify when a process starts
2. It looks for `exit` or `exit_group` lines to identify when a process ends
3. It extracts the process ID (PID), start time, end time, program name, and command line
4. It visualizes the processes in a timeline view, with each process represented as a colored rectangle
5. The width of each rectangle represents the duration of the process
6. Processes are arranged vertically to avoid overlap using an efficient allocation algorithm
7. Colors are assigned to processes based on their program name for easier identification

## Implementation Details

- **Canvas-based Visualization**: Uses HTML5 Canvas for efficient rendering of potentially hundreds of processes
- **Process Allocation Algorithm**: Efficiently arranges processes in rows to maximize visibility
- **Responsive Design**: Adjusts to different screen sizes while maintaining usability
- **Color Mapping**: Assigns consistent colors to program types for easier pattern recognition
- **Hover Tooltips**: Provides detailed process information on hover
- **Regular Expression Filtering**: Allows powerful filtering capabilities for complex build processes

## Development

### Technology Stack

- React 19
- TypeScript
- Material UI v6
- Vite for development and building
- Jest for testing

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run lint` - Run ESLint to check for code issues
- `npm run lint:fix` - Run ESLint and automatically fix issues
- `npm run format` - Format code using Prettier
- `npm run format:check` - Check if code is formatted correctly
- `npm run check` - Run format:check and lint
- `npm run preview` - Preview the production build
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Motivation

Software compilation often involves numerous processes, including compilers, assemblers, linkers, and file copying operations. These processes are typically coordinated using tools like `make`.

A common challenge in software development is the significant amount of time required to build software. To expedite this process, it is essential to profile the build to pinpoint performance bottlenecks.

However, profiling build processes can be complex due to the wide range of build systems available. While some build systems incorporate built-in profiling capabilities, others do not. Furthermore, developers frequently combine multiple build systems using shell scripts or Dockerfile to construct a single software product.

straceprof provides a web-based interface for visualizing and analyzing these build processes, making it easier to identify bottlenecks and optimize build times.

## License

[MIT License](https://github.com/akawashiro/straceprof/blob/main/LICENSE)

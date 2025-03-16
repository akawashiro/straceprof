# straceprof-js

A web-based visualization tool for strace logs. This is the JavaScript/web version of the [straceprof](https://github.com/akawashiro/straceprof/tree/main/straceprof-python) Python tool.

## Features

- Upload and parse strace log files
- Visualize processes in a timeline view
- View process details in a table format
- Filter processes by minimum duration
- Customize visualization dimensions
- Includes a sample log for demonstration

## Introduction

`straceprof-js` is a profiler designed for multi-process programs. It can visualize the execution of any process when you can run it under [strace](https://strace.io/). It is particularly well-suited for profiling build processes such as those initiated by `make`, `cmake`, shell scripts, or `docker build`.

The web interface allows you to:

- Upload strace log files
- View a table of all processes with their details
- Visualize the processes in a timeline view
- Filter processes by minimum duration
- Customize the visualization dimensions

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (usually comes with Node.js)

### Installation Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/akawashiro/straceprof.git
   cd straceprof/straceprof-js
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

1. Click the "Upload File" button to upload a strace log file
2. The application will parse the log file and display:
   - A table of all processes with their details
   - A visualization of the processes in a timeline view
3. You can adjust the visualization settings:
   - Minimum Duration: Filter out processes shorter than the specified duration
   - Visualization Width: Adjust the width of the visualization
   - Visualization Height: Adjust the height of the visualization

### Generating Strace Logs

To generate a strace log file for use with straceprof-js, run the following command:

```bash
strace \
    --trace=execve,execveat,exit,exit_group \
    --follow-forks \
    --string-limit=1000 \
    -ttt \
    --output=straceprof.log \
    <command to profile>
```

Replace `<command to profile>` with the command you want to profile, such as `make`, `npm install`, etc.

## How It Works

straceprof-js parses strace log files to extract information about processes:

1. It looks for `execve` lines to identify when a process starts
2. It looks for `exit` or `exit_group` lines to identify when a process ends
3. It extracts the process ID (PID), start time, end time, program name, and command line
4. It visualizes the processes in a timeline view, with each process represented as a colored rectangle
5. The width of each rectangle represents the duration of the process
6. Processes are arranged vertically to avoid overlap

## Development

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

## Related Projects

- [straceprof-python](https://github.com/akawashiro/straceprof/tree/main/straceprof-python) - The Python version of straceprof

## Motivation

Software compilation often involves numerous processes, including compilers, assemblers, linkers, and file copying operations. These processes are typically coordinated using tools like `make`.

A common challenge in software development is the significant amount of time required to build software. To expedite this process, it is essential to profile the build to pinpoint performance bottlenecks.

However, profiling build processes can be complex due to the wide range of build systems available. While some build systems incorporate built-in profiling capabilities, others do not. Furthermore, developers frequently combine multiple build systems using shell scripts or Dockerfile to construct a single software product.

straceprof-js provides a web-based interface for visualizing and analyzing these build processes, making it easier to identify bottlenecks and optimize build times.

## License

[MIT License](https://github.com/akawashiro/straceprof/blob/main/LICENSE)

# Access [https://akawashiro.com/software/straceprof/](https://akawashiro.com/software/straceprof/)!

# straceprof

A web-based visualization tool for strace logs.

## Motivation

Software compilation often involves numerous processes, including compilers, assemblers, linkers, and file copying operations. These processes are typically coordinated using tools like `make`.

A common challenge in software development is the significant amount of time required to build software. To expedite this process, it is essential to profile the build to pinpoint performance bottlenecks.

However, profiling build processes can be complex due to the wide range of build systems available. While some build systems incorporate built-in profiling capabilities, others do not. Furthermore, developers frequently combine multiple build systems using shell scripts or Dockerfile to construct a single software product.

straceprof provides a web-based interface for visualizing and analyzing these build processes, making it easier to identify bottlenecks and optimize build times.

## Introduction

`straceprof` is a profiler designed for multi-process programs. It can visualize the execution of any process when you can run it under [strace](https://strace.io/). It is particularly well-suited for profiling build processes such as those initiated by `make`, `cmake`, shell scripts, or `docker build`.

The web interface allows you to:

- Upload strace log files or select from provided examples
- Visualize processes in a timeline view with color coding by program type
- Filter processes using multiple criteria (duration, time range, regexp)
- Hover over processes to view detailed information
- Copy the strace command to clipboard for easy profiling

## Usage

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
Then, upload the generated `straceprof.log` file to the web interface [https://akawashiro.com/software/straceprof/](https://akawashiro.com/software/straceprof/).

## License

[MIT License](https://github.com/akawashiro/straceprof/blob/main/LICENSE)

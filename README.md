# straceprof

`straceprof` is a profiler designed for multi-process programs. `straceprof`
can take profile of any process when you can run it under `strace`. It is
particularly well-suited for profiling build processes such as those initiated
by `make`, `cmake`, shell scripts, or `docker build`.

## Quick start

Run the following commands.
```bash
$ sudo apt install strace
$ pipx install git+https://github.com/akawashiro/straceprof
$ strace \
    --output=straceprof.log \
    --trace=execve,execveat,exit,exit_group \
    --follow-forks \
    --string-limit=1000 \
    --absolute-timestamps=format:unix,precision:us \
    <command to profile>
$ straceprof \
    --log=straceprof.log \
    --output_image=straceprof.png
```

You will get a nice image!

![Example of straceprof output](https://github.com/akawashiro/straceprof/blob/main/profile_example.png?raw=true "Example of straceprof output")

## Motivation

Software compilation often involves numerous processes, including compilers,
assemblers, linkers, and file copying operations. These processes are typically
coordinated using tools like `make`.

A common challenge in software development is the significant amount of time
required to build software. For instance, building a programming language
processor might take as long as 20 minutes. To expedite this process, it is
essential to profile the build to pinpoint performance bottlenecks.

However, profiling build processes can be complex due to the wide range of
build systems available. While some build systems incorporate built-in
profiling capabilities, others do not. Furthermore, developers frequently
combine multiple build systems using shell scripts or Dockerfile to construct a
single software product.

To address these challenges, an effective profiler should be versatile and
user-friendly. It must be capable of analyzing entire build processes,
regardless of the underlying build system. Additionally, it should be suitable
for various environments, including CI systems like GitHub Actions and
containerized environments, where running privileged profilers such as `perf`
may be restricted.

In conclusion, we require a profiler that can be seamlessly integrated into
diverse build processes without demanding elevated privileges.

## Installation

### On the computer you run the build process
For Ubuntu,
```
$ sudo apt-get install strace
```

I'm sure you can install `strace` on any other distributions easily.

### On the computer you want to generate the profile image

```bash
$ pipx install git+https://github.com/akawashiro/straceprof
```

## Usage

First, you need to generate a strace log file. You can generate a strace log
file using the following command:

```
strace \
    --trace=execve,execveat,exit,exit_group \
    --follow-forks \
    --string-limit=1000 \
    --absolute-timestamps=format:unix,precision:us \
    --output=<path to strace log file> \
    <command to profile>
```

### Note
Do not change the options for `strace` command other than `--output` and
`<command to profile>`. `straceprof` assumes you run `strace` with these
options.

Then, you can generate a profile graph using the following command:

```
straceprof \
    --log=<path to strace log file> \
    --output_image=<path to output image file>
```

Other options are:
```
  -h, --help            show this help message and exit
  --log LOG             strace log file
  --output_image OUTPUT_IMAGE
                        output plot file
  --minimum_duration_sec MINIMUM_DURATION_SEC
                        The minimum duration of a process to be plotted. Shorter processes are omitted.
  --title TITLE         Title of the plot. When you don't specify this, the path to the log file is used.
  --width WIDTH         Width of the figure in pixels
  --height HEIGHT       Height of the figure in pixels
```

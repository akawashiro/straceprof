FROM ubuntu:24.04
RUN apt-get update -y 
RUN apt-get install -y strace git build-essential autoconf python3 python3-venv python3-sphinx python3-sphinx-rtd-theme ninja-build pkg-config libglib2.0-dev flex bison
RUN git clone https://github.com/qemu/qemu.git -b v9.2.3
RUN mkdir /qemu/build
WORKDIR /qemu/build
RUN ../configure
RUN strace --trace=execve,execveat,exit,exit_group --follow-forks --string-limit=1000 -ttt --output=/qemu_build.log make -j32

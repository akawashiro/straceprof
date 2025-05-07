FROM ubuntu:24.04
RUN apt-get update -y
RUN apt-get install -y strace curl build-essential
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup install stable
RUN strace --trace=execve,execveat,exit,exit_group --follow-forks --string-limit=1000 -ttt --output=/uv_build.log cargo install --git https://github.com/astral-sh/uv uv

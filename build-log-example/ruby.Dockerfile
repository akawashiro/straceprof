FROM ubuntu:24.04
RUN apt-get update -y 
RUN apt-get install -y strace git build-essential autoconf ruby
RUN git clone https://github.com/ruby/ruby.git -b v3_4_3
WORKDIR /ruby
RUN ./autogen.sh
RUN mkdir build
WORKDIR /ruby/build
RUN ../configure
RUN strace --trace=execve,execveat,exit,exit_group --follow-forks --string-limit=1000 -ttt --output=/ruby_build.log --seccomp-bpf make -j32

#! /bin/bash

set -eux o pipefail

docker build . -t ruby-build-strace -f ruby.Dockerfile --network host
docker cp $(docker create ruby-build-strace):/ruby_build.log .
docker build . -t qemu-build-strace -f qemu.Dockerfile --network host
docker cp $(docker create qemu-build-strace):/qemu_build.log .
docker build . -t uv-build-strace -f uv.Dockerfile --network host
docker cp $(docker create uv-build-strace):/uv_build.log .

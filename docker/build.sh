#!/bin/bash
set -e

# Image name and tag
IMAGE_NAME="thinkingearth_prototype-base"
IMAGE_TAG="0.0.0-dev"
export IMAGE_NAME
export IMAGE_TAG

#  --no-cache \
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
docker build \
  --file ${DIR}/Dockerfile \
  --secret id=netrc,src=$HOME/.netrc \
  --tag $IMAGE_NAME:$IMAGE_TAG \
  --tag gitlab-master.nvidia.com:5005/dvl/thinkingearth_prototype:main \
  ${DIR}/..


if [ "$1" == "--push" ]; then
  docker push gitlab-master.nvidia.com:5005/dvl/thinkingearth_prototype:main
fi
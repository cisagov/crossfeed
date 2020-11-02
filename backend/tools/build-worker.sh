#!/bin/bash
# Builds worker docker image.
# If testing out tasks locally, you must run this command after making
# any changes to the worker. This command is also run automatically
# at the beginning of ./deploy-worker.sh.

set -e

AWS_ECR_DOMAIN=957221700844.dkr.ecr.us-east-1.amazonaws.com
WORKER_CACHE_TAG=crossfeed-staging-worker
DOCKER_IMAGE=crossfeed-worker

if [ $CI = "true" ]; then
    # From https://gist.github.com/UrsaDK/f90c9632997a70cfe2a6df2797731ac8
    BUILDKIT_URL="$(curl -sL https://api.github.com/repos/moby/buildkit/releases \
        | jq -r 'map(select(.name|startswith("v")))|sort_by(.name)[-1].assets[]|select(.name|endswith(".linux-amd64.tar.gz")).browser_download_url')"
        curl -L "${BUILDKIT_URL}" | sudo tar -xz -C /usr/local
    sudo --non-interactive --shell <<END_SUDO
        install -d -m 0750 -o root -g docker /run/buildkit
        buildkitd &
        while ! test -S /run/buildkit/buildkitd.sock; do sleep 0.1; done
        chgrp docker /run/buildkit/buildkitd.sock
END_SUDO

    cp Dockerfile.worker Dockerfile

    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ECR_DOMAIN

    buildctl build \
        --frontend=dockerfile.v0 --local dockerfile=. --local context=. \
        --export-cache type=registry,ref=$AWS_ECR_DOMAIN/$WORKER_CACHE_TAG:cache,mode=max \
        --import-cache type=registry,ref=$AWS_ECR_DOMAIN/$WORKER_CACHE_TAG:cache
    
else 
    docker build -t $DOCKER_IMAGE -f Dockerfile.worker .
fi
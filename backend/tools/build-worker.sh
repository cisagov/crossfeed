#!/bin/bash
# Builds worker docker image.
# If testing out tasks locally, you must run this command after making
# any changes to the worker. This command is also run automatically
# at the beginning of ./deploy-worker.sh.

set -e

WORKER_TAG=crossfeed-staging-worker

./tools/pull-worker.sh $WORKER_TAG || "Failed to pull worker"

docker build --cache-from local.registry/$WORKER_TAG -t crossfeed-worker -f Dockerfile.worker .
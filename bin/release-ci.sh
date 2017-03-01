#!/bin/bash
set -e

#
# run semantic release only in one version
#
if ./bin/run-if-node-version.js ; then
  npm run semantic-release
fi

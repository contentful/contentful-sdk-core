#!/bin/bash
set -e

#
# run semantic release only in one version
#
if ./node_modules/contentful-sdk-core/bin/run-if-node-version.js ; then
  npm run semantic-release
fi

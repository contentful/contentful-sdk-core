#!/bin/bash
set -e

#
# Build script used by the SDKs to run all the necessary tasks for the CI build
#

# Unit tests, with coverage generation
if ./node_modules/contentful-sdk-core/bin/run-if-node-version.js ; then
  npm run test:cover
else
  npm run test:only
fi

# Create the CommonJS and browser builds, so we can run integration tests using those
npm run build:ci

# Run the node integration tests. Running them on only one version should be enough.
if ./node_modules/contentful-sdk-core/bin/run-if-node-version.js  && [ ! $SKIP_INTEGRATION_TESTS ] ; then
  npm run test:integration
fi

# We only want to run the browser tests on one of the multiple node versions we test on
if ./node_modules/contentful-sdk-core/bin/run-if-node-version.js ; then
  npm run test:browser-remote
fi

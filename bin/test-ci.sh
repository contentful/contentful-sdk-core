#!/bin/bash
set -e

#
# Build script used by the SDKs to run all the necessary tasks for the CI build
#

# Unit tests, with coverage generation
if ./node_modules/contentful-sdk-core/bin/run-if-node-version.js ; then
  npm run test:cover
else
  npm run test:unit
fi

if ./node_modules/contentful-sdk-core/bin/run-if-node-version.js ; then
  # Create the CommonJS and browser builds, so we can run integration tests using those
  npm run build

  # Run the node integration tests only on scheduled tests once a day
  if [ $TRAVIS_EVENT_TYPE = 'cron' ] ; then
    npm run test:integration
  fi

  # Run browser tests only on one node version
  npm run test:browser-remote
fi

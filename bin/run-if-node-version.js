#!/usr/bin/env node

/**
 * This script exits unless the TRAVIS_NODE_VERSION environment variable
 * contains a 6.x version.
 *
 * This is used in package.json to ensure that we are only firing the remote
 * saucelabs browser tests from one of the builds we are running on Travis
 */

var re = new RegExp(process.env.LEAD_NODE_MAJOR_VERSION + '.', 'g')

if (!re.test(process.env.TRAVIS_NODE_VERSION)) {
  process.exit(1)
}

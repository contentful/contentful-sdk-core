# contentful-sdk-core

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
[![NPM Version](https://img.shields.io/npm/v/contentful-sdk-core.svg)](https://www.npmjs.com/package/contentful-sdk-core)
[![npm downloads](https://img.shields.io/npm/dm/contentful-management.svg)](http://npm-stat.com/charts.html?package=contentful-management)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)
[![semantic-release](https://img.shields.io/badge/%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

> This package contains some core modules and utilities used by both the [contentful.js](https://github.com/contentful/contentful.js) and [contentful-management.js](https://github.com/contentful/contentful-management.js) SDKs.

## About

[Contentful](https://www.contentful.com) provides a content infrastructure for digital teams to power content in websites, apps, and devices. Unlike a CMS, Contentful was built to integrate with the modern software stack. It offers a central hub for structured content, powerful management and delivery APIs, and a customizable web app that enable developers and content creators to ship digital products faster.

## Installation

```
npm install --saveDev contentful-sdk-core
```

## Use case

This package contains some core modules and utilities used by both the [contentful.js](https://github.com/contentful/contentful.js) and [contentful-management.js](https://github.com/contentful/contentful-management.js) SDKs.

## Support

This repository is compatible with Node.js version 18 and later. It exclusively provides an ECMAScript Module (ESM) variant, utilizing the `"type": "module"` declaration in `package.json`. Users are responsible for addressing any compatibility issues between ESM and CommonJS (CJS).

## Types

TypeScript definitions for this repository are available through the `"types"` property in `package.json`.

## Development

### Create the default and the es-modules build:

```
npm run build
```

### Run Tests:

Run only the unit tests:

```
npm run test
```

Run unit tests including coverage report:

```
npm run test:cover
```
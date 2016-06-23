# contentful-sdk-core

This package contains some core modules and utilities used by both the [contentful.js](https://github.com/contentful/contentful.js) and [contentful-management.js](https://github.com/contentful/contentful-management.js) SDKs.

## Vendored axios

The `vendor-browser` and `vendor-node` directories contain a vendored build of [axios](https://github.com/mzabriskie/axios) which are used respectively on the standalone browser build and on the published npm package.

Axios is vendored because it expects a native or polyfilled implementation of promises. In this particular case, we vendor axios using babel, which uses the babel-plugin-transform-runtime to transform any usage of promises to requires to `babel-runtime/core-js/promise`.

Axios can be vendored with `npm run vendor:browser` and `npm run vendor:node`.

The browser vendored version runs on top of the standalone Axios browser version which is already optimized for this use case (it's not a good idea to try and run babel on top of the normal axios commonjs package as it produces an unnecessarily large file)

Because of this, the follow-redirects dependency of axios needs to be a dependency on this package as well, otherwise it won't be installed.

The additional `npm run vendor:version` task is unrelated to axios vendoring and is used to build the library version into the code, to avoid having to bundle code for reading a json file in the browser build.

## Future incompatibility between lodash and core-js

According to this [issue](https://github.com/lodash/lodash/commit/e156459176c1f35964fc443b39f04c4cb0a96763#commitcomment-17483355) in the future lodash and core-js will be incompatible.

This means one of two things:
- this package will have to stay on a certain version of lodash
- stop vendoring axios and remove babel-runtime, along with support for node.js 0.10

Given that by the time lodash becomes incompatible with core-js node.js 0.10 will already be officially unsupported, the second approach might be the correct one.

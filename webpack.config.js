'use strict'

var webpack = require('webpack')
var path = require('path')

var plugins = [
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  })
]

if (process.env.NODE_ENV === 'production') {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        screw_ie8: true,
        warnings: false
      }
    })
  )
}

module.exports = {
  context: path.join(__dirname, 'lib'),
  entry: {
    'create-backoff': './create-backoff.js',
    'rate-limit': ['./rate-limit.js'],
    'create-request-config': './create-request-config.js',
    'enforce-obj-path': './enforce-obj-path.js',
    'freeze-sys': ['freeze-sys.js'],
    'promised-wait': ['./promised-wait.js'],
    'wrap-http-client': './wrap-http-config.js',
    'create-http-client': './create-http-client.js'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel-loader'],
      exclude: /node_modules/
    }]
  },
  output: {
    library: 'contentful-sdk-core',
    libraryTarget: 'umd'
  },
  plugins: plugins,
  resolve: {
    extensions: ['', '.js']
  }
}

var SmartBannerPlugin = require('smart-banner-webpack-plugin');

var fs = require("fs")
var localNodeModules = fs.readdirSync("node_modules")

localNodeModules.splice(0, 0, "fs", "net", "path")

module.exports = {
  entry: ['babel-polyfill', './src/main.ts'],
  output: {
    filename: 'out/main.js',
    library: true,
    libraryTarget : 'commonjs2'
  },
  resolve: {
      extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  target: "node", // don't include stubs for `process`, etc.
  externals: localNodeModules,
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      },
      {
        test: function(name) {
          if (/\.tsx?$/.test(name)) {
            return true;
          }

          if (!/\./.test(name)) {
            return true;
          }

          return false;
        },
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader?presets=es2015!ts-loader',
      }
    ]
  },
  plugins: [
    new SmartBannerPlugin(
        '#!/usr/bin/env node\n' +
        'require("source-map-support/register");\n',
        {raw: true, entryOnly: false })
  ],
  devtool: 'source-map'
}


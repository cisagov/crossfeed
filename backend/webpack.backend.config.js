const slsw = require('serverless-webpack');
const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: slsw.lib.entries,
  optimization: {
    minimize: false
  },
  target: 'node',
  // These are not used for being built, and they can't build properly, so we exclude them.
  externals: ['dockerode', 'canvas', 'pg-native'],
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  module: {
    rules: [
      {
        test: [/\.tsx?$/],
        exclude: [/node_modules/, /\.test.tsx?$/],
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  resolve: {
    modules: ['node_modules', path.resolve(__dirname, 'scripts')],
    extensions: ['.ts', '.tsx', '.json', '.js', '.jsx', '...']
  },
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp:
        /^pg-native$|^cloudflare:sockets$|^mongodb$|^react-native-sqlite-storage$|^\@sap\/hana-client$/
    })
  ]
};

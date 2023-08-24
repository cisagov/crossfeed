const slsw = require('serverless-webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: slsw.lib.entries,
  optimization: {
    minimize: false
  },
  target: 'node',
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  module: {
    rules: []
  },
  resolve: {
    modules: ['node_modules', path.resolve(__dirname, 'scripts')],
    extensions: ['.ts', '.tsx', '.json', '.js', '.jsx', '...']
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: './build', to: 'build' }]
    })
  ]
};

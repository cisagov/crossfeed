const slsw = require('serverless-webpack');
const path = require('path');

module.exports = {
  entry: slsw.lib.entries,
  optimization: {
    minimize: false
  },
  target: 'node',
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  module: {
    rules: [
    ]
  },
  resolve: {
    modules: ['node_modules', path.resolve(__dirname, 'scripts')],
    extensions: ['.ts', '.tsx', '.json', '.js', '.jsx', '...']
  }
};

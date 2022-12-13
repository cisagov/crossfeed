const path = require('path');

module.exports = {
  entry: {
    worker: path.join(__dirname, 'src/worker.ts')
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  optimization: {
    minimize: false
  },
  target: 'node',
  // These are not used for being built, and they can't build properly, so we exclude them.
  externals: ['dockerode', 'canvas', 'pg-native', 'ws'],
  mode: 'production',
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
    modules: ['node_modules', 'scripts'],
    extensions: ['.ts', '.tsx', '.json', '.js', '.jsx']
  }
};

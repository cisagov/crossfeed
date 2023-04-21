const path = require('path');
const webpack = require('webpack');

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
  plugins: [
    // These are not used for being built, and they can't build properly, so we exclude them.
    new webpack.NormalModuleReplacementPlugin(
      /(canvas|dockerode|pg-native|ws)/,
      require.resolve('./mock.js')
    )
  ],
  target: 'node',
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

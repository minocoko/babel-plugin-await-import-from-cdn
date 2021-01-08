const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.mjs',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'index.js',
  },
  module: {
    rules: [
      {
        test: /\.(m?)js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  experiments: {
    topLevelAwait: true,
  },
};

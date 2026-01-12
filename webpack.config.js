const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'background/service-worker': './src/background/service-worker.js',
    'content/content-script': './src/content/content-script.js',
    'content/popup-overlay': './src/content/popup-overlay.js',
    'popup/popup': './src/popup/popup.js',
    'options/options': './src/options/options.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { modules: false }]]
          }
        }
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/popup/popup.html', to: 'popup/popup.html' },
        { from: 'src/popup/popup.css', to: 'popup/popup.css' },
        { from: 'src/options/options.html', to: 'options/options.html' },
        { from: 'src/options/options.css', to: 'options/options.css' },
        { from: 'src/content/email-warmer.css', to: 'content/email-warmer.css' },
        { from: 'src/utils/ui-helpers.css', to: 'utils/ui-helpers.css' },
        { from: 'privacy-policy.html', to: 'privacy-policy.html' },
        { from: 'data', to: 'data' },
        { from: 'src/assets/icons', to: 'assets/icons' }
      ]
    })
  ],
  resolve: {
    extensions: ['.js']
  },
  optimization: {
    minimize: false,
    usedExports: true
  },
  experiments: {
    topLevelAwait: true
  },
  performance: {
    maxAssetSize: 2000000,
    maxEntrypointSize: 2000000,
    hints: false
  },
  stats: {
    warnings: false
  },
  ignoreWarnings: [
    /node_modules/
  ]
};


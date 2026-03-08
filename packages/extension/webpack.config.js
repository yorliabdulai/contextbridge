const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  devtool: false,
  entry: {
    background: './src/background.ts',
    'content/claude': './src/content/claude.ts',
    'content/chatgpt': './src/content/chatgpt.ts',
    'content/gemini': './src/content/gemini.ts',
    'popup/popup': './src/popup/popup.ts',
    'import/import': './src/import/import.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/popup/index.html', to: 'popup/index.html' },
        { from: 'src/popup/popup.css', to: 'popup/popup.css' },
        { from: 'src/import/index.html', to: 'import/index.html' },
        { from: 'src/import/import.css', to: 'import/import.css' },
      ],
    }),
  ],
};
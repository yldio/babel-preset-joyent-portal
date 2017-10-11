module.exports = (ctx, opts) => ({
  plugins: [require('babel-plugin-lodash')],
  presets: [require('babel-preset-react-app')],
  env: {
    production: {
      presets: ['minify']
    }
  }
});

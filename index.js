module.exports = (ctx, opts) => ({
  presets: [require('babel-preset-react-app')],
  env: {
    production: {
      presets: ['minify']
    }
  }
});

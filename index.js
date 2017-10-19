module.exports = (ctx, opts) => ({
  plugins: [
    require('babel-plugin-lodash'),
    require('babel-plugin-styled-components').default
  ],
  presets: [require('babel-preset-react-app')],
  env: {
    production: {
      presets: ['minify']
    }
  }
});

const cra = require('babel-preset-react-app');

const { UMD, NODE_ENV } = process.env;
const isProduction = (NODE_ENV || '').toLowerCase() === 'production';

module.exports = (ctx, opts) => {
  const _cra = Object.assign({}, cra);

  if (
    Array.isArray(_cra.presets[0]) &&
    _cra.presets[0][0].match(/babel-preset-env\/lib\/index\.js$/)
  ) {
    // patch babel-preset-env
    _cra.presets[0][1] = Object.assign(_cra.presets[0][1], {
      modules: UMD ? 'umd' : false
    });
  }

  return Object.assign({}, _cra, {
    presets: isProduction ? _cra.presets.concat(['minify']) : _cra.presets,
    plugins: _cra.plugins.concat([
      require('babel-plugin-lodash'),
      require('babel-plugin-styled-components').default
    ])
  });
};

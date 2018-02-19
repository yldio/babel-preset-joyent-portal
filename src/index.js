const cra = require('babel-preset-react-app');
const { isRelativePath } = require('babel-plugin-module-resolver/lib/utils');
const path = require('path');
const fs = require('fs');

const resolvePath = require('./resolve-path');

const { UMD, NODE_ENV } = process.env;

module.exports = (ctx, opts = {}) => {
  const { aliases = false, autoAliases = false } = opts;
  const _cra = Object.assign({}, cra);

  if (
    NODE_ENV !== 'test' &&
    Array.isArray(_cra.presets[0]) &&
    _cra.presets[0][0].match(/babel-preset-env\/lib\/index\.js$/)
  ) {
    // patch babel-preset-env
    _cra.presets[0][1] = Object.assign(_cra.presets[0][1], {
      modules: UMD ? 'umd' : false
    });
  }

  const aliasesConf = {
    extensions: ['.js', '.jsx', '.es', '.es6', '.mjs', '.gql', '.graphql'],
    cwd: 'packagejson',
    resolvePath(sourcePath, currentFile, opts) {
      if (isRelativePath(sourcePath)) {
        return sourcePath;
      }

      const { cwd } = this;
      const ROOT = path.join(cwd, 'src');

      let confAliases = {};

      const dirAliases = autoAliases
        ? fs
            .readdirSync(ROOT)
            .map(name => path.join(ROOT, name))
            .filter(fullpath => fs.statSync(fullpath).isDirectory())
            .reduce(
              (aliases, fullpath) =>
                Object.assign(aliases, {
                  [`@${path.basename(fullpath)}`]: fullpath
                }),
              { '@root': ROOT }
            )
        : {};

      try {
        confAliases = require(path.join(ROOT, '_aliases'));
      } catch (err) {}

      const alias = Object.assign(dirAliases, confAliases);

      return resolvePath(
        sourcePath,
        currentFile,
        Object.assign(opts, {
          alias
        })
      );
    }
  };

  return Object.assign({}, _cra, {
    plugins: _cra.plugins.concat(
      [
        aliases
          ? [require('babel-plugin-module-resolver').default, aliasesConf]
          : undefined,
        require('babel-plugin-inline-import-graphql-ast').default,
        require('babel-plugin-lodash'),
        require('babel-plugin-styled-components').default
      ].filter(Boolean)
    )
  });
};

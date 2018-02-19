const fs = require('fs');
const path = require('path');

const findBabelConfig = require('find-babel-config');
const glob = require('glob');
const pkgUp = require('pkg-up');

const defaultResolvePath = require('babel-plugin-module-resolver/lib/resolvePath');

const defaultExtensions = ['.js', '.jsx', '.es', '.es6', '.mjs'];

const defaultTransformedFunctions = [
  'require',
  'require.resolve',
  'System.import',

  // Jest methods
  'jest.genMockFromModule',
  'jest.mock',
  'jest.unmock',
  'jest.doMock',
  'jest.dontMock',
  'jest.setMock',
  'require.requireActual',
  'require.requireMock'
];

function isRegExp(string) {
  return string.startsWith('^') || string.endsWith('$');
}

const specialCwd = {
  babelrc: startPath => findBabelConfig.sync(startPath).file,
  packagejson: startPath => pkgUp.sync(startPath)
};

function normalizeCwd(optsCwd, currentFile) {
  let cwd;

  if (optsCwd in specialCwd) {
    const startPath = currentFile === 'unknown' ? './' : currentFile;
    const computedCwd = specialCwd[optsCwd](startPath);
    cwd = computedCwd ? path.dirname(computedCwd) : null;
  } else {
    cwd = optsCwd;
  }

  return cwd || process.cwd();
}

function normalizeRoot(optsRoot, cwd) {
  if (!optsRoot) {
    return [];
  }

  const rootArray = Array.isArray(optsRoot) ? optsRoot : [optsRoot];

  return rootArray
    .map(dirPath => path.resolve(cwd, dirPath))
    .reduce((resolvedDirs, absDirPath) => {
      if (glob.hasMagic(absDirPath)) {
        const roots = glob
          .sync(absDirPath)
          .filter(resolvedPath => fs.lstatSync(resolvedPath).isDirectory());

        return resolvedDirs.concat(roots);
      }

      return resolvedDirs.concat(absDirPath);
    }, []);
}

function getAliasTarget(key, isKeyRegExp) {
  const regExpPattern = isKeyRegExp ? key : `^${key}(/.*|)$`;
  return new RegExp(regExpPattern);
}

function getAliasSubstitute(value, isKeyRegExp) {
  if (typeof value === 'function') {
    return value;
  }

  if (!isKeyRegExp) {
    return ([, match]) => `${value}${match}`;
  }

  const parts = value.split('\\\\');

  return execResult =>
    parts
      .map(part =>
        part.replace(/\\\d+/g, number => execResult[number.slice(1)] || '')
      )
      .join('\\');
}

function normalizeAlias(optsAlias) {
  if (!optsAlias) {
    return [];
  }

  const aliasArray = Array.isArray(optsAlias) ? optsAlias : [optsAlias];

  return aliasArray.reduce((aliasPairs, alias) => {
    const aliasKeys = Object.keys(alias);

    aliasKeys.forEach(key => {
      const isKeyRegExp = isRegExp(key);
      aliasPairs.push([
        getAliasTarget(key, isKeyRegExp),
        getAliasSubstitute(alias[key], isKeyRegExp)
      ]);
    });

    return aliasPairs;
  }, []);
}

function normalizeTransformedFunctions(optsTransformFunctions) {
  if (!optsTransformFunctions) {
    return defaultTransformedFunctions;
  }

  return defaultTransformedFunctions.concat(optsTransformFunctions);
}

module.exports = (currentFile, opts) => {
  const cwd = normalizeCwd(opts.cwd, currentFile);
  const root = normalizeRoot(opts.root, cwd);
  const alias = normalizeAlias(opts.alias);
  const extensions = opts.extensions || defaultExtensions;
  const stripExtensions = opts.stripExtensions || extensions;
  const resolvePath = opts.resolvePath || defaultResolvePath;
  const transformFunctions = normalizeTransformedFunctions(
    opts.transformFunctions
  );

  return {
    cwd,
    root,
    alias,
    transformFunctions,
    extensions,
    stripExtensions,
    resolvePath
  };
};

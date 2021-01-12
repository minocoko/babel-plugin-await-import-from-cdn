import pluginTester from 'babel-plugin-tester';
import plugin from '.';
import { dependencies, devDependencies } from '../package.json';

const host = 'https://unpkg.com';
const fallback = 'https://cdn.jsdelivr.net/npm';
const jestPackageVersion = devDependencies.jest;
const babelCorePackageVersion = dependencies['@babel/core'];
const babelPresetEnvPackageVersion = devDependencies['@babel/preset-env'];

pluginTester({
  plugin,
  pluginOptions: {
    host,
  },
  tests: {
    'Import default with special case @ and /': {
      code: "import { version } from '@babel/core';",
      output: `const { version } = await import("${host}/@babel/core@${babelCorePackageVersion}");`,
    },
  },
});

pluginTester({
  plugin,
  pluginOptions: {
    host,
    includeDevDependencies: true,
  },
  tests: {
    'Import default with special case @ and /': {
      code: "import { version } from '@babel/preset-env';",
      output: `const { version } = await import(
  "${host}/@babel/preset-env@${babelPresetEnvPackageVersion}"
);`,
    },
  },
});

pluginTester({
  plugin,
  pluginOptions: {
    host,
    includeDevDependencies: true,
  },
  tests: {
    'Import namespace': {
      code: 'import * as Jest from \'jest\';',
      output: `const Jest = await import("${host}/jest@${jestPackageVersion}");`,
    },
    'Import default': {
      code: 'import Jest from \'jest\';',
      output: `const { default: Jest } = await import("${host}/jest@${jestPackageVersion}");`,
    },
    'Import default with special case @ and /': {
      code: "import { version } from '@babel/core';",
      output: `const { version } = await import("${host}/@babel/core@${babelCorePackageVersion}");`,
    },
    'Import general': {
      code: 'import { run } from \'jest\';',
      output: `const { run } = await import("${host}/jest@${jestPackageVersion}");`,
    },
    'Import default & general': {
      code: 'import Jest, { run } from \'jest\';',
      output: `const { default: Jest, run } = await import("${host}/jest@${jestPackageVersion}");`,
    },
    'Import default & general with extra path': {
      code: 'import Jest, { run } from \'jest/build/jest.js\';',
      output: `const { default: Jest, run } = await import(
  "${host}/jest@${jestPackageVersion}/build/jest.js"
);`, // formatted
    },
  },
});

pluginTester({
  plugin,
  pluginOptions: {
    host,
    includeDevDependencies: true,
    matches: {
      '^jest$': true,
    },
  },
  tests: {
    'Import namespace with matches': {
      code: 'import * as Jest from \'jest\';',
      output: `const Jest = await import("${host}/jest@${jestPackageVersion}");`,
    },
    'Multiple import with matches': {
      code: `import jest from 'jest';
      import './index.css';`,
      output: `const { default: jest } = await import("${host}/jest@${jestPackageVersion}");
import "./index.css";`, // formatted
    },
  },
});

pluginTester({
  plugin,
  pluginOptions: {
    host,
    includeDevDependencies: true,
    matches: {
      '^jest$': '/build/jest.js',
    },
  },
  tests: {
    'Import namespace with matches & extra path': {
      code: 'import * as Jest from \'jest\';',
      output: `const Jest = await import("${host}/jest@${jestPackageVersion}/build/jest.js");`,
    },
  },
});

pluginTester({
  plugin,
  pluginOptions: {
    host,
    fallback,
    includeDevDependencies: true,
  },
  tests: {
    'Import namespace with fallback': {
      code: 'import * as Jest from \'jest\';',
      output: `let Jest;

try {
  Jest = import("${host}/jest@${jestPackageVersion}");
} catch (err) {
  Jest = import("${fallback}/jest@${jestPackageVersion}");
}`, // formatted
    },
    'Import default with fallback': {
      code: 'import Jest from \'jest\';',
      output: `let jestResult;

try {
  jestResult = import("${host}/jest@${jestPackageVersion}");
} catch (err) {
  jestResult = import("${fallback}/jest@${jestPackageVersion}");
}

const { default: Jest } = jestResult;`, // formatted
    },
  },
});

pluginTester({
  plugin,
  pluginOptions: {
    host,
    webpackIgnore: true,
    includeDevDependencies: true,
  },
  tests: {
    'Import namespace with webpackIgnore': {
      code: 'import * as Jest from \'jest\';',
      output: `const Jest = await import(
  /* webpackIgnore: true */
  "${host}/jest@${jestPackageVersion}"
);`,
    },
  },
});

import pluginTester from 'babel-plugin-tester';
import { execSync } from 'child_process';
import plugin from '.';

const cdn = 'https://unpkg.com';
const fallback = 'https://cdn.jsdelivr.net/npm';
const jestPackageVersionResult = execSync('yarn info jest|grep version:', { encoding: 'utf-8' });
const jestPackageVersion = jestPackageVersionResult.replace(/[a-z ,:'\n]/g, '');
const babelCorePackageVersionResult = execSync('yarn info @babel/core|grep version:', { encoding: 'utf-8' });
const babelCorePackageVersion = babelCorePackageVersionResult.replace(/[a-z ,:'\n]/g, '');
const jsonStreamPackageVersionResult = execSync('yarn info JSONStream|grep version:', { encoding: 'utf-8' });
const jsonStreamPackageVersion = jsonStreamPackageVersionResult.replace(/[a-z ,:'\n]/g, '');

pluginTester({
  plugin,
  pluginOptions: {
    cdn,
  },
  tests: {
    'Import namespace': {
      code: 'import * as Jest from \'jest\';',
      output: `const Jest = await import("${cdn}/jest@${jestPackageVersion}");`,
    },
    'Import default': {
      code: 'import Jest from \'jest\';',
      output: `const { default: Jest } = await import("${cdn}/jest@${jestPackageVersion}");`,
    },
    'Import default with special case @ and /': {
      code: "import { version } from '@babel/core';",
      output: `const { version } = await import("${cdn}/@babel/core@${babelCorePackageVersion}");`,
    },
    'Import general': {
      code: 'import { run } from \'jest\';',
      output: `const { run } = await import("${cdn}/jest@${jestPackageVersion}");`,
    },
    'Import default & general': {
      code: 'import Jest, { run } from \'jest\';',
      output: `const { default: Jest, run } = await import("${cdn}/jest@${jestPackageVersion}");`,
    },
    'Import default & general with extra path': {
      code: 'import Jest, { run } from \'jest/build/jest.js\';',
      output: `const { default: Jest, run } = await import(
  "${cdn}/jest@${jestPackageVersion}/build/jest.js"
);`, // formatted
    },
  },
});

pluginTester({
  plugin,
  pluginOptions: {
    cdn,
    matches: {
      '^jest$': true,
    },
  },
  tests: {
    'Import namespace with matches': {
      code: 'import * as Jest from \'jest\';',
      output: `const Jest = await import("${cdn}/jest@${jestPackageVersion}");`,
    },
    'Multiple import with matches': {
      code: `import jest from 'jest';
      import './index.css';`,
      output: `const { default: jest } = await import("${cdn}/jest@${jestPackageVersion}");
import "./index.css";`, // formatted
    },
  },
});

pluginTester({
  plugin,
  pluginOptions: {
    cdn,
    matches: {
      '^jest$': '/build/jest.js',
    },
  },
  tests: {
    'Import namespace with matches & extra path': {
      code: 'import * as Jest from \'jest\';',
      output: `const Jest = await import("${cdn}/jest@${jestPackageVersion}/build/jest.js");`,
    },
  },
});

pluginTester({
  plugin,
  pluginOptions: {
    cdn,
    fallback,
  },
  tests: {
    'Import namespace with fallback': {
      code: 'import * as Jest from \'jest\';',
      output: `let Jest;

try {
  Jest = import("${cdn}/jest@${jestPackageVersion}");
} catch (err) {
  Jest = import("${fallback}/jest@${jestPackageVersion}");
}`, // formatted
    },
    'Import default with fallback': {
      code: 'import Jest from \'jest\';',
      output: `let jestResult;

try {
  jestResult = import("${cdn}/jest@${jestPackageVersion}");
} catch (err) {
  jestResult = import("${fallback}/jest@${jestPackageVersion}");
}

const { default: Jest } = jestResult;`, // formatted
    },
    'Import default with fallback name case': {
      code: 'import JSONStream from \'JSONStream\';',
      output: `let jSONStreamResult;

try {
  jSONStreamResult = import("${cdn}/JSONStream@${jsonStreamPackageVersion}");
} catch (err) {
  jSONStreamResult = import("${fallback}/JSONStream@${jsonStreamPackageVersion}");
}

const { default: JSONStream } = jSONStreamResult;`, // formatted
    },
  },
});

pluginTester({
  plugin,
  pluginOptions: {
    cdn,
    webpackIgnore: true,
  },
  tests: {
    'Import namespace with webpackIgnore': {
      code: 'import * as Jest from \'jest\';',
      output: `const Jest = await import(
  /* webpackIgnore: true */
  "${cdn}/jest@${jestPackageVersion}"
);`,
    },
  },
});

import pluginTester from 'babel-plugin-tester';
import { execSync } from 'child_process';
import plugin from '.';

const cdn = 'https://unpkg.com';
const jestPackageVersionResult = execSync('yarn info jest|grep version:', { encoding: 'utf-8' });
const jestPackageVersion = jestPackageVersionResult.replace(/[a-z ,:'\n]/g, '');

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
    shim: 'system',
  },
  tests: {
    'Import namespace with system.import': {
      code: 'import * as Jest from \'jest\';',
      output: `const Jest = await system.import("${cdn}/jest@${jestPackageVersion}");`,
    },
  },
});

pluginTester({
  plugin,
  pluginOptions: {
    cdn,
    shim: 'system',
    matches: [
      [/^jest$/, '/build/jest.js'],
    ],
  },
  tests: {
    'Import namespace with system.import': {
      code: 'import * as Jest from \'jest\';',
      output: `const Jest = await system.import("${cdn}/jest@${jestPackageVersion}/build/jest.js");`,
    },
    'Multiple import with system.import': {
      code: `import jest from 'jest';
      import './index.css';`,
      output: `const { default: jest } = await system.import(
  "https://unpkg.com/jest@${jestPackageVersion}/build/jest.js"
);
import "./index.css";`, // formatted
    },
  },
});

import pluginTester from 'babel-plugin-tester';
import plugin from '.';

const cdn = 'https://unpkg.com';

pluginTester({
  plugin,
  pluginOptions: {
    cdn,
  },
  tests: {
    'Import namespace': {
      code: 'import * as Jest from \'jest\';',
      output: `const Jest = await import("${cdn}/jest@26.6.3");`,
    },
    'Import default': {
      code: 'import Jest from \'jest\';',
      output: `const { default: Jest } = await import("${cdn}/jest@26.6.3");`,
    },
    'Import general': {
      code: 'import { run } from \'jest\';',
      output: `const { run } = await import("${cdn}/jest@26.6.3");`,
    },
    'Import default & general': {
      code: 'import Jest, { run } from \'jest\';',
      output: `const { default: Jest, run } = await import("${cdn}/jest@26.6.3");`,
    },
    'Import default & general with extra path': {
      code: 'import Jest, { run } from \'jest/build/jest.js\';',
      output: `const { default: Jest, run } = await import(
  "${cdn}/jest@26.6.3/build/jest.js"
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
      output: `const Jest = await system.import("${cdn}/jest@26.6.3");`,
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
      output: `const Jest = await system.import("${cdn}/jest@26.6.3/build/jest.js");`,
    },
  },
});

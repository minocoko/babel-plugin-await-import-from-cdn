<div align="center">
<h1>babel-plugin-await-import-from-cdn</h1>

<p>Allows you to load resources from CDN</p>
</div>

---

[![Build](https://github.com/minocoko/babel-plugin-await-import-from-cdn/workflows/build/badge.svg)](https://github.com/minocoko/babel-plugin-await-import-from-cdn/actions)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/9398e3aa4c4e4874a862ead03536db1f)](https://app.codacy.com/gh/minocoko/babel-plugin-await-import-from-cdn?utm_source=github.com&utm_medium=referral&utm_content=minocoko/babel-plugin-await-import-from-cdn&utm_campaign=Badge_Grade)
[![Coverage Status](https://coveralls.io/repos/github/minocoko/babel-plugin-await-import-from-cdn/badge.svg?branch=main)](https://coveralls.io/github/minocoko/babel-plugin-await-import-from-cdn?branch=main)
[![NPM Version](https://img.shields.io/npm/v/babel-plugin-await-import-from-cdn)](https://www.npmjs.com/package/babel-plugin-await-import-from-cdn)
[![NPM License](https://img.shields.io/npm/l/babel-plugin-await-import-from-cdn)](https://github.com/minocoko/babel-plugin-await-import-from-cdn/blob/main/LICENSE)

This plugin allow you to load resources from CDN by using [top level await](https://github.com/tc39/proposal-top-level-await#dependency-fallbacks) and import function

For example, following code
```javascript
import jQuery from 'jquery';
```
will transpile into
```javascript
let jQuery;
try {
  jQuery = await import('https://cdn-a.com/jQuery');
} catch {
  jQuery = await import('https://cdn-b.com/jQuery');
}
```

## Install
```bash
yarn add -D babel-plugin-await-import-from-cdn @babel/plugin-syntax-top-level-await
```
or
```bash
npm i -D babel-plugin-await-import-from-cdn @babel/plugin-syntax-top-level-await
```


## Usage
```javascript
module.exports = {
  presets: [
    '@babel/preset-env',
  ],
  plugins: [
    '@babel/plugin-syntax-top-level-await',
    ['babel-plugin-await-import-from-cdn', {
      cdn: 'https://cdn.skypack.dev',
      webpackIgnore: true,
      matches: {
        '^react$': true,
      },
    }],
  ],
};
```
For more detail, please check the base use example of this repo


## Options
### cdn
The host url of the cdn provider, for example https://skypack.dev, https://cdnjs.com, https://unpkg.com

### webpackIgnore
if build application with webpack, set webpackIgnore to true;

### fallback
If fallback is set, will try to load resources from cdn, then fallback

### matches
if matches is set, Only matched package will transpile to use CDN resources
If not set, will match all packages in dependencies

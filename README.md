<div align="center">
<h1>babel-plugin-cdn-import</h1>

<p>Allows you to load resources from CDN</p>
</div>

---

![Build](https://github.com/minocoko/babel-plugin-cdn-import/workflows/build/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/minocoko/babel-plugin-cdn-import/badge.svg?branch=main)](https://coveralls.io/github/minocoko/babel-plugin-cdn-import?branch=main)

## Install
```bash
yarn add -D babel-plugin-cdn-import
```
or
```
npm i -D babel-plugin-cdn-import
```


## Usage
Please check the example of this repo.


## Options
### cdn
The host url of the cdn provider, for example https://cdnjs.com, https://unpkg.com, https://skypack.dev

### fallback
If fallback is set, will try to load resources from cdn, then fallback

### shim
Need shim to make import function works.

### matches
Only matched package will transpile to use CDN resources.

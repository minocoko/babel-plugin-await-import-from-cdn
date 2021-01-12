module.exports = {
  presets: [
    '@babel/preset-env',
  ],
  plugins: [
    '@babel/plugin-syntax-top-level-await',
    ['babel-plugin-await-import-from-cdn', {
      host: 'https://cdn.skypack.dev',
      webpackIgnore: true,
    }],
  ],
};

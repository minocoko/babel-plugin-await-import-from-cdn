module.exports = {
  presets: [
    '@babel/preset-env',
  ],
  plugins: [
    '@babel/plugin-syntax-top-level-await',
    ['babel-plugin-await-imort-from-cdn', {
      cdn: 'https://cdn.skypack.dev',
      webpackIgnore: true,
      matches: {
        '^react$': true,
      },
    }],
  ],
};

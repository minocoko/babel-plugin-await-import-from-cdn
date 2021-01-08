module.exports = {
  presets: [
    '@babel/preset-env',
  ],
  plugins: [
    '@babel/plugin-syntax-top-level-await',
    ['babel-plugin-cdn-import', {
      cdn: 'https://cdn.skypack.dev',
      webpackIgnore: true,
      matches: [
        [/^react$/, ''],
      ],
    }],
  ],
};

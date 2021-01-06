module.exports = {
  presets: [
    '@babel/preset-env',
  ],
  plugins: [
    '@babel/plugin-syntax-top-level-await',
    ['babel-plugin-cdn-import', {
      cdn: 'https://unpkg.com',
      shim: 'System',
      matches: [
        [/^react$/, '/umd/react.production.min.js'],
      ],
    }],
  ],
};

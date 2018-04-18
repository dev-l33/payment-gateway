module.exports = {
  apps: [{
    name: 'Payment-Gateway',
    script: './app.js',
    watch: true,
    env: {
      'NODE_ENV': 'production',
    }
  }]
};

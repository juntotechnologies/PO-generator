const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Skip proxying for static assets and hot update files
  app.use(
    ['^/static', '^/sockjs-node', '^/.*\\.hot-update\\.js(on)?$', '^/favicon.ico'],
    (req, res, next) => {
      next();
    }
  );

  // Proxy API requests to the backend
  app.use(
    ['/api', '/admin', '/media'],
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
    })
  );
}; 
const target = process.env.PAX_PROXY_TARGET || 'https://praxis-api-quickstart.onrender.com';
const origin = process.env.PAX_PROXY_ORIGIN || 'http://127.0.0.1:4003';

module.exports = {
  '/api': {
    target,
    changeOrigin: true,
    secure: false,
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('Origin', origin);
    },
  },
  '/schemas': {
    target,
    changeOrigin: true,
    secure: false,
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('Origin', origin);
    },
  },
};

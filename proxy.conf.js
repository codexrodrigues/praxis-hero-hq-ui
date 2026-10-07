const target = process.env.PAX_PROXY_TARGET || 'https://praxis-api-quickstart.onrender.com';
const origin = process.env.PAX_PROXY_ORIGIN || 'http://localhost:4003';

module.exports = {
  '/api': {
    target,
    changeOrigin: true,
    secure: false,
    headers: {
      Origin: origin,
    },
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('Origin', origin);
      proxyReq.setHeader('origin', origin);
    },
  },
  '/schemas': {
    target,
    changeOrigin: true,
    secure: false,
    headers: {
      Origin: origin,
    },
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('Origin', origin);
      proxyReq.setHeader('origin', origin);
    },
  },
};

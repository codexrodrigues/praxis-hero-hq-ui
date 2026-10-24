const target = process.env.PAX_PROXY_TARGET || 'https://praxis-api-quickstart.onrender.com';

// Preserve the browser's Origin/Referer and cookies. The API must admit the actual
// official Hero origin; a development proxy never substitutes an allowed identity.
module.exports = Object.fromEntries(['/api', '/schemas', '/auth'].map(path => [path, {
  target,
  changeOrigin: true,
  secure: true,
}]));

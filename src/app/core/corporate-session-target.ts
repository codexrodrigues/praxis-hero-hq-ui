import { PRAXIS_API_ORIGIN } from './platform.config';

/** Transport classification only; the server remains the authority for every request. */
function configuredRequestPath(
  url: string,
  apiOrigin = PRAXIS_API_ORIGIN,
  browserOrigin = typeof window === 'undefined' ? '' : window.location.origin,
): string | null {
  try {
    const base = new URL(apiOrigin || browserOrigin);
    const absolute = /^https?:\/\//i.test(url);
    if (!absolute && (!url.startsWith('/') || url.startsWith('//'))) return null;
    const rawPath = absolute ? url.replace(/^https?:\/\/[^/?#]+/i, '').split(/[?#]/, 1)[0] || '/' : url.split(/[?#]/, 1)[0];
    // Reject alternate spellings rather than let URL normalization widen this credential scope.
    if (/[\\%;]/.test(rawPath) || rawPath.includes('//') || rawPath.split('/').some(part => part === '.' || part === '..')) return null;
    const parsed = new URL(url, browserOrigin || base.origin);
    if (parsed.origin !== base.origin || parsed.username || parsed.password || parsed.hash) return null;
    const path = parsed.pathname;
    return path;
  } catch { return null; }
}

export function corporateRequestPath(url: string, apiOrigin = PRAXIS_API_ORIGIN, browserOrigin = typeof window === 'undefined' ? '' : window.location.origin): string | null {
  const path = configuredRequestPath(url, apiOrigin, browserOrigin);
  if (path === null) return null;
  if (['/auth/login', '/auth/session', '/auth/logout'].includes(path)) return path;
  return ['/api/praxis/runtime', '/api/praxis/config/pages', '/api/praxis/config/ui-layouts']
    .some(root => path === root || path.startsWith(`${root}/`)) ? path : null;
}

/** The legacy demo interceptor also stays within the configured API origin. */
export function demoApiRequest(url: string): boolean {
  const path = configuredRequestPath(url);
  return path !== null && ['/api', '/schemas'].some(root => path === root || path.startsWith(`${root}/`));
}

export function allowedCorsOrigin(origin: string, requestUrl: string, environment?: string, configuredOrigins = ''): string | null {
  if (!origin || origin === 'null') return null;
  let candidate: URL;
  let request: URL;
  try {
    candidate = new URL(origin);
    request = new URL(requestUrl);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(candidate.protocol) || candidate.origin !== origin) return null;
  if (origin === request.origin) return origin;
  const allowed = configuredOrigins.split(',').map(value => value.trim()).filter(Boolean);
  if (allowed.includes(origin)) return origin;
  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
  if (environment !== 'production' && localHosts.has(request.hostname) && localHosts.has(candidate.hostname)) return origin;
  return null;
}

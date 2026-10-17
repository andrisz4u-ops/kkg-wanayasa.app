// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderHTML } from '../src/templates/layout';

function runBootMarker(cookie: string): boolean {
  const html = renderHTML();
  const markerScript = html.match(/<script>\s*\/\/[\s\S]*?\(function\(\) \{[\s\S]*?document\.cookie[\s\S]*?<\/script>/)?.[0];
  expect(markerScript, 'rendered boot-marker script exists').toBeDefined();
  const script = markerScript!.replace(/^<script>|<\/script>$/g, '');
  const classes = new Set<string>();
  const document = {
    cookie,
    documentElement: { classList: { add: (name: string) => classes.add(name) } },
  };
  new Function('document', script)(document);
  return classes.has('kkg-boot-auth');
}

describe('rendered template auth boot marker', () => {
  it.each([
    ['marker first', 'kkg_logged_in=1; session=abc', true],
    ['session first with semicolon-space', 'session=abc; kkg_logged_in=1', true],
    ['session first with multiple spaces', 'session=abc;   kkg_logged_in=1; other=x', true],
    ['missing marker', 'session=abc; other=x', false],
    ['marker value is false', 'session=abc; kkg_logged_in=0', false],
    ['marker-like cookie name', 'not_kkg_logged_in=1', false],
    ['marker-like value', 'session=kkg_logged_in=1', false],
    ['marker name prefix', 'kkg_logged_in_extra=1', false],
  ])('%s', (_case, cookie, expected) => {
    expect(runBootMarker(cookie)).toBe(expected);
  });
});

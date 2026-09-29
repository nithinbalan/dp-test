import { describe, expect, it } from 'vitest';
import { isValidWorkspaceSlug, resolveWorkspaceSlugFromHost } from '../context';

describe('resolveWorkspaceSlugFromHost', () => {
  it('extracts the slug from a subdomain host', () => {
    expect(resolveWorkspaceSlugFromHost('acme.jethurdpdp.com')).toBe('acme');
  });

  it('is case-insensitive', () => {
    expect(resolveWorkspaceSlugFromHost('Acme.jethurdpdp.com')).toBe('acme');
  });

  it('ignores a port suffix', () => {
    expect(resolveWorkspaceSlugFromHost('acme.jethurdpdp.com:3000')).toBe('acme');
  });

  it('returns null for the apex domain (no subdomain)', () => {
    expect(resolveWorkspaceSlugFromHost('jethurdpdp.com')).toBeNull();
  });

  it('returns null for a bare local host', () => {
    expect(resolveWorkspaceSlugFromHost('localhost:3000')).toBeNull();
  });

  it('returns null for a reserved subdomain', () => {
    expect(resolveWorkspaceSlugFromHost('www.jethurdpdp.com')).toBeNull();
    expect(resolveWorkspaceSlugFromHost('api.jethurdpdp.com')).toBeNull();
  });

  it('returns null for a shape-invalid subdomain', () => {
    expect(resolveWorkspaceSlugFromHost('a.jethurdpdp.com')).toBeNull(); // too short
    expect(resolveWorkspaceSlugFromHost('Ac_me.jethurdpdp.com')).toBeNull(); // invalid chars
  });

  it('returns null for a missing host', () => {
    expect(resolveWorkspaceSlugFromHost(null)).toBeNull();
  });
});

describe('isValidWorkspaceSlug', () => {
  it('accepts a well-formed slug', () => {
    expect(isValidWorkspaceSlug('acme-inc')).toBe(true);
  });

  it('rejects reserved slugs', () => {
    expect(isValidWorkspaceSlug('admin')).toBe(false);
  });

  it('rejects a pg_ prefixed slug', () => {
    expect(isValidWorkspaceSlug('pg_internal')).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { parseGitHubRemoteUrl, isGitHubRemoteUrl } from './utils';

describe('parseGitHubRemoteUrl', () => {
  it('parses SSH URLs', () => {
    const result = parseGitHubRemoteUrl('git@github.com:owner/repo.git');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('parses SSH URLs without .git suffix', () => {
    const result = parseGitHubRemoteUrl('git@github.com:owner/repo');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('parses HTTPS URLs', () => {
    const result = parseGitHubRemoteUrl('https://github.com/owner/repo.git');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('parses HTTPS URLs without .git suffix', () => {
    const result = parseGitHubRemoteUrl('https://github.com/owner/repo');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('parses HTTP URLs', () => {
    const result = parseGitHubRemoteUrl('http://github.com/owner/repo');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('handles repos with dashes and underscores', () => {
    const ssh = parseGitHubRemoteUrl('git@github.com:my-org/my_repo-name.git');
    expect(ssh).toEqual({ owner: 'my-org', repo: 'my_repo-name' });

    const https = parseGitHubRemoteUrl('https://github.com/my-org/my_repo-name');
    expect(https).toEqual({ owner: 'my-org', repo: 'my_repo-name' });
  });

  it('handles URLs with trailing whitespace', () => {
    const result = parseGitHubRemoteUrl('  git@github.com:owner/repo.git  ');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('returns null for empty strings', () => {
    expect(parseGitHubRemoteUrl('')).toBeNull();
  });

  it('returns null for non-GitHub URLs', () => {
    expect(parseGitHubRemoteUrl('git@gitlab.com:owner/repo.git')).toBeNull();
    expect(parseGitHubRemoteUrl('https://gitlab.com/owner/repo')).toBeNull();
    expect(parseGitHubRemoteUrl('https://bitbucket.org/owner/repo')).toBeNull();
  });

  it('returns null for malformed URLs', () => {
    expect(parseGitHubRemoteUrl('not a url')).toBeNull();
    expect(parseGitHubRemoteUrl('github.com/owner/repo')).toBeNull();
    expect(parseGitHubRemoteUrl('https://github.com')).toBeNull();
    expect(parseGitHubRemoteUrl('https://github.com/owner')).toBeNull();
  });
});

describe('isGitHubRemoteUrl', () => {
  it('returns true for GitHub URLs', () => {
    expect(isGitHubRemoteUrl('git@github.com:owner/repo.git')).toBe(true);
    expect(isGitHubRemoteUrl('https://github.com/owner/repo')).toBe(true);
    expect(isGitHubRemoteUrl('https://GITHUB.COM/owner/repo')).toBe(true);
  });

  it('returns false for non-GitHub URLs', () => {
    expect(isGitHubRemoteUrl('git@gitlab.com:owner/repo.git')).toBe(false);
    expect(isGitHubRemoteUrl('https://bitbucket.org/owner/repo')).toBe(false);
  });

  it('returns false for empty strings', () => {
    expect(isGitHubRemoteUrl('')).toBe(false);
  });
});

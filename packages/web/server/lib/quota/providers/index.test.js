import { describe, expect, it } from 'vitest';

import * as google from './google/index.js';
import { listConfiguredQuotaProviders } from './index.js';

describe('quota provider registry', () => {
  it('loads fork quota providers through the upstream registry contract', async () => {
    const quota = await import('../index.js');

    expect(typeof quota.fetchNeuralwattQuota).toBe('function');
    expect(typeof quota.fetchXiaomiTokenPlanQuota).toBe('function');
  });

  it('exposes google provider configuration helpers through the provider module', () => {
    expect(google.providerId).toBe('google');
    expect(google.providerName).toBe('Google');
    expect(typeof google.isConfigured).toBe('function');
    expect(typeof google.resolveGoogleAuthSources).toBe('function');
  });

  it('can list configured providers without missing provider exports', () => {
    expect(() => listConfiguredQuotaProviders()).not.toThrow();
  });
});

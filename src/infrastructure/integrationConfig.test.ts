import { describe, expect, it } from 'vitest';
import {
  createEmptyHttpIntegrationConfig,
  loadIntegrationConfig,
  saveIntegrationConfig,
  validateIntegrationConfig,
  type IntegrationStorage
} from './integrationConfig';

class MemoryStorage implements IntegrationStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}

describe('integrationConfig', () => {
  it('accepts demo without external endpoints', () => {
    expect(validateIntegrationConfig({ mode: 'demo' })).toEqual([]);
  });

  it('rejects a real profile until base URL and required endpoint mappings are complete', () => {
    const config = createEmptyHttpIntegrationConfig();
    const errors = validateIntegrationConfig(config);
    expect(errors.some(error => error.field === 'baseUrl')).toBe(true);
    expect(errors.some(error => error.field === 'health')).toBe(true);
    expect(errors.some(error => error.field === 'authenticate')).toBe(true);
    expect(errors.some(error => error.field === 'sendDocument')).toBe(true);
  });

  it('rejects insecure remote HTTP but allows localhost for development', () => {
    const config = createEmptyHttpIntegrationConfig();
    config.baseUrl = 'http://api.example.com';
    expect(validateIntegrationConfig(config).some(error => error.field === 'baseUrl')).toBe(true);

    config.baseUrl = 'http://127.0.0.1:8787';
    expect(validateIntegrationConfig(config).some(error => error.field === 'baseUrl')).toBe(false);
  });

  it('persists only the connection profile and can restore it', () => {
    const storage = new MemoryStorage();
    const config = createEmptyHttpIntegrationConfig();
    config.baseUrl = 'https://api.example.com';
    config.endpoints.health = '/health';
    config.endpoints.authenticate = '/login';
    config.endpoints.createAccount = '/accounts';
    config.endpoints.requestPasswordReset = '/password-reset';
    config.endpoints.commercialSnapshot = '/snapshot';
    config.endpoints.upsertCustomer = '/customers/upsert';
    config.endpoints.sendDocument = '/documents/send';
    config.endpoints.missions = '/missions';
    config.endpoints.missionReturn = '/missions/return';
    config.endpoints.location = '/location';
    config.endpoints.sellerReport = '/reports/seller';
    config.endpoints.onlineSession = '/online/session';
    config.endpoints.whatsappStatus = '/whatsapp/status';
    config.endpoints.pushSubscription = '/push/subscription';

    saveIntegrationConfig(storage, config);
    expect(loadIntegrationConfig(storage)).toEqual(config);
  });
});

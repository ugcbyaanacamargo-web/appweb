import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IntegrationConfig } from './integrationConfig';
import { HttpOrisGateway } from './httpOrisGateway';

const config: IntegrationConfig = {
  mode: 'http',
  baseUrl: 'https://api.example.com',
  endpoints: {
    health: '/health',
    authenticate: '/login',
    createAccount: '/accounts',
    requestPasswordReset: '/password-reset',
    commercialSnapshot: '/snapshot',
    upsertCustomer: '/customers/upsert',
    sendDocument: '/documents/send',
    missions: '/missions',
    missionReturn: '/missions/return',
    location: '/location',
    sellerReport: '/reports/seller',
    onlineSession: '/online/session',
    whatsappStatus: '/whatsapp/status',
    pushSubscription: '/push/subscription'
  }
};

afterEach(() => vi.unstubAllGlobals());

describe('HttpOrisGateway', () => {
  it('tests the configured health endpoint before activation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const gateway = new HttpOrisGateway(config);
    await expect(gateway.testConnection()).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/health', expect.objectContaining({ method: 'GET' }));
  });

  it('authenticates using the configured endpoint and returns the gateway contract', async () => {
    const body = {
      data: {
        user: { id: 'u1', name: 'Ana', email: 'ana@example.com' },
        companies: [{ id: 'c1', name: 'Empresa' }],
        token: 'session-token'
      }
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 })));
    const gateway = new HttpOrisGateway(config);
    await expect(gateway.authenticate({ email: 'ana@example.com', password: '123456' })).resolves.toEqual(body.data);
  });

  it('sends authenticated requests with bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: {
        periodLabel: 'Atual',
        ordersCount: 1,
        quotesCount: 0,
        grossSales: 100,
        commissionPercent: 5,
        commissionValue: 5
      }
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const gateway = new HttpOrisGateway(config);
    await gateway.fetchSellerReport({ companyId: 'c1', userId: 'u1', scopeKey: 's', token: 'abc' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/reports/seller',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer abc' }) })
    );
  });

  it('maps authentication failures to GatewayError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 'auth_failed', message: 'Credenciais inválidas' }
    }), { status: 401 })));
    const gateway = new HttpOrisGateway(config);
    await expect(gateway.authenticate({ email: 'x@example.com', password: 'bad' }))
      .rejects.toMatchObject({ code: 'AUTH_FAILED' });
  });
});

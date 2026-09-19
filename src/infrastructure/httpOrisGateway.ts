import type {
  AuthResult,
  CommercialSnapshot,
  Customer,
  Mission,
  OnlineSessionResult,
  PushSubscriptionPayload,
  SalesDocument,
  SellerReport,
  SendDocumentResult,
  WhatsappIntegrationStatus
} from '../domain/models';
import {
  GatewayError,
  type AccountInput,
  type GatewayContext,
  type OrisGateway
} from './orisGateway';
import {
  resolveIntegrationUrl,
  validateIntegrationConfig,
  type HttpIntegrationConfig
} from './integrationConfig';

interface ErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
  };
}

function errorCode(status: number, externalCode?: string): GatewayError['code'] {
  const normalized = externalCode?.toLowerCase();
  if (status === 401 || normalized === 'auth_failed') return 'AUTH_FAILED';
  if (status === 403 && normalized === 'account_blocked') return 'ACCOUNT_BLOCKED';
  if (status >= 500) return 'SERVER';
  if (status >= 400) return 'INVALID_DATA';
  return 'NETWORK';
}

function scopedHeaders(context?: GatewayContext): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json'
  };
  if (context?.token) headers.Authorization = 'Bearer ' + context.token;
  if (context?.companyId) headers['X-Oris-Company-Id'] = context.companyId;
  if (context?.userId) headers['X-Oris-User-Id'] = context.userId;
  return headers;
}

export class HttpOrisGateway implements OrisGateway {
  constructor(private readonly config: HttpIntegrationConfig) {
    const errors = validateIntegrationConfig(config);
    if (errors.length) {
      throw new GatewayError('INVALID_DATA', errors[0].message);
    }
  }

  private async request<T>(
    endpoint: keyof HttpIntegrationConfig['endpoints'],
    init: RequestInit,
    context?: GatewayContext
  ): Promise<T> {
    const url = resolveIntegrationUrl(this.config, this.config.endpoints[endpoint]);
    const headers: Record<string, string> = {
      ...scopedHeaders(context),
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers as Record<string, string> | undefined)
    };

    let response: Response;
    try {
      response = await fetch(url, { ...init, headers });
    } catch {
      throw new GatewayError('NETWORK', 'Não foi possível conectar à API Óris360° configurada.');
    }

    let payload: unknown = undefined;
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        if (response.ok) {
          throw new GatewayError('INVALID_DATA', 'A API respondeu em formato inválido.');
        }
      }
    }

    if (!response.ok) {
      const envelope = (payload ?? {}) as ErrorEnvelope;
      throw new GatewayError(
        errorCode(response.status, envelope.error?.code),
        envelope.error?.message || 'A API retornou erro HTTP ' + response.status + '.'
      );
    }

    if (payload && typeof payload === 'object' && 'data' in payload) {
      return (payload as { data: T }).data;
    }
    return payload as T;
  }

  async testConnection(): Promise<{ ok: true }> {
    const result = await this.request<{ ok?: boolean }>('health', { method: 'GET' });
    if (result && result.ok === false) {
      throw new GatewayError('SERVER', 'A API respondeu, mas informou que não está saudável.');
    }
    return { ok: true };
  }

  authenticate(input: AccountInput): Promise<AuthResult> {
    return this.request('authenticate', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  createAccount(input: AccountInput): Promise<AuthResult> {
    return this.request('createAccount', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  async requestPasswordReset(input: { email: string }): Promise<void> {
    await this.request<unknown>('requestPasswordReset', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  fetchCommercialSnapshot(context: GatewayContext): Promise<CommercialSnapshot> {
    return this.request('commercialSnapshot', { method: 'GET' }, context);
  }

  upsertCustomer(context: GatewayContext, customer: Customer): Promise<Customer> {
    return this.request('upsertCustomer', {
      method: 'POST',
      body: JSON.stringify({ customer })
    }, context);
  }

  sendDocument(context: GatewayContext, document: SalesDocument): Promise<SendDocumentResult> {
    return this.request('sendDocument', {
      method: 'POST',
      body: JSON.stringify({ document })
    }, context);
  }

  fetchMissions(context: GatewayContext): Promise<Mission[]> {
    return this.request('missions', { method: 'GET' }, context);
  }

  async sendMissionReturn(context: GatewayContext, mission: Mission): Promise<void> {
    await this.request<unknown>('missionReturn', {
      method: 'POST',
      body: JSON.stringify({ mission })
    }, context);
  }

  async sendLocation(
    context: GatewayContext,
    position: { latitude: number; longitude: number; capturedAt: string }
  ): Promise<void> {
    await this.request<unknown>('location', {
      method: 'POST',
      body: JSON.stringify(position)
    }, context);
  }

  fetchSellerReport(context: GatewayContext): Promise<SellerReport> {
    return this.request('sellerReport', { method: 'GET' }, context);
  }

  createOnlineSession(context: GatewayContext): Promise<OnlineSessionResult> {
    return this.request('onlineSession', { method: 'POST' }, context);
  }

  fetchWhatsappIntegrationStatus(context: GatewayContext): Promise<WhatsappIntegrationStatus> {
    return this.request('whatsappStatus', { method: 'GET' }, context);
  }

  async registerMissionPushSubscription(
    context: GatewayContext,
    subscription: PushSubscriptionPayload
  ): Promise<void> {
    await this.request<unknown>('pushSubscription', {
      method: 'POST',
      body: JSON.stringify({ subscription })
    }, context);
  }
}

import type {
  AuthResult,
  CommercialSnapshot,
  Customer,
  DocumentItem,
  Mission,
  OnlineSessionResult,
  Product,
  PushSubscriptionPayload,
  SalesDocument,
  SellerReport,
  SendDocumentResult,
  UserIdentity,
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

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new GatewayError('INVALID_DATA', 'Resposta inválida da API: campo ' + field + ' ausente ou inválido.');
  }
  return value;
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new GatewayError('INVALID_DATA', 'Resposta inválida da API: campo ' + field + ' inválido.');
  }
  return value;
}

function requiredBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new GatewayError('INVALID_DATA', 'Resposta inválida da API: campo ' + field + ' ausente ou inválido.');
  }
  return value;
}

function requiredNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new GatewayError('INVALID_DATA', 'Resposta inválida da API: campo ' + field + ' ausente ou inválido.');
  }
  return value;
}

function recordOrInvalid(value: unknown, label: string): JsonRecord {
  if (!isRecord(value)) {
    throw new GatewayError('INVALID_DATA', 'Resposta inválida da API: ' + label + ' deve ser um objeto.');
  }
  return value;
}

function arrayOrInvalid(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new GatewayError('INVALID_DATA', 'Resposta inválida da API: ' + label + ' deve ser uma lista.');
  }
  return value;
}

function parseUser(value: unknown): UserIdentity {
  const row = recordOrInvalid(value, 'user');
  return {
    id: requiredString(row.id, 'user.id'),
    name: requiredString(row.name, 'user.name'),
    email: requiredString(row.email, 'user.email')
  };
}

function parseAuthResult(value: unknown): AuthResult {
  const row = recordOrInvalid(value, 'login');
  const companies = arrayOrInvalid(row.companies, 'companies').map((company, index) => {
    const item = recordOrInvalid(company, 'companies[' + index + ']');
    return {
      id: requiredString(item.id, 'companies[' + index + '].id'),
      name: requiredString(item.name, 'companies[' + index + '].name'),
      role: item.role === 'owner' || item.role === 'admin' || item.role === 'seller' ? item.role : 'seller'
    };
  });
  return {
    user: parseUser(row.user),
    companies,
    token: requiredString(row.token, 'token')
  };
}

function parseCustomer(value: unknown, indexLabel = 'customer', scopeKey?: string): Customer {
  const row = recordOrInvalid(value, indexLabel);
  const extraFieldsValue = row.extraFields;
  let extraFields: Record<string, string> | undefined;
  if (extraFieldsValue != null) {
    const extraRow = recordOrInvalid(extraFieldsValue, indexLabel + '.extraFields');
    extraFields = {};
    for (const [key, fieldValue] of Object.entries(extraRow)) {
      if (typeof fieldValue !== 'string') {
        throw new GatewayError('INVALID_DATA', 'Resposta inválida da API: ' + indexLabel + '.extraFields.' + key + ' inválido.');
      }
      extraFields[key] = fieldValue;
    }
  }
  return {
    id: requiredString(row.id, indexLabel + '.id'),
    officialId: optionalString(row.officialId, indexLabel + '.officialId'),
    scopeKey: scopeKey ?? requiredString(row.scopeKey, indexLabel + '.scopeKey'),
    name: requiredString(row.name, indexLabel + '.name'),
    taxId: requiredString(row.taxId, indexLabel + '.taxId'),
    extraFields,
    active: requiredBoolean(row.active, indexLabel + '.active'),
    pendingSync: scopeKey ? false : requiredBoolean(row.pendingSync, indexLabel + '.pendingSync'),
    updatedAt: requiredString(row.updatedAt, indexLabel + '.updatedAt')
  };
}

function parseProduct(value: unknown, indexLabel = 'product', scopeKey?: string): Product {
  const row = recordOrInvalid(value, indexLabel);
  return {
    id: requiredString(row.id, indexLabel + '.id'),
    scopeKey: scopeKey ?? requiredString(row.scopeKey, indexLabel + '.scopeKey'),
    name: requiredString(row.name, indexLabel + '.name'),
    sku: requiredString(row.sku, indexLabel + '.sku'),
    active: requiredBoolean(row.active, indexLabel + '.active'),
    price: requiredNumber(row.price, indexLabel + '.price'),
    stock: requiredNumber(row.stock, indexLabel + '.stock'),
    description: optionalString(row.description, indexLabel + '.description'),
    imageUrl: optionalString(row.imageUrl, indexLabel + '.imageUrl'),
    updatedAt: requiredString(row.updatedAt, indexLabel + '.updatedAt')
  };
}

function parseCommercialSnapshot(value: unknown, scopeKey: string): CommercialSnapshot {
  const row = recordOrInvalid(value, 'commercialSnapshot');
  const settings = recordOrInvalid(row.settings, 'commercialSnapshot.settings');

  return {
    version: requiredString(row.version, 'commercialSnapshot.version'),
    synchronizedAt: requiredString(row.synchronizedAt, 'commercialSnapshot.synchronizedAt'),
    customers: arrayOrInvalid(row.customers, 'commercialSnapshot.customers')
      .map((customer, index) => parseCustomer(customer, 'commercialSnapshot.customers[' + index + ']', scopeKey)),
    products: arrayOrInvalid(row.products, 'commercialSnapshot.products')
      .map((product, index) => parseProduct(product, 'commercialSnapshot.products[' + index + ']', scopeKey)),
    settings: {
      allowSaleWithoutStock: requiredBoolean(
        settings.allowSaleWithoutStock,
        'commercialSnapshot.settings.allowSaleWithoutStock'
      ),
      accountBlocked: requiredBoolean(settings.accountBlocked, 'commercialSnapshot.settings.accountBlocked'),
      helpPhone: optionalString(settings.helpPhone, 'commercialSnapshot.settings.helpPhone'),
      helpEmail: optionalString(settings.helpEmail, 'commercialSnapshot.settings.helpEmail'),
      onlineBaseUrl: optionalString(settings.onlineBaseUrl, 'commercialSnapshot.settings.onlineBaseUrl'),
      missionPushPublicKey: optionalString(
        settings.missionPushPublicKey,
        'commercialSnapshot.settings.missionPushPublicKey'
      ),
      customerFields: Array.isArray(settings.customerFields)
        ? settings.customerFields.map((field, index) => {
            const item = recordOrInvalid(field, 'commercialSnapshot.settings.customerFields[' + index + ']');
            const type = requiredString(item.type, 'commercialSnapshot.settings.customerFields[' + index + '].type');
            if (!['text', 'email', 'tel', 'number', 'date'].includes(type)) {
              throw new GatewayError(
                'INVALID_DATA',
                'Resposta inválida da API: tipo de campo de cliente não suportado.'
              );
            }
            return {
              key: requiredString(item.key, 'commercialSnapshot.settings.customerFields[' + index + '].key'),
              label: requiredString(item.label, 'commercialSnapshot.settings.customerFields[' + index + '].label'),
              type: type as 'text' | 'email' | 'tel' | 'number' | 'date',
              required: item.required === true || undefined,
              maxLength: typeof item.maxLength === 'number' && Number.isFinite(item.maxLength)
                ? item.maxLength
                : undefined
            };
          })
        : undefined
    }
  };
}

function parseDocumentItem(value: unknown, label: string): DocumentItem {
  const row = recordOrInvalid(value, label);
  return {
    productId: requiredString(row.productId, label + '.productId'),
    quantity: requiredNumber(row.quantity, label + '.quantity'),
    unitPrice: requiredNumber(row.unitPrice, label + '.unitPrice')
  };
}

function parseSendDocumentResult(value: unknown): SendDocumentResult {
  const row = recordOrInvalid(value, 'sendDocument');
  return {
    officialNumber: requiredString(row.officialNumber, 'sendDocument.officialNumber'),
    acceptedItems: arrayOrInvalid(row.acceptedItems, 'sendDocument.acceptedItems')
      .map((item, index) => parseDocumentItem(item, 'sendDocument.acceptedItems[' + index + ']')),
    sentAt: requiredString(row.sentAt, 'sendDocument.sentAt')
  };
}

function parseMission(value: unknown, label: string, scopeKey?: string): Mission {
  const row = recordOrInvalid(value, label);
  const evidence = row.evidence == null
    ? undefined
    : arrayOrInvalid(row.evidence, label + '.evidence').map((item, index) =>
        requiredString(item, label + '.evidence[' + index + ']')
      );
  return {
    id: requiredString(row.id, label + '.id'),
    scopeKey: scopeKey ?? requiredString(row.scopeKey, label + '.scopeKey'),
    title: requiredString(row.title, label + '.title'),
    description: optionalString(row.description, label + '.description'),
    completed: requiredBoolean(row.completed, label + '.completed'),
    pendingReturn: scopeKey ? false : requiredBoolean(row.pendingReturn, label + '.pendingReturn'),
    notes: optionalString(row.notes, label + '.notes'),
    evidence,
    latitude: row.latitude == null ? undefined : requiredNumber(row.latitude, label + '.latitude'),
    longitude: row.longitude == null ? undefined : requiredNumber(row.longitude, label + '.longitude'),
    assignedAt: requiredString(row.assignedAt, label + '.assignedAt'),
    completedAt: optionalString(row.completedAt, label + '.completedAt')
  };
}

function parseMissions(value: unknown, scopeKey: string): Mission[] {
  return arrayOrInvalid(value, 'missions').map((mission, index) =>
    parseMission(mission, 'missions[' + index + ']', scopeKey)
  );
}

function parseSellerReport(value: unknown): SellerReport {
  const row = recordOrInvalid(value, 'sellerReport');
  return {
    periodLabel: requiredString(row.periodLabel, 'sellerReport.periodLabel'),
    ordersCount: requiredNumber(row.ordersCount, 'sellerReport.ordersCount'),
    quotesCount: requiredNumber(row.quotesCount, 'sellerReport.quotesCount'),
    grossSales: requiredNumber(row.grossSales, 'sellerReport.grossSales'),
    commissionPercent: requiredNumber(row.commissionPercent, 'sellerReport.commissionPercent'),
    commissionValue: requiredNumber(row.commissionValue, 'sellerReport.commissionValue')
  };
}

function parseOnlineSession(value: unknown): OnlineSessionResult {
  const row = recordOrInvalid(value, 'onlineSession');
  return {
    available: requiredBoolean(row.available, 'onlineSession.available'),
    url: optionalString(row.url, 'onlineSession.url'),
    message: optionalString(row.message, 'onlineSession.message')
  };
}

function parseWhatsappStatus(value: unknown): WhatsappIntegrationStatus {
  const row = recordOrInvalid(value, 'whatsappStatus');
  return {
    available: requiredBoolean(row.available, 'whatsappStatus.available'),
    connected: requiredBoolean(row.connected, 'whatsappStatus.connected'),
    managementUrl: optionalString(row.managementUrl, 'whatsappStatus.managementUrl'),
    message: optionalString(row.message, 'whatsappStatus.message')
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

  private async request(
    endpoint: keyof HttpIntegrationConfig['endpoints'],
    init: RequestInit,
    context?: GatewayContext
  ): Promise<unknown> {
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
      return (payload as { data: unknown }).data;
    }
    return payload;
  }

  async testConnection(): Promise<{ ok: true }> {
    const result = await this.request('health', { method: 'GET' });
    if (isRecord(result) && result.ok === false) {
      throw new GatewayError('SERVER', 'A API respondeu, mas informou que não está saudável.');
    }
    return { ok: true };
  }

  async authenticate(input: AccountInput): Promise<AuthResult> {
    return parseAuthResult(await this.request('authenticate', {
      method: 'POST',
      body: JSON.stringify(input)
    }));
  }

  async createAccount(input: AccountInput): Promise<AuthResult> {
    return parseAuthResult(await this.request('createAccount', {
      method: 'POST',
      body: JSON.stringify(input)
    }));
  }

  async requestPasswordReset(input: { email: string }): Promise<void> {
    await this.request('requestPasswordReset', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  async fetchCommercialSnapshot(context: GatewayContext): Promise<CommercialSnapshot> {
    return parseCommercialSnapshot(
      await this.request('commercialSnapshot', { method: 'GET' }, context),
      context.scopeKey
    );
  }

  async upsertCustomer(context: GatewayContext, customer: Customer): Promise<Customer> {
    return parseCustomer(
      await this.request('upsertCustomer', {
        method: 'POST',
        body: JSON.stringify({ customer })
      }, context),
      'customer',
      context.scopeKey
    );
  }

  async sendDocument(context: GatewayContext, document: SalesDocument): Promise<SendDocumentResult> {
    return parseSendDocumentResult(await this.request('sendDocument', {
      method: 'POST',
      body: JSON.stringify({ document })
    }, context));
  }

  async fetchMissions(context: GatewayContext): Promise<Mission[]> {
    return parseMissions(
      await this.request('missions', { method: 'GET' }, context),
      context.scopeKey
    );
  }

  async sendMissionReturn(context: GatewayContext, mission: Mission): Promise<void> {
    await this.request('missionReturn', {
      method: 'POST',
      body: JSON.stringify({ mission })
    }, context);
  }

  async sendLocation(
    context: GatewayContext,
    position: { latitude: number; longitude: number; capturedAt: string }
  ): Promise<void> {
    await this.request('location', {
      method: 'POST',
      body: JSON.stringify(position)
    }, context);
  }

  async fetchSellerReport(context: GatewayContext): Promise<SellerReport> {
    return parseSellerReport(await this.request('sellerReport', { method: 'GET' }, context));
  }

  async createOnlineSession(context: GatewayContext): Promise<OnlineSessionResult> {
    return parseOnlineSession(await this.request('onlineSession', { method: 'POST' }, context));
  }

  async fetchWhatsappIntegrationStatus(context: GatewayContext): Promise<WhatsappIntegrationStatus> {
    return parseWhatsappStatus(await this.request('whatsappStatus', { method: 'GET' }, context));
  }

  async registerMissionPushSubscription(
    context: GatewayContext,
    subscription: PushSubscriptionPayload
  ): Promise<void> {
    await this.request('pushSubscription', {
      method: 'POST',
      body: JSON.stringify({ subscription })
    }, context);
  }
}

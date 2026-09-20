import type {
  AuthResult,
  CommercialSnapshot,
  CompanyRef,
  CompanyRole,
  Customer,
  CustomerFieldDefinition,
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
import type { StorageLike } from '../app/session';

export const DEMO_CREDENTIALS = Object.freeze({
  email: 'vendedor@demo.oris360.local',
  password: 'demo1234'
});

export const ADMIN_DEMO_CREDENTIALS = Object.freeze({
  email: 'administrador@demo.oris360.local',
  password: 'demo1234'
});

interface DemoAccount {
  email: string;
  passwordHash: string;
  user: UserIdentity;
  companyIds: string[];
  trialEndsAt?: string;
  commissionPercent: number;
  roles?: Record<string, CompanyRole>;
}

interface ServerCustomer {
  id: string;
  name: string;
  taxId: string;
  extraFields?: Record<string, string>;
  active: boolean;
  updatedAt: string;
}

interface ServerProduct {
  id: string;
  name: string;
  sku: string;
  active: boolean;
  price: number;
  stock: number;
  description?: string;
  imageUrl?: string;
  updatedAt: string;
}

interface ServerMission extends Omit<Mission, 'scopeKey'> {
  assignedUserId: string;
}

interface DemoCompany {
  id: string;
  name: string;
  blocked: boolean;
  allowSaleWithoutStock: boolean;
  customerFields: CustomerFieldDefinition[];
  documentSequence: number;
  customers: ServerCustomer[];
  products: ServerProduct[];
  missions: ServerMission[];
  idempotency: Record<string, SendDocumentResult>;
  centralDocuments: Array<{
    officialNumber: string;
    sourceId: string;
    kind: SalesDocument['kind'];
    sellerId: string;
    customerId?: string;
    items: SalesDocument['items'];
    receivedAt: string;
  }>;
  locations: Array<{
    userId: string;
    latitude: number;
    longitude: number;
    capturedAt: string;
  }>;
}

interface DemoState {
  version: 1;
  accounts: DemoAccount[];
  companies: DemoCompany[];
}

const STORAGE_KEY = 'oris360.demoServer.v1';

const DEMO_CUSTOMER_FIELDS: CustomerFieldDefinition[] = [
  { key: 'phone', label: 'Telefone', type: 'tel' },
  { key: 'email', label: 'E-mail', type: 'email' },
  { key: 'address', label: 'Endereço', type: 'text', maxLength: 160 }
];

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeTaxId(value: string): string {
  return value.replace(/\D/g, '');
}

async function hash(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('WEB_CRYPTO_UNAVAILABLE');
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function nowIso(): string {
  return new Date().toISOString();
}

function plusDaysIso(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

export class DemoOrisGateway implements OrisGateway {
  constructor(private readonly storage: StorageLike = globalThis.localStorage) {}

  private read(): DemoState | null {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DemoState;
    } catch {
      this.storage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  private write(state: DemoState): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private async state(): Promise<DemoState> {
    const current = this.read();
    if (current) {
      if (!current.accounts.some(account => account.email === ADMIN_DEMO_CREDENTIALS.email)) {
        current.accounts.push({
          email: ADMIN_DEMO_CREDENTIALS.email,
          passwordHash: await hash(ADMIN_DEMO_CREDENTIALS.email + ':' + ADMIN_DEMO_CREDENTIALS.password),
          user: { id: 'demo-admin-1', name: 'Administrador Demo', email: ADMIN_DEMO_CREDENTIALS.email },
          companyIds: ['demo-company-a'], commissionPercent: 0,
          roles: { 'demo-company-a': 'owner' }
        });
        this.write(current);
      }
      return current;
    }

    const seededAt = nowIso();
    const user: UserIdentity = {
      id: 'demo-user-1',
      name: 'Vendedor Demo',
      email: DEMO_CREDENTIALS.email
    };
    const state: DemoState = {
      version: 1,
      accounts: [{
        email: DEMO_CREDENTIALS.email,
        passwordHash: await hash(DEMO_CREDENTIALS.email + ':' + DEMO_CREDENTIALS.password),
        user,
        companyIds: ['demo-company-a', 'demo-company-b'],
        commissionPercent: 5,
        roles: { 'demo-company-a': 'seller', 'demo-company-b': 'seller' }
      }, {
        email: ADMIN_DEMO_CREDENTIALS.email,
        passwordHash: await hash(ADMIN_DEMO_CREDENTIALS.email + ':' + ADMIN_DEMO_CREDENTIALS.password),
        user: {
          id: 'demo-admin-1', name: 'Administrador Demo',
          email: ADMIN_DEMO_CREDENTIALS.email
        },
        companyIds: ['demo-company-a'],
        commissionPercent: 0,
        roles: { 'demo-company-a': 'owner' }
      }],
      companies: [
        {
          id: 'demo-company-a',
          name: 'Óris Demo Distribuidora',
          blocked: false,
          allowSaleWithoutStock: false,
          customerFields: DEMO_CUSTOMER_FIELDS,
          documentSequence: 1000,
          customers: [
            {
              id: 'cust-a1',
              name: 'Mercado Central Demo',
              taxId: '12.345.678/0001-90',
              extraFields: { phone: '62999990000', email: 'contato@demo.invalid', address: 'Endereço demonstrativo' },
              active: true,
              updatedAt: seededAt
            },
            { id: 'cust-a2', name: 'Cliente Inativo Demo', taxId: '111.222.333-44', active: false, updatedAt: seededAt }
          ],
          products: [
            { id: 'prod-a1', name: 'Água Mineral 500 ml', sku: 'AG500', active: true, price: 3.5, stock: 6, updatedAt: seededAt },
            { id: 'prod-a2', name: 'Água Mineral 1,5 L', sku: 'AG1500', active: true, price: 7.9, stock: 18, updatedAt: seededAt },
            { id: 'prod-a3', name: 'Produto inativo demo', sku: 'INATIVO', active: false, price: 9.9, stock: 20, updatedAt: seededAt }
          ],
          missions: [
            {
              id: 'mission-a1',
              title: 'Conferir exposição no cliente',
              description: 'Registre uma observação da visita.',
              assignedUserId: user.id,
              completed: false,
              pendingReturn: false,
              assignedAt: seededAt
            }
          ],
          idempotency: {},
          centralDocuments: [],
          locations: []
        },
        {
          id: 'demo-company-b',
          name: 'Óris Demo Atacado',
          blocked: false,
          allowSaleWithoutStock: true,
          customerFields: DEMO_CUSTOMER_FIELDS,
          documentSequence: 2000,
          customers: [
            { id: 'cust-b1', name: 'Loja Norte Demo', taxId: '98.765.432/0001-10', active: true, updatedAt: seededAt }
          ],
          products: [
            { id: 'prod-b1', name: 'Fardo Demo 12 un.', sku: 'FD12', active: true, price: 42, stock: 2, updatedAt: seededAt },
            { id: 'prod-b2', name: 'Caixa Demo 24 un.', sku: 'CX24', active: true, price: 78, stock: 0, updatedAt: seededAt }
          ],
          missions: [],
          idempotency: {},
          centralDocuments: [],
          locations: []
        }
      ]
    };
    this.write(state);
    return state;
  }

  private assertMember(state: DemoState, context: GatewayContext): DemoAccount {
    const account = state.accounts.find(item =>
      item.user.id === context.userId &&
      context.token === 'demo-session:' + item.user.id &&
      item.companyIds.includes(context.companyId)
    );
    if (!account) throw new GatewayError('AUTH_FAILED', 'Usuário não vinculado à empresa DEMO.');
    return account;
  }

  private assertCompanyAdmin(state: DemoState, context: GatewayContext): DemoCompany {
    const account = this.assertMember(state, context);
    const role = account.roles?.[context.companyId] ?? (account.trialEndsAt ? 'owner' : 'seller');
    if (role !== 'owner' && role !== 'admin') {
      throw new GatewayError('AUTH_FAILED', 'Acesso administrativo não autorizado.');
    }
    return this.company(state, context.companyId);
  }

  private company(state: DemoState, companyId: string): DemoCompany {
    const company = state.companies.find(item => item.id === companyId);
    if (!company) throw new GatewayError('INVALID_DATA', 'Empresa não encontrada.');
    return company;
  }

  async authenticate(input: AccountInput): Promise<AuthResult> {
    const state = await this.state();
    const email = normalizeEmail(input.email);
    const account = state.accounts.find(item => item.email === email);
    const passwordHash = await hash(email + ':' + input.password);
    if (!account || account.passwordHash !== passwordHash) {
      throw new GatewayError('AUTH_FAILED', 'E-mail ou senha inválidos.');
    }
    return {
      user: account.user,
      companies: account.companyIds
        .map(id => state.companies.find(company => company.id === id))
        .filter((company): company is DemoCompany => Boolean(company))
        .map<CompanyRef>(company => ({
          id: company.id, name: company.name,
          role: account.roles?.[company.id] ?? (account.trialEndsAt ? 'owner' : 'seller')
        })),
      token: 'demo-session:' + account.user.id
    };
  }

  async createAccount(input: AccountInput): Promise<AuthResult> {
    const state = await this.state();
    const email = normalizeEmail(input.email);
    if (state.accounts.some(account => account.email === email)) {
      throw new GatewayError('INVALID_DATA', 'Já existe uma conta com este e-mail.');
    }
    if (!email || input.password.length < 6) {
      throw new GatewayError('INVALID_DATA', 'Informe e-mail e uma senha com pelo menos 6 caracteres.');
    }

    const userId = 'user-' + crypto.randomUUID();
    const companyId = 'company-' + crypto.randomUUID();
    const user: UserIdentity = {
      id: userId,
      name: email.split('@')[0] || 'Usuário Óris360°',
      email
    };
    state.accounts.push({
      email,
      passwordHash: await hash(email + ':' + input.password),
      user,
      companyIds: [companyId],
      trialEndsAt: plusDaysIso(7),
      commissionPercent: 0,
      roles: { [companyId]: 'owner' }
    });
    state.companies.push({
      id: companyId,
      name: 'Minha empresa Óris360°',
      blocked: false,
      allowSaleWithoutStock: false,
      customerFields: DEMO_CUSTOMER_FIELDS,
      documentSequence: 1,
      customers: [],
      products: [],
      missions: [],
      idempotency: {},
      centralDocuments: [],
      locations: []
    });
    this.write(state);

    return {
      user,
      companies: [{ id: companyId, name: 'Minha empresa Óris360°', role: 'owner' }],
      token: 'demo-session:' + userId
    };
  }

  async requestPasswordReset(_input: { email: string }): Promise<void> {
    // DEMO intentionally returns a generic success to model an anti-enumeration reset flow.
  }

  async upsertCustomer(context: GatewayContext, customer: Customer): Promise<Customer> {
    const state = await this.state();
    const company = this.company(state, context.companyId);
    const taxId = normalizeTaxId(customer.taxId);
    if (!taxId) throw new GatewayError('INVALID_DATA', 'CPF/CNPJ é obrigatório para sincronizar o cliente.');

    const existing = company.customers.find(item => normalizeTaxId(item.taxId) === taxId);
    const updatedAt = nowIso();
    if (existing) {
      const localTimestamp = Date.parse(customer.updatedAt);
      const serverTimestamp = Date.parse(existing.updatedAt);
      const localIsNewer =
        Number.isFinite(localTimestamp) &&
        (!Number.isFinite(serverTimestamp) || localTimestamp > serverTimestamp);

      if (localIsNewer) {
        existing.name = customer.name;
        existing.taxId = customer.taxId;
        existing.extraFields = { ...(customer.extraFields ?? {}) };
        // Active/inactive status is controlled only by the Sistema Online.
        existing.updatedAt = customer.updatedAt;
        this.write(state);
      }

      return {
        ...customer,
        id: existing.id,
        officialId: existing.id,
        scopeKey: context.scopeKey,
        name: existing.name,
        taxId: existing.taxId,
        extraFields: { ...(existing.extraFields ?? {}) },
        active: existing.active,
        pendingSync: false,
        updatedAt: existing.updatedAt
      };
    }

    const id = 'cust-' + crypto.randomUUID();
    company.customers.push({
      id,
      name: customer.name,
      taxId: customer.taxId,
      extraFields: { ...(customer.extraFields ?? {}) },
      active: true,
      updatedAt
    });
    this.write(state);
    return {
      ...customer,
      id,
      officialId: id,
      scopeKey: context.scopeKey,
      active: true,
      pendingSync: false,
      updatedAt
    };
  }

  async fetchCommercialSnapshot(context: GatewayContext): Promise<CommercialSnapshot> {
    const state = await this.state();
    const company = this.company(state, context.companyId);
    if (company.blocked) {
      throw new GatewayError('ACCOUNT_BLOCKED', 'Conta bloqueada para sincronização comercial.');
    }
    const synchronizedAt = nowIso();
    return {
      version: synchronizedAt,
      synchronizedAt,
      customers: company.customers.map<Customer>(customer => ({
        ...customer,
        officialId: customer.id,
        scopeKey: context.scopeKey,
        pendingSync: false
      })),
      products: company.products.map<Product>(product => ({
        ...product,
        scopeKey: context.scopeKey
      })),
      settings: {
        allowSaleWithoutStock: company.allowSaleWithoutStock,
        accountBlocked: company.blocked,
        customerFields: company.customerFields
      }
    };
  }

  async sendDocument(
    context: GatewayContext,
    document: SalesDocument
  ): Promise<SendDocumentResult> {
    const state = await this.state();
    const company = this.company(state, context.companyId);
    const key = context.companyId + ':' + document.idempotencyKey;
    const previous = company.idempotency[key];
    if (previous) return previous;

    const products = new Map(company.products.map(product => [product.id, product]));
    const acceptedItems = document.items.flatMap(item => {
      const product = products.get(item.productId);
      if (!product || !product.active || item.quantity <= 0) return [];
      if (document.kind === 'quote') return [{ ...item }];

      const quantity = company.allowSaleWithoutStock
        ? item.quantity
        : Math.min(item.quantity, Math.max(0, product.stock));
      if (quantity <= 0) return [];
      product.stock -= quantity;
      product.updatedAt = nowIso();
      return [{ ...item, quantity }];
    });

    company.documentSequence += 1;
    const officialNumber =
      (document.kind === 'order' ? 'PD-' : 'ORC-') +
      String(company.documentSequence).padStart(6, '0');
    const sentAt = nowIso();
    const result: SendDocumentResult = {
      officialNumber,
      acceptedItems,
      sentAt
    };
    company.idempotency[key] = result;
    company.centralDocuments.push({
      officialNumber,
      sourceId: document.id,
      kind: document.kind,
      sellerId: document.sellerId,
      customerId: document.customerId,
      items: acceptedItems,
      receivedAt: sentAt
    });
    this.write(state);
    return result;
  }

  async fetchMissions(context: GatewayContext): Promise<Mission[]> {
    const state = await this.state();
    const company = this.company(state, context.companyId);
    return company.missions
      .filter(mission => mission.assignedUserId === context.userId)
      .map(({ assignedUserId: _assignedUserId, ...mission }) => ({
        ...mission,
        scopeKey: context.scopeKey
      }));
  }

  async sendMissionReturn(context: GatewayContext, mission: Mission): Promise<void> {
    const state = await this.state();
    const company = this.company(state, context.companyId);
    const target = company.missions.find(item => item.id === mission.id);
    if (!target) throw new GatewayError('INVALID_DATA', 'Missão não encontrada.');
    Object.assign(target, {
      completed: mission.completed,
      notes: mission.notes,
      evidence: mission.evidence,
      latitude: mission.latitude,
      longitude: mission.longitude,
      completedAt: mission.completedAt,
      pendingReturn: false
    });
    this.write(state);
  }

  async sendLocation(
    context: GatewayContext,
    position: { latitude: number; longitude: number; capturedAt: string }
  ): Promise<void> {
    const state = await this.state();
    const company = this.company(state, context.companyId);
    company.locations.push({ userId: context.userId, ...position });
    company.locations = company.locations.slice(-100);
    this.write(state);
  }

  async fetchSellerReport(context: GatewayContext): Promise<SellerReport> {
    const state = await this.state();
    const company = this.company(state, context.companyId);
    const account = state.accounts.find(item => item.user.id === context.userId);
    const sellerDocuments = company.centralDocuments.filter(item => item.sellerId === context.userId);
    const orders = sellerDocuments.filter(item => item.kind === 'order');
    const quotes = sellerDocuments.filter(item => item.kind === 'quote');
    const grossSales = orders.reduce(
      (sum, document) => sum + document.items.reduce(
        (documentSum, item) => documentSum + item.quantity * item.unitPrice,
        0
      ),
      0
    );
    const commissionPercent = account?.commissionPercent ?? 0;
    return {
      periodLabel: 'Dados do ambiente DEMO',
      ordersCount: orders.length,
      quotesCount: quotes.length,
      grossSales,
      commissionPercent,
      commissionValue: grossSales * commissionPercent / 100
    };
  }

  async createOnlineSession(_context: GatewayContext): Promise<OnlineSessionResult> {
    return {
      available: false,
      message: 'O ambiente DEMO não possui uma plataforma web externa para abrir.'
    };
  }

  async fetchWhatsappIntegrationStatus(_context: GatewayContext): Promise<WhatsappIntegrationStatus> {
    return {
      available: false,
      connected: false,
      message: 'A integração WhatsApp/IA exige o backend real Óris360°.'
    };
  }

  async registerMissionPushSubscription(
    _context: GatewayContext,
    _subscription: PushSubscriptionPayload
  ): Promise<void> {
    // No server-side push channel exists in DEMO mode.
  }

  async fetchCompanyProducts(context: GatewayContext): Promise<Product[]> {
    const state = await this.state();
    const company = this.assertCompanyAdmin(state, context);
    return company.products.map(product => ({ ...product, scopeKey: context.scopeKey }));
  }

  async saveCompanyProduct(context: GatewayContext, input: {
    id?: string; name: string; sku: string; price: number; stock: number;
    description?: string; imageUrl?: string; active: boolean;
  }): Promise<Product> {
    const state = await this.state();
    const company = this.assertCompanyAdmin(state, context);
    const name = input.name.trim();
    const sku = input.sku.trim().toUpperCase();
    if (!name || name.length > 160 || !sku || sku.length > 64 ||
      !Number.isFinite(input.price) || input.price < 0 ||
      !Number.isInteger(input.stock) || input.stock < 0 ||
      typeof input.active !== 'boolean' ||
      company.products.some(product => product.sku.toUpperCase() === sku && product.id !== input.id)) {
      throw new GatewayError('INVALID_DATA', 'Informe nome, SKU único, preço e estoque válidos para esta empresa.');
    }
    if (input.imageUrl &&
      (!/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(input.imageUrl) ||
        input.imageUrl.length > 300_000)) {
      throw new GatewayError('INVALID_DATA', 'Foto inválida ou maior que o limite do ambiente DEMO.');
    }
    const old = input.id ? company.products.find(product => product.id === input.id) : undefined;
    if (input.id && !old) throw new GatewayError('INVALID_DATA', 'Produto inexistente nesta empresa.');
    const product: ServerProduct = {
      id: old?.id ?? 'prod-' + crypto.randomUUID(),
      name, sku, price: input.price, stock: input.stock,
      description: input.description?.trim().slice(0, 1000) || undefined,
      imageUrl: input.imageUrl, active: input.active, updatedAt: nowIso()
    };
    if (old) Object.assign(old, product);
    else company.products.push(product);
    this.write(state);
    return { ...product, scopeKey: context.scopeKey };
  }

  async fetchSellerDocuments(context: GatewayContext): Promise<Array<{
    officialNumber: string; kind: SalesDocument['kind']; receivedAt: string;
    items: SalesDocument['items'];
  }>> {
    const state = await this.state();
    this.assertMember(state, context);
    return this.company(state, context.companyId).centralDocuments
      .filter(document => document.sellerId === context.userId)
      .map(document => ({
        officialNumber: document.officialNumber, kind: document.kind,
        receivedAt: document.receivedAt, items: document.items.map(item => ({ ...item }))
      }));
  }

  async setCompanyBlockedForDemo(companyId: string, blocked: boolean): Promise<void> {
    const state = await this.state();
    this.company(state, companyId).blocked = blocked;
    this.write(state);
  }
}

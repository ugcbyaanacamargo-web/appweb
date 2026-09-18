import type {
  AuthResult,
  CommercialSnapshot,
  CompanyRef,
  Customer,
  Mission,
  Product,
  SalesDocument,
  SendDocumentResult,
  UserIdentity
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

interface DemoAccount {
  email: string;
  passwordHash: string;
  user: UserIdentity;
  companyIds: string[];
  trialEndsAt?: string;
}

interface ServerCustomer {
  id: string;
  name: string;
  taxId: string;
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
    if (current) return current;

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
        companyIds: ['demo-company-a', 'demo-company-b']
      }],
      companies: [
        {
          id: 'demo-company-a',
          name: 'Óris Demo Distribuidora',
          blocked: false,
          allowSaleWithoutStock: false,
          documentSequence: 1000,
          customers: [
            { id: 'cust-a1', name: 'Mercado Central Demo', taxId: '12.345.678/0001-90', active: true, updatedAt: seededAt },
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
        .map<CompanyRef>(company => ({ id: company.id, name: company.name })),
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
      trialEndsAt: plusDaysIso(7)
    });
    state.companies.push({
      id: companyId,
      name: 'Minha empresa Óris360°',
      blocked: false,
      allowSaleWithoutStock: false,
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
      companies: [{ id: companyId, name: 'Minha empresa Óris360°' }],
      token: 'demo-session:' + userId
    };
  }

  async upsertCustomer(context: GatewayContext, customer: Customer): Promise<Customer> {
    const state = await this.state();
    const company = this.company(state, context.companyId);
    const taxId = normalizeTaxId(customer.taxId);
    if (!taxId) throw new GatewayError('INVALID_DATA', 'CPF/CNPJ é obrigatório para sincronizar o cliente.');

    const existing = company.customers.find(item => normalizeTaxId(item.taxId) === taxId);
    const updatedAt = nowIso();
    if (existing) {
      existing.name = customer.name;
      existing.taxId = customer.taxId;
      existing.active = existing.active;
      existing.updatedAt = updatedAt;
      this.write(state);
      return {
        ...customer,
        id: existing.id,
        officialId: existing.id,
        scopeKey: context.scopeKey,
        name: existing.name,
        taxId: existing.taxId,
        active: existing.active,
        pendingSync: false,
        updatedAt
      };
    }

    const id = 'cust-' + crypto.randomUUID();
    company.customers.push({
      id,
      name: customer.name,
      taxId: customer.taxId,
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
        accountBlocked: company.blocked
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

  async setCompanyBlockedForDemo(companyId: string, blocked: boolean): Promise<void> {
    const state = await this.state();
    this.company(state, companyId).blocked = blocked;
    this.write(state);
  }
}

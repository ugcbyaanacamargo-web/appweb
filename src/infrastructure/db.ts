import Dexie, { type EntityTable } from 'dexie';
import type {
  CommercialSnapshot,
  Customer,
  Mission,
  Product,
  SalesDocument
} from '../domain/models';

export interface ContextRecord {
  scopeKey: string;
  userName: string;
  companyName: string;
  activatedAt: string;
  lastSuccessfulSyncAt?: string;
  snapshotVersion?: string;
  accountBlocked: boolean;
}

export class OrisDb extends Dexie {
  contexts!: EntityTable<ContextRecord, 'scopeKey'>;
  customers!: EntityTable<Customer, 'id'>;
  products!: EntityTable<Product, 'id'>;
  documents!: EntityTable<SalesDocument, 'id'>;
  missions!: EntityTable<Mission, 'id'>;

  constructor(name = 'oris360-sales') {
    super(name);
    this.version(1).stores({
      contexts: 'scopeKey',
      customers: 'id, scopeKey, [scopeKey+taxId], [scopeKey+pendingSync]',
      products: 'id, scopeKey, [scopeKey+active]',
      documents: 'id, scopeKey, [scopeKey+state], [scopeKey+kind], createdAt',
      missions: 'id, scopeKey, [scopeKey+pendingReturn], assignedAt'
    });
  }
}

export async function getScopeCustomers(db: OrisDb, scopeKey: string): Promise<Customer[]> {
  return db.customers.where('scopeKey').equals(scopeKey).toArray();
}

export async function getScopeProducts(db: OrisDb, scopeKey: string): Promise<Product[]> {
  return db.products.where('scopeKey').equals(scopeKey).toArray();
}

export async function getScopeDocuments(db: OrisDb, scopeKey: string): Promise<SalesDocument[]> {
  return db.documents.where('scopeKey').equals(scopeKey).toArray();
}

export async function replaceCommercialSnapshot(
  _db: OrisDb,
  _scopeKey: string,
  _snapshot: CommercialSnapshot
): Promise<void> {
  // RED baseline: implemented after transactional tests.
}

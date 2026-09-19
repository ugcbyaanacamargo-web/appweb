import Dexie, { type Table } from 'dexie';
import type {
  CommercialSnapshot,
  Customer,
  CustomerFieldDefinition,
  Mission,
  Product,
  SalesDocument
} from '../domain/models';
import { repriceAndValidateLocal } from '../domain/rules';

export interface ContextRecord {
  scopeKey: string;
  userName: string;
  companyName: string;
  activatedAt: string;
  lastSuccessfulSyncAt?: string;
  snapshotVersion?: string;
  accountBlocked: boolean;
  allowSaleWithoutStock?: boolean;
  helpPhone?: string;
  helpEmail?: string;
  onlineBaseUrl?: string;
  missionPushPublicKey?: string;
  customerFields?: CustomerFieldDefinition[];
}

const CUSTOMER_FIELD_TYPES = new Set<CustomerFieldDefinition['type']>([
  'text',
  'email',
  'tel',
  'number',
  'date'
]);

function sanitizeCustomerFieldDefinitions(
  value: CustomerFieldDefinition[] | undefined
): CustomerFieldDefinition[] | undefined {
  if (!value) return undefined;

  const seen = new Set<string>();
  const result: CustomerFieldDefinition[] = [];
  for (const field of value) {
    const key = typeof field?.key === 'string' ? field.key.trim() : '';
    const label = typeof field?.label === 'string' ? field.label.trim() : '';
    if (!/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(key)) continue;
    if (!label || label.length > 80 || seen.has(key)) continue;
    if (!CUSTOMER_FIELD_TYPES.has(field.type)) continue;

    seen.add(key);
    result.push({
      key,
      label,
      type: field.type,
      required: field.required === true || undefined,
      maxLength:
        typeof field.maxLength === 'number' && Number.isFinite(field.maxLength)
          ? Math.max(1, Math.min(500, Math.floor(field.maxLength)))
          : undefined
    });
  }
  return result;
}

function sanitizeCustomerExtraFields(
  value: Record<string, string> | undefined,
  allowedKeys?: Set<string>
): Record<string, string> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const entries = Object.entries(value).filter(([key, fieldValue]) =>
    /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(key) &&
    typeof fieldValue === 'string' &&
    (!allowedKeys || allowedKeys.has(key))
  );
  return entries.length ? Object.fromEntries(entries) : undefined;
}

export class OrisDb extends Dexie {
  contexts!: Table<ContextRecord, string>;
  customers!: Table<Customer, [string, string]>;
  products!: Table<Product, [string, string]>;
  documents!: Table<SalesDocument, [string, string]>;
  missions!: Table<Mission, [string, string]>;

  constructor(name = 'oris360-sales') {
    super(name);
    this.version(1).stores({
      contexts: 'scopeKey',
      customers: '[scopeKey+id], scopeKey, [scopeKey+taxId]',
      products: '[scopeKey+id], scopeKey, [scopeKey+active]',
      documents: '[scopeKey+id], scopeKey, [scopeKey+state], [scopeKey+kind], createdAt',
      missions: '[scopeKey+id], scopeKey, [scopeKey+pendingReturn], assignedAt'
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

export async function getScopeMissions(db: OrisDb, scopeKey: string): Promise<Mission[]> {
  return db.missions.where('scopeKey').equals(scopeKey).toArray();
}

export async function replaceCommercialSnapshot(
  db: OrisDb,
  scopeKey: string,
  snapshot: CommercialSnapshot
): Promise<void> {
  await db.transaction(
    'rw',
    db.contexts,
    db.customers,
    db.products,
    db.documents,
    async () => {
      const context = await db.contexts.get(scopeKey);
      if (!context) {
        throw new Error('LOCAL_CONTEXT_NOT_INITIALIZED');
      }

      const previousCustomers = await db.customers
        .where('scopeKey')
        .equals(scopeKey)
        .toArray();

      const normalizeTaxId = (value: string) => value.replace(/\\D/g, '');
      const localByTaxId = new Map(
        previousCustomers
          .map(customer => [normalizeTaxId(customer.taxId), customer] as const)
          .filter(([taxId]) => taxId.length > 0)
      );
      const matchedLocalIds = new Set<string>();

      const customerFields = sanitizeCustomerFieldDefinitions(snapshot.settings.customerFields);
      const allowedExtraKeys = customerFields ? new Set(customerFields.map(field => field.key)) : undefined;

      const customers = snapshot.customers.map(serverCustomer => {
        const sanitizedServerCustomer = {
          ...serverCustomer,
          extraFields: sanitizeCustomerExtraFields(serverCustomer.extraFields, allowedExtraKeys)
        };
        const taxId = normalizeTaxId(sanitizedServerCustomer.taxId);
        const local = taxId ? localByTaxId.get(taxId) : undefined;
        if (local) {
          matchedLocalIds.add(local.id);
          return {
            ...sanitizedServerCustomer,
            id: local.id,
            officialId: sanitizedServerCustomer.officialId ?? local.officialId ?? sanitizedServerCustomer.id,
            scopeKey,
            pendingSync: false
          };
        }
        return {
          ...sanitizedServerCustomer,
          scopeKey,
          pendingSync: false
        };
      });

      for (const local of previousCustomers) {
        if (local.pendingSync && !matchedLocalIds.has(local.id)) {
          customers.push({
            ...local,
            extraFields: sanitizeCustomerExtraFields(local.extraFields, allowedExtraKeys)
          });
        }
      }

      await db.customers.where('scopeKey').equals(scopeKey).delete();
      await db.products.where('scopeKey').equals(scopeKey).delete();

      const products = snapshot.products.map(product => ({ ...product, scopeKey }));

      if (customers.length) await db.customers.bulkPut(customers);
      if (products.length) await db.products.bulkPut(products);

      const localDocuments = await db.documents
        .where('[scopeKey+state]')
        .equals([scopeKey, 'local'])
        .toArray();

      for (const document of localDocuments) {
        const recalculated = repriceAndValidateLocal(
          document,
          products,
          snapshot.settings.allowSaleWithoutStock
        );
        await db.documents.put(recalculated);
      }

      await db.contexts.put({
        ...context,
        lastSuccessfulSyncAt: snapshot.synchronizedAt,
        snapshotVersion: snapshot.version,
        accountBlocked: snapshot.settings.accountBlocked,
        allowSaleWithoutStock: snapshot.settings.allowSaleWithoutStock,
        helpPhone: snapshot.settings.helpPhone,
        helpEmail: snapshot.settings.helpEmail,
        onlineBaseUrl: snapshot.settings.onlineBaseUrl,
        missionPushPublicKey: snapshot.settings.missionPushPublicKey,
        customerFields
      });
    }
  );
}

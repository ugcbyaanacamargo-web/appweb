import {
  replaceCommercialSnapshot,
  type OrisDb
} from '../infrastructure/db';
import {
  GatewayError,
  type GatewayContext,
  type OrisGateway
} from '../infrastructure/orisGateway';

export interface SyncResult {
  ok: boolean;
  customerErrors: Array<{ customerId: string; message: string }>;
  synchronizedAt?: string;
  reason?: 'offline' | 'account-blocked' | 'failed';
}

export async function synchronizeCommercialBase(input: {
  db: OrisDb;
  gateway: OrisGateway;
  context: GatewayContext;
  online: boolean;
}): Promise<SyncResult> {
  const { db, gateway, context, online } = input;

  if (!online) {
    return { ok: false, customerErrors: [], reason: 'offline' };
  }

  const localContext = await db.contexts.get(context.scopeKey);
  if (!localContext) {
    return { ok: false, customerErrors: [], reason: 'failed' };
  }
  if (localContext.accountBlocked) {
    return { ok: false, customerErrors: [], reason: 'account-blocked' };
  }

  const customerErrors: Array<{ customerId: string; message: string }> = [];
  const pendingCustomers = (await db.customers
    .where('scopeKey')
    .equals(context.scopeKey)
    .toArray())
    .filter(customer => customer.pendingSync);

  for (const customer of pendingCustomers) {
    try {
      const synced = await gateway.upsertCustomer(context, customer);
      await db.customers.put({
        ...synced,
        id: customer.id,
        scopeKey: context.scopeKey,
        pendingSync: false
      });
    } catch (error) {
      customerErrors.push({
        customerId: customer.id,
        message: error instanceof Error ? error.message : 'Falha ao sincronizar cliente'
      });
    }
  }

  try {
    const snapshot = await gateway.fetchCommercialSnapshot(context);
    if (snapshot.settings.accountBlocked) {
      await db.contexts.put({ ...localContext, accountBlocked: true });
      return { ok: false, customerErrors, reason: 'account-blocked' };
    }

    await replaceCommercialSnapshot(db, context.scopeKey, snapshot);

    return {
      ok: true,
      customerErrors,
      synchronizedAt: snapshot.synchronizedAt
    };
  } catch (error) {
    if (error instanceof GatewayError && error.code === 'ACCOUNT_BLOCKED') {
      await db.contexts.put({ ...localContext, accountBlocked: true });
      return { ok: false, customerErrors, reason: 'account-blocked' };
    }
    return { ok: false, customerErrors, reason: 'failed' };
  }
}

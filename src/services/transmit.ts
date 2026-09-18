import type { SalesDocument } from '../domain/models';
import { repriceAndValidateLocal } from '../domain/rules';
import {
  getScopeProducts,
  type OrisDb
} from '../infrastructure/db';
import type {
  GatewayContext,
  OrisGateway
} from '../infrastructure/orisGateway';

export type SendResult =
  | { ok: true; document: SalesDocument }
  | { ok: false; reason: 'offline' | 'not-found' | 'failed'; document?: SalesDocument };

export async function sendDocumentExplicitly(input: {
  db: OrisDb;
  gateway: OrisGateway;
  context: GatewayContext;
  documentId: string;
  online: boolean;
}): Promise<SendResult> {
  const { db, gateway, context, documentId, online } = input;

  const document = await db.documents.get([context.scopeKey, documentId]);
  if (!document) {
    return { ok: false, reason: 'not-found' };
  }
  if (!online) {
    return { ok: false, reason: 'offline', document };
  }
  if (document.state === 'sent') {
    return { ok: true, document };
  }

  try {
    let remoteCustomerId = document.customerId;
    if (document.customerId) {
      const customer = await db.customers.get([context.scopeKey, document.customerId]);
      if (!customer || !customer.active) {
        return { ok: false, reason: 'failed', document };
      }
      let resolvedCustomer = customer;
      if (customer.pendingSync || !customer.officialId) {
        const syncedCustomer = await gateway.upsertCustomer(context, customer);
        resolvedCustomer = {
          ...syncedCustomer,
          id: customer.id,
          scopeKey: context.scopeKey,
          pendingSync: false
        };
        await db.customers.put(resolvedCustomer);
      }
      remoteCustomerId = resolvedCustomer.officialId ?? resolvedCustomer.id;
    }

    const products = await getScopeProducts(db, context.scopeKey);
    const localContext = await db.contexts.get(context.scopeKey);
    const localReady = repriceAndValidateLocal(
      document,
      products,
      localContext?.allowSaleWithoutStock ?? false
    );

    // Quotes are exempt from stock limiting by the domain rule itself.
    // Orders honor the last synchronized company setting before server validation.
    await db.documents.put(localReady);

    const serverPayload: SalesDocument = {
      ...localReady,
      customerId: remoteCustomerId
    };
    const serverResult = await gateway.sendDocument(context, serverPayload);
    const sent: SalesDocument = {
      ...localReady,
      state: 'sent',
      items: serverResult.acceptedItems,
      officialNumber: serverResult.officialNumber,
      sentAt: serverResult.sentAt,
      updatedAt: serverResult.sentAt
    };
    await db.documents.put(sent);
    return { ok: true, document: sent };
  } catch {
    const current = await db.documents.get([context.scopeKey, documentId]);
    return { ok: false, reason: 'failed', document: current };
  }
}

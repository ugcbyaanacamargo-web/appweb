import type { Customer, Product, SalesDocument } from './models';

export function canEditDocument(document: SalesDocument): boolean {
  return document.state === 'local';
}

export function canDeleteDocument(document: SalesDocument): boolean {
  return document.state === 'local';
}

export function convertQuoteToOrder(document: SalesDocument): SalesDocument {
  if (document.state === 'sent') {
    throw new Error('SENT_DOCUMENT_LOCKED');
  }
  if (document.kind === 'order') {
    return document;
  }
  return {
    ...document,
    kind: 'order',
    updatedAt: new Date().toISOString()
  };
}

export function repriceAndValidateLocal(
  document: SalesDocument,
  products: Product[],
  allowSaleWithoutStock: boolean
): SalesDocument {
  if (document.state === 'sent') {
    return document;
  }

  const byId = new Map(products.map(product => [product.id, product]));
  const items = document.items.flatMap(item => {
    const product = byId.get(item.productId);
    if (!product || !product.active) {
      return [];
    }

    const requested = Math.max(0, item.quantity);
    const mustEnforceStock = document.kind === 'order' && !allowSaleWithoutStock;
    const quantity = mustEnforceStock
      ? Math.min(requested, Math.max(0, product.stock))
      : requested;

    if (quantity <= 0) {
      return [];
    }

    return [{
      productId: product.id,
      quantity,
      unitPrice: product.price
    }];
  });

  return {
    ...document,
    items,
    updatedAt: new Date().toISOString()
  };
}

export function duplicateAsQuote(
  document: SalesDocument,
  customer: Customer | undefined,
  products: Product[],
  allowSaleWithoutStock: boolean,
  sellerId: string,
  now: string,
  newId: string
): SalesDocument {
  if (document.state !== 'sent') {
    throw new Error('DUPLICATE_ONLY_SENT_DOCUMENT');
  }

  const draft: SalesDocument = {
    id: newId,
    scopeKey: document.scopeKey,
    kind: 'quote',
    state: 'local',
    customerId: customer?.active ? customer.id : undefined,
    items: document.items.map(item => ({ ...item })),
    supplemental: {},
    sellerId,
    createdAt: now,
    updatedAt: now,
    idempotencyKey: 'send:' + newId
  };

  const validated = repriceAndValidateLocal(
    draft,
    products,
    allowSaleWithoutStock
  );

  return {
    ...validated,
    createdAt: now,
    updatedAt: now
  };
}

export function documentTotal(document: SalesDocument): number {
  const itemsTotal = document.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const discount = document.supplemental.discount ?? 0;
  const surcharge = document.supplemental.surcharge ?? 0;
  const freight = document.supplemental.freight ?? 0;
  return Math.max(0, itemsTotal - discount + surcharge + freight);
}

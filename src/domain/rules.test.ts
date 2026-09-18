import { describe, expect, it } from 'vitest';
import type { Customer, Product, SalesDocument } from './models';
import {
  canDeleteDocument,
  canEditDocument,
  convertQuoteToOrder,
  documentTotal,
  duplicateAsQuote,
  repriceAndValidateLocal
} from './rules';

const scopeKey = 'device-1:user-1:company-1';
const now = '2026-09-18T12:00:00.000Z';

function doc(overrides: Partial<SalesDocument> = {}): SalesDocument {
  return {
    id: 'local-1',
    scopeKey,
    kind: 'quote',
    state: 'local',
    customerId: 'c1',
    items: [{ productId: 'p1', quantity: 10, unitPrice: 10 }],
    supplemental: { paymentMethod: 'pix', discount: 5, notes: 'old' },
    sellerId: 'user-1',
    createdAt: '2026-09-17T10:00:00.000Z',
    updatedAt: '2026-09-17T10:00:00.000Z',
    idempotencyKey: 'idem-1',
    ...overrides
  };
}

const activeCustomer: Customer = {
  id: 'c1', scopeKey, name: 'Cliente', taxId: '12345678901',
  active: true, pendingSync: false, updatedAt: now
};

const products: Product[] = [
  { id: 'p1', scopeKey, name: 'Produto 1', sku: 'P1', active: true, price: 12, stock: 6, updatedAt: now },
  { id: 'p2', scopeKey, name: 'Produto 2', sku: 'P2', active: false, price: 20, stock: 10, updatedAt: now },
  { id: 'p3', scopeKey, name: 'Produto 3', sku: 'P3', active: true, price: 5, stock: 0, updatedAt: now }
];

describe('document rules', () => {
  it('R6 blocks editing and deletion after server confirmation', () => {
    const sent = doc({ state: 'sent', officialNumber: 'PD-1', sentAt: now });
    expect(canEditDocument(sent)).toBe(false);
    expect(canDeleteDocument(sent)).toBe(false);
  });

  it('conversion quote -> order keeps the same document identity and is definitive', () => {
    const converted = convertQuoteToOrder(doc());
    expect(converted.id).toBe('local-1');
    expect(converted.kind).toBe('order');
    expect(converted.state).toBe('local');
  });

  it('R8 reprices an unsent document with the latest local price', () => {
    const repriced = repriceAndValidateLocal(doc({ supplemental: {} }), products, true);
    expect(repriced.items).toEqual([{ productId: 'p1', quantity: 10, unitPrice: 12 }]);
    expect(documentTotal(repriced)).toBe(120);
  });

  it('R9 removes inactive products from unsent documents', () => {
    const input = doc({ items: [
      { productId: 'p1', quantity: 1, unitPrice: 10 },
      { productId: 'p2', quantity: 2, unitPrice: 20 }
    ] });
    expect(repriceAndValidateLocal(input, products, true).items.map(i => i.productId)).toEqual(['p1']);
  });

  it('R11 caps quantity to local stock and removes zero-stock item when sale without stock is disabled', () => {
    const input = doc({ kind: 'order', items: [
      { productId: 'p1', quantity: 10, unitPrice: 10 },
      { productId: 'p3', quantity: 2, unitPrice: 5 }
    ] });
    expect(repriceAndValidateLocal(input, products, false).items).toEqual([
      { productId: 'p1', quantity: 6, unitPrice: 12 }
    ]);
  });

  it('R11 keeps requested quantity when sale without stock is enabled', () => {
    expect(repriceAndValidateLocal(doc({ kind: 'order' }), products, true).items[0].quantity).toBe(10);
  });

  it('R12 keeps quote quantities even when stock is lower because quote does not move stock', () => {
    const quote = repriceAndValidateLocal(doc(), products, false);
    expect(quote.items).toEqual([{ productId: 'p1', quantity: 10, unitPrice: 12 }]);
  });

  it('R7 duplicate always creates a new local quote with current seller/date and empty supplemental fields', () => {
    const sent = doc({ state: 'sent', kind: 'order', officialNumber: 'PD-9', sentAt: now });
    const copy = duplicateAsQuote(sent, activeCustomer, products, false, 'seller-2', now, 'local-2');
    expect(copy.id).toBe('local-2');
    expect(copy.kind).toBe('quote');
    expect(copy.state).toBe('local');
    expect(copy.sellerId).toBe('seller-2');
    expect(copy.createdAt).toBe(now);
    expect(copy.supplemental).toEqual({});
    expect(copy.officialNumber).toBeUndefined();
  });

  it('duplication drops an inactive customer and invalid products', () => {
    const inactiveCustomer = { ...activeCustomer, active: false };
    const sent = doc({
      state: 'sent',
      items: [
        { productId: 'p1', quantity: 10, unitPrice: 10 },
        { productId: 'p2', quantity: 1, unitPrice: 20 }
      ]
    });
    const copy = duplicateAsQuote(sent, inactiveCustomer, products, false, 'seller-2', now, 'local-2');
    expect(copy.customerId).toBeUndefined();
    expect(copy.items).toEqual([{ productId: 'p1', quantity: 10, unitPrice: 12 }]);
  });
});

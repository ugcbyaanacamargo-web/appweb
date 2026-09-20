import { describe, expect, it } from 'vitest';
import { mapSaborizaProducts } from './catalogMapping';

const base = {
  id: 'product-1',
  name: 'Tempero caseiro',
  unit_price: 4.9,
  is_active: true,
  updated_at: '2026-09-20T12:00:00Z',
  pack_quantity: 1
};

const details = new Map([
  ['product-1', { sku: 'TEMP-1', stock: 6 }]
]);

describe('mapSaborizaProducts', () => {
  it('maps a single-unit Saboriza product without guessing price, stock or SKU', () => {
    expect(mapSaborizaProducts([base], 'device:user:company', details)).toEqual([{
      id: 'product-1',
      scopeKey: 'device:user:company',
      name: 'Tempero caseiro',
      sku: 'TEMP-1',
      active: true,
      price: 4.9,
      stock: 6,
      updatedAt: '2026-09-20T12:00:00Z'
    }]);
  });

  it('retains inactive status so local sync can remove the product from unsent documents', () => {
    expect(mapSaborizaProducts([{ ...base, is_active: false }], 'scope', details)[0].active).toBe(false);
  });

  it('refuses missing official stock or SKU instead of inventing zero or the product ID', () => {
    expect(() => mapSaborizaProducts([base], 'scope', new Map()))
      .toThrowError(/estoque e SKU oficiais/i);
    expect(() => mapSaborizaProducts([base], 'scope', new Map([['product-1', { sku: '', stock: 6 }]])))
      .toThrowError(/estoque e SKU oficiais/i);
  });

  it('refuses a pack sale until the app can price quantities in the same unit as Saboriza', () => {
    expect(() => mapSaborizaProducts([{ ...base, pack_quantity: 12 }], 'scope', details))
      .toThrowError(/embalagem/i);
  });

  it('refuses negative, missing or non-finite price and invalid timestamps', () => {
    for (const altered of [
      { ...base, unit_price: -1 },
      { ...base, unit_price: Number.NaN },
      { ...base, unit_price: undefined },
      { ...base, updated_at: 'yesterday' }
    ]) {
      expect(() => mapSaborizaProducts([altered], 'scope', details)).toThrow();
    }
  });

  it('rejects duplicate IDs and invalid stock quantities', () => {
    expect(() => mapSaborizaProducts([base, base], 'scope', details)).toThrowError(/duplicado/i);
    expect(() => mapSaborizaProducts([base], 'scope', new Map([['product-1', { sku: 'TEMP-1', stock: 1.5 }]])))
      .toThrowError(/estoque e SKU oficiais/i);
  });

  it('accepts an intentionally empty product list without inventing products', () => {
    expect(mapSaborizaProducts([], 'scope', new Map())).toEqual([]);
  });

  it('rejects non-list responses and missing required product fields', () => {
    expect(() => mapSaborizaProducts(null, 'scope', details)).toThrowError(/lista/i);
    expect(() => mapSaborizaProducts([{ ...base, id: '' }], 'scope', details)).toThrowError(/identificador/i);
  });
});

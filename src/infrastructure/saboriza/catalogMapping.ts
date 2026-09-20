import type { Product } from '../../domain/models';
import { GatewayError } from '../orisGateway';

export interface SaborizaCommercialDetails {
  sku: string;
  stock: number;
}

function invalid(reason: string): never {
  throw new GatewayError('INVALID_DATA', 'Catálogo Saboriza inválido: ' + reason);
}

function rowObject(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return invalid('produto precisa ser um objeto.');
  }
  return value as Record<string, unknown>;
}

function nonemptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) return invalid(field + ' ausente ou inválido.');
  return value.trim();
}

/**
 * Validates source fields present in Saboriza's public product schema.
 * The App does not know Saboriza's authoritative stock or official SKU.
 * These must be provided separately by a verified server-side commercial snapshot.
 *
 * Saboriza currently prices individual units and may sell closed packs. Until
 * Oris360 models packs explicitly, silently treating a pack as one unit risks
 * incorrect totals and inventory changes. Reject non-unit packs.
 */
export function mapSaborizaProducts(
  records: unknown,
  scopeKey: string,
  details: ReadonlyMap<string, SaborizaCommercialDetails>
): Product[] {
  if (!Array.isArray(records)) return invalid('resposta de produtos deve ser uma lista.');
  const seen = new Set<string>();

  return records.map(value => {
    const row = rowObject(value);
    const id = nonemptyString(row.id, 'identificador');
    if (seen.has(id)) return invalid('identificador de produto duplicado.');
    seen.add(id);

    const name = nonemptyString(row.name, 'nome');
    const price = row.unit_price;
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
      return invalid('preço unitário ausente ou inválido.');
    }
    if (typeof row.is_active !== 'boolean') {
      return invalid('estado ativo/inativo ausente ou inválido.');
    }
    const updatedAt = nonemptyString(row.updated_at, 'data de atualização');
    if (!/^\\d{4}-\\d{2}-\\d{2}T/.test(updatedAt) || !Number.isFinite(Date.parse(updatedAt))) {
      return invalid('data de atualização inválida.');
    }

    if (row.pack_quantity !== 1) {
      return invalid('venda por embalagem ainda precisa de regra de conversão de unidades e packs.');
    }

    const commercial = details.get(id);
    if (
      !commercial ||
      typeof commercial.sku !== 'string' ||
      !commercial.sku.trim() ||
      !Number.isInteger(commercial.stock)
    ) {
      return invalid('estoque e SKU oficiais ausentes ou inválidos.');
    }

    return {
      id,
      scopeKey,
      name,
      sku: commercial.sku.trim(),
      active: row.is_active,
      price,
      stock: commercial.stock,
      updatedAt
    };
  });
}

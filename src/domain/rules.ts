import type { Customer, Product, SalesDocument } from './models';

export function canEditDocument(_document: SalesDocument): boolean {
  return true;
}

export function canDeleteDocument(_document: SalesDocument): boolean {
  return true;
}

export function convertQuoteToOrder(document: SalesDocument): SalesDocument {
  return { ...document };
}

export function repriceAndValidateLocal(
  document: SalesDocument,
  _products: Product[],
  _allowSaleWithoutStock: boolean
): SalesDocument {
  return { ...document };
}

export function duplicateAsQuote(
  document: SalesDocument,
  _customer: Customer | undefined,
  _products: Product[],
  _allowSaleWithoutStock: boolean,
  _sellerId: string,
  _now: string,
  _newId: string
): SalesDocument {
  return { ...document };
}

export function documentTotal(document: SalesDocument): number {
  return document.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

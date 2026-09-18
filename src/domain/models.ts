export type DocumentKind = 'quote' | 'order';
export type DocumentState = 'local' | 'sent';

export interface Scope {
  deviceId: string;
  userId: string;
  companyId: string;
}

export interface Customer {
  id: string;
  officialId?: string;
  scopeKey: string;
  name: string;
  taxId: string;
  active: boolean;
  pendingSync: boolean;
  updatedAt: string;
}

export interface Product {
  id: string;
  scopeKey: string;
  name: string;
  sku: string;
  active: boolean;
  price: number;
  stock: number;
  updatedAt: string;
}

export interface DocumentItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface SupplementalFields {
  paymentMethod?: string;
  paymentTerms?: string;
  freight?: number;
  carrier?: string;
  discount?: number;
  surcharge?: number;
  notes?: string;
  additionalInfo?: string;
}

export interface SalesDocument {
  id: string;
  scopeKey: string;
  kind: DocumentKind;
  state: DocumentState;
  customerId?: string;
  items: DocumentItem[];
  supplemental: SupplementalFields;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
  idempotencyKey: string;
  officialNumber?: string;
  sentAt?: string;
}

export interface CommercialSettings {
  allowSaleWithoutStock: boolean;
  accountBlocked: boolean;
  helpPhone?: string;
  helpEmail?: string;
  onlineBaseUrl?: string;
}

export interface CommercialSnapshot {
  version: string;
  synchronizedAt: string;
  customers: Customer[];
  products: Product[];
  settings: CommercialSettings;
}

export interface Mission {
  id: string;
  scopeKey: string;
  title: string;
  description?: string;
  completed: boolean;
  pendingReturn: boolean;
  notes?: string;
  evidence?: string[];
  latitude?: number;
  longitude?: number;
  assignedAt: string;
  completedAt?: string;
}

export interface UserIdentity {
  id: string;
  name: string;
  email: string;
}

export interface CompanyRef {
  id: string;
  name: string;
}

export interface AuthResult {
  user: UserIdentity;
  companies: CompanyRef[];
  token: string;
}

export interface SendDocumentResult {
  officialNumber: string;
  acceptedItems: DocumentItem[];
  sentAt: string;
}

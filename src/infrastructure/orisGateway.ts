import type {
  AuthResult,
  CommercialSnapshot,
  Customer,
  Mission,
  OnlineSessionResult,
  PushSubscriptionPayload,
  SalesDocument,
  SellerReport,
  SendDocumentResult,
  WhatsappIntegrationStatus
} from '../domain/models';

export type GatewayErrorCode =
  | 'OFFLINE'
  | 'ACCOUNT_BLOCKED'
  | 'AUTH_FAILED'
  | 'NETWORK'
  | 'SERVER'
  | 'INVALID_DATA';

export class GatewayError extends Error {
  constructor(public readonly code: GatewayErrorCode, message: string) {
    super(message);
    this.name = 'GatewayError';
  }
}

export interface GatewayContext {
  companyId: string;
  userId: string;
  scopeKey: string;
  token?: string;
}

export interface AccountInput {
  email: string;
  password: string;
}

export interface OrisGateway {
  authenticate(input: AccountInput): Promise<AuthResult>;
  createAccount(input: AccountInput): Promise<AuthResult>;
  requestPasswordReset(input: { email: string }): Promise<void>;
  upsertCustomer(context: GatewayContext, customer: Customer): Promise<Customer>;
  fetchCommercialSnapshot(context: GatewayContext): Promise<CommercialSnapshot>;
  sendDocument(context: GatewayContext, document: SalesDocument): Promise<SendDocumentResult>;
  fetchMissions(context: GatewayContext): Promise<Mission[]>;
  sendMissionReturn(context: GatewayContext, mission: Mission): Promise<void>;
  sendLocation(
    context: GatewayContext,
    position: { latitude: number; longitude: number; capturedAt: string }
  ): Promise<void>;
  fetchSellerReport(context: GatewayContext): Promise<SellerReport>;
  createOnlineSession(context: GatewayContext): Promise<OnlineSessionResult>;
  fetchWhatsappIntegrationStatus(context: GatewayContext): Promise<WhatsappIntegrationStatus>;
  registerMissionPushSubscription(
    context: GatewayContext,
    subscription: PushSubscriptionPayload
  ): Promise<void>;
}

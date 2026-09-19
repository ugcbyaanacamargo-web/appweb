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
import type { AccountInput, GatewayContext, OrisGateway } from './orisGateway';
import { DemoOrisGateway } from './demoOrisGateway';
import { HttpOrisGateway } from './httpOrisGateway';
import {
  integrationStorage,
  loadIntegrationConfig,
  type IntegrationStorage
} from './integrationConfig';

class ConfigurableOrisGateway implements OrisGateway {
  constructor(private readonly storage: IntegrationStorage | undefined) {}

  private current(): OrisGateway {
    const config = loadIntegrationConfig(this.storage);
    if (config.mode === 'http') return new HttpOrisGateway(config);
    return new DemoOrisGateway(this.storage ?? globalThis.localStorage);
  }

  authenticate(input: AccountInput): Promise<AuthResult> {
    return this.current().authenticate(input);
  }

  createAccount(input: AccountInput): Promise<AuthResult> {
    return this.current().createAccount(input);
  }

  requestPasswordReset(input: { email: string }): Promise<void> {
    return this.current().requestPasswordReset(input);
  }

  upsertCustomer(context: GatewayContext, customer: Customer): Promise<Customer> {
    return this.current().upsertCustomer(context, customer);
  }

  fetchCommercialSnapshot(context: GatewayContext): Promise<CommercialSnapshot> {
    return this.current().fetchCommercialSnapshot(context);
  }

  sendDocument(context: GatewayContext, document: SalesDocument): Promise<SendDocumentResult> {
    return this.current().sendDocument(context, document);
  }

  fetchMissions(context: GatewayContext): Promise<Mission[]> {
    return this.current().fetchMissions(context);
  }

  sendMissionReturn(context: GatewayContext, mission: Mission): Promise<void> {
    return this.current().sendMissionReturn(context, mission);
  }

  sendLocation(
    context: GatewayContext,
    position: { latitude: number; longitude: number; capturedAt: string }
  ): Promise<void> {
    return this.current().sendLocation(context, position);
  }

  fetchSellerReport(context: GatewayContext): Promise<SellerReport> {
    return this.current().fetchSellerReport(context);
  }

  createOnlineSession(context: GatewayContext): Promise<OnlineSessionResult> {
    return this.current().createOnlineSession(context);
  }

  fetchWhatsappIntegrationStatus(context: GatewayContext): Promise<WhatsappIntegrationStatus> {
    return this.current().fetchWhatsappIntegrationStatus(context);
  }

  registerMissionPushSubscription(
    context: GatewayContext,
    subscription: PushSubscriptionPayload
  ): Promise<void> {
    return this.current().registerMissionPushSubscription(context, subscription);
  }
}

export function createOrisGateway(storage: IntegrationStorage | undefined = integrationStorage()): OrisGateway {
  return new ConfigurableOrisGateway(storage);
}

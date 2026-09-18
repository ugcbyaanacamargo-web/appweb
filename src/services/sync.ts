import type { OrisDb } from '../infrastructure/db';
import type { GatewayContext, OrisGateway } from '../infrastructure/orisGateway';

export interface SyncResult {
  ok: boolean;
  customerErrors: Array<{ customerId: string; message: string }>;
  synchronizedAt?: string;
  reason?: 'offline' | 'account-blocked' | 'failed';
}

export async function synchronizeCommercialBase(_input: {
  db: OrisDb;
  gateway: OrisGateway;
  context: GatewayContext;
  online: boolean;
}): Promise<SyncResult> {
  return { ok: false, customerErrors: [], reason: 'failed' };
}

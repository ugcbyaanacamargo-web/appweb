import type { SalesDocument } from '../domain/models';
import type { OrisDb } from '../infrastructure/db';
import type { GatewayContext, OrisGateway } from '../infrastructure/orisGateway';

export type SendResult =
  | { ok: true; document: SalesDocument }
  | { ok: false; reason: 'offline' | 'not-found' | 'failed'; document?: SalesDocument };

export async function sendDocumentExplicitly(_input: {
  db: OrisDb;
  gateway: OrisGateway;
  context: GatewayContext;
  documentId: string;
  online: boolean;
}): Promise<SendResult> {
  return { ok: false, reason: 'failed' };
}

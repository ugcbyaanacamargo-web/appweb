import { createContext, useContext } from 'react';
import type { AuthResult, CompanyRef } from '../domain/models';
import type { ContextRecord, OrisDb } from '../infrastructure/db';
import type { GatewayContext, OrisGateway } from '../infrastructure/orisGateway';

export type NoticeTone = 'info' | 'success' | 'warning' | 'error';

export interface AppRuntime {
  db: OrisDb;
  gateway: OrisGateway;
  auth: AuthResult;
  company: CompanyRef;
  gatewayContext: GatewayContext;
  scopeKey: string;
  online: boolean;
  context: ContextRecord;
  revision: number;
  locationTracking: boolean;
  setLocationTracking: (enabled: boolean) => void;
  refreshLocal: () => Promise<void>;
  syncCommercial: () => Promise<void>;
  refreshMissions: (notifyNew?: boolean) => Promise<void>;
  notify: (message: string, tone?: NoticeTone) => void;
}

export const RuntimeContext = createContext<AppRuntime | null>(null);

export function useRuntime(): AppRuntime {
  const value = useContext(RuntimeContext);
  if (!value) throw new Error('ORIS_RUNTIME_NOT_READY');
  return value;
}

export type IntegrationMode = 'demo' | 'http';

export interface IntegrationEndpoints {
  health: string;
  authenticate: string;
  createAccount: string;
  requestPasswordReset: string;
  commercialSnapshot: string;
  upsertCustomer: string;
  sendDocument: string;
  missions: string;
  missionReturn: string;
  location: string;
  sellerReport: string;
  onlineSession: string;
  whatsappStatus: string;
  pushSubscription: string;
}

export interface DemoIntegrationConfig {
  mode: 'demo';
}

export interface HttpIntegrationConfig {
  mode: 'http';
  baseUrl: string;
  endpoints: IntegrationEndpoints;
}

export type IntegrationConfig = DemoIntegrationConfig | HttpIntegrationConfig;

export interface IntegrationStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface IntegrationValidationError {
  field: 'baseUrl' | keyof IntegrationEndpoints | 'config';
  message: string;
}

const STORAGE_KEY = 'oris360.integration.v1';

const EMPTY_ENDPOINTS: IntegrationEndpoints = {
  health: '',
  authenticate: '',
  createAccount: '',
  requestPasswordReset: '',
  commercialSnapshot: '',
  upsertCustomer: '',
  sendDocument: '',
  missions: '',
  missionReturn: '',
  location: '',
  sellerReport: '',
  onlineSession: '',
  whatsappStatus: '',
  pushSubscription: ''
};

export function createEmptyHttpIntegrationConfig(): HttpIntegrationConfig {
  return {
    mode: 'http',
    baseUrl: '',
    endpoints: { ...EMPTY_ENDPOINTS }
  };
}

function isLocalDevelopmentUrl(url: URL): boolean {
  return (
    url.protocol === 'http:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]')
  );
}

function validEndpointPath(value: string): boolean {
  const path = value.trim();
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('://');
}

export function validateIntegrationConfig(config: IntegrationConfig): IntegrationValidationError[] {
  if (config.mode === 'demo') return [];

  const errors: IntegrationValidationError[] = [];
  let parsed: URL | null = null;
  try {
    parsed = new URL(config.baseUrl.trim());
  } catch {
    errors.push({ field: 'baseUrl', message: 'Informe uma URL base válida.' });
  }

  if (parsed && parsed.protocol !== 'https:' && !isLocalDevelopmentUrl(parsed)) {
    errors.push({
      field: 'baseUrl',
      message: 'A API real deve usar HTTPS. HTTP é aceito somente em localhost para desenvolvimento.'
    });
  }

  if (parsed && (parsed.username || parsed.password)) {
    errors.push({
      field: 'baseUrl',
      message: 'Não coloque usuário, senha ou token dentro da URL.'
    });
  }

  for (const [field, value] of Object.entries(config.endpoints) as Array<[keyof IntegrationEndpoints, string]>) {
    if (!validEndpointPath(value)) {
      errors.push({
        field,
        message: 'Informe uma rota iniciando com / e sem domínio, token ou URL completa.'
      });
    }
  }
  return errors;
}

export function loadIntegrationConfig(storage?: IntegrationStorage): IntegrationConfig {
  if (!storage) return { mode: 'demo' };
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return { mode: 'demo' };
  try {
    const value = JSON.parse(raw) as IntegrationConfig;
    return validateIntegrationConfig(value).length === 0 ? value : { mode: 'demo' };
  } catch {
    storage.removeItem(STORAGE_KEY);
    return { mode: 'demo' };
  }
}

export function saveIntegrationConfig(storage: IntegrationStorage, config: IntegrationConfig): void {
  const errors = validateIntegrationConfig(config);
  if (errors.length) {
    throw new Error('INVALID_INTEGRATION_CONFIG');
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(config));
}


export function integrationRealm(config: IntegrationConfig): string {
  if (config.mode === 'demo') return 'demo';
  const url = new URL(config.baseUrl.trim());
  const path = url.pathname.replace(/\/+$/, '');
  const base = url.origin.toLowerCase() + path;
  return 'http:' + base + '|' + config.endpoints.authenticate.trim() + '|' + config.endpoints.commercialSnapshot.trim();
}

export function integrationStorage(): IntegrationStorage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

export function resolveIntegrationUrl(config: HttpIntegrationConfig, path: string): string {
  const base = config.baseUrl.trim().replace(/\/+$/, '');
  return base + path.trim();
}

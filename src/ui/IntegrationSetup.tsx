import { useMemo, useState } from 'react';
import { HttpOrisGateway } from '../infrastructure/httpOrisGateway';
import {
  createEmptyHttpIntegrationConfig,
  integrationStorage,
  loadIntegrationConfig,
  saveIntegrationConfig,
  validateIntegrationConfig,
  type HttpIntegrationConfig,
  type IntegrationEndpoints
} from '../infrastructure/integrationConfig';

interface IntegrationSetupProps {
  onBack: () => void;
  onSaved: (message: string) => void;
}

const ENDPOINTS: Array<{
  key: keyof IntegrationEndpoints;
  label: string;
  help: string;
}> = [
  { key: 'health', label: 'Saúde / teste da API', help: 'Rota GET que confirma que a API está disponível.' },
  { key: 'authenticate', label: 'Login', help: 'Rota POST que autentica e devolve usuário, empresas e sessão.' },
  { key: 'createAccount', label: 'Criar conta', help: 'Rota POST do teste grátis/criação da conta Óris360°.' },
  { key: 'requestPasswordReset', label: 'Recuperar senha', help: 'Rota POST que inicia recuperação de senha sem revelar se o e-mail existe.' },
  { key: 'commercialSnapshot', label: 'Base comercial', help: 'Rota GET de clientes, produtos, preços, estoque e configurações.' },
  { key: 'upsertCustomer', label: 'Enviar cliente', help: 'Rota POST para criar/vincular/atualizar cliente.' },
  { key: 'sendDocument', label: 'Enviar Pedido/Orçamento', help: 'Rota POST com suporte obrigatório a idempotência.' },
  { key: 'missions', label: 'Receber Missões', help: 'Rota GET das Missões atribuídas ao vendedor.' },
  { key: 'missionReturn', label: 'Retorno de Missão', help: 'Rota POST de conclusão/evidências.' },
  { key: 'location', label: 'Localização operacional', help: 'Rota POST para localização autorizada.' },
  { key: 'sellerReport', label: 'Relatórios e Comissões', help: 'Rota GET restrita ao vendedor autenticado.' },
  { key: 'onlineSession', label: 'Login integrado / SSO', help: 'Rota POST que devolve uma URL temporária autenticada do Sistema Online.' },
  { key: 'whatsappStatus', label: 'IA no WhatsApp', help: 'Rota GET do estado da integração e, quando existir, URL de gerenciamento.' },
  { key: 'pushSubscription', label: 'Push de Missões', help: 'Rota POST que registra a assinatura Web Push do aparelho.' }
];

function copyHttp(config: HttpIntegrationConfig): HttpIntegrationConfig {
  return { ...config, endpoints: { ...config.endpoints } };
}

export function IntegrationSetup({ onBack, onSaved }: IntegrationSetupProps) {
  const storage = integrationStorage();
  const loaded = loadIntegrationConfig(storage);
  const initialHttp = loaded.mode === 'http' ? loaded : createEmptyHttpIntegrationConfig();
  const [mode, setMode] = useState<'demo' | 'http'>(loaded.mode);
  const [http, setHttp] = useState<HttpIntegrationConfig>(() => copyHttp(initialHttp));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const errors = useMemo(() => validateIntegrationConfig(mode === 'demo' ? { mode: 'demo' } : http), [mode, http]);

  const saveDemo = () => {
    if (!storage) {
      setResult({ tone: 'error', message: 'O armazenamento local do navegador não está disponível.' });
      return;
    }
    saveIntegrationConfig(storage, { mode: 'demo' });
    onSaved('Modo DEMO ativado. Nenhuma API externa está sendo apresentada como real.');
  };

  const testAndSave = async () => {
    setResult(null);
    if (!storage) {
      setResult({ tone: 'error', message: 'O armazenamento local do navegador não está disponível.' });
      return;
    }
    const validation = validateIntegrationConfig(http);
    if (validation.length) {
      setResult({ tone: 'error', message: validation[0].message });
      return;
    }

    setBusy(true);
    try {
      const gateway = new HttpOrisGateway(http);
      await gateway.testConnection();
      saveIntegrationConfig(storage, http);
      setResult({ tone: 'success', message: 'Conexão validada e configuração salva. As próximas operações já usarão esta API.' });
      onSaved('API real validada e ativada neste aparelho.');
    } catch (error) {
      setResult({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Não foi possível validar a API.'
      });
    } finally {
      setBusy(false);
    }
  };

  const updateEndpoint = (key: keyof IntegrationEndpoints, value: string) => {
    setHttp(current => ({
      ...current,
      endpoints: { ...current.endpoints, [key]: value }
    }));
  };

  return (
    <div className="auth-screen integration-screen">
      <section className="auth-card integration-card" aria-label="Configuração técnica da integração">
        <div className="section-heading">
          <div>
            <span className="eyebrow">INTEGRAÇÃO</span>
            <h1>Conectar Óris360°</h1>
          </div>
          <button className="text-button" onClick={onBack}>Voltar</button>
        </div>

        <div className="info-card integration-explainer">
          <strong>Onde conseguir estes dados?</strong>
          <p>Use a documentação OpenAPI/Swagger ou solicite à equipe responsável pelo backend Óris360° a URL pública HTTPS e as rotas correspondentes abaixo.</p>
          <p><strong>Não cole chave privada, senha de servidor ou token secreto aqui.</strong> Segredos de servidor devem ficar no backend ou nas variáveis protegidas do provedor de hospedagem.</p>
        </div>

        <div className="mode-switch" role="group" aria-label="Modo de integração">
          <button className={mode === 'demo' ? 'mode-option active' : 'mode-option'} onClick={() => setMode('demo')}>DEMO</button>
          <button className={mode === 'http' ? 'mode-option active' : 'mode-option'} onClick={() => setMode('http')}>API REAL</button>
        </div>

        {mode === 'demo' ? (
          <div className="stack">
            <div className="info-card">
              <strong>Modo DEMO</strong>
              <p>Usa somente o servidor simulado deste navegador. Serve para testar o fluxo do App e nunca é apresentado como integração real.</p>
            </div>
            <button className="button primary" onClick={saveDemo}>ATIVAR MODO DEMO</button>
          </div>
        ) : (
          <div className="stack">
            <label className="field">
              <span>URL base da API</span>
              <input
                className="input"
                aria-label="URL base da API"
                placeholder="https://api.sua-plataforma.com"
                value={http.baseUrl}
                onChange={event => setHttp(current => ({ ...current, baseUrl: event.target.value }))}
              />
              <small>Deve ser HTTPS em produção. Ex.: domínio fornecido pelo backend, sem chave ou senha na URL.</small>
            </label>

            <div className="endpoint-grid">
              {ENDPOINTS.map(endpoint => (
                <label className="field endpoint-field" key={endpoint.key}>
                  <span>{endpoint.label}</span>
                  <input
                    className="input"
                    aria-label={endpoint.label}
                    placeholder="/api/v1/..."
                    value={http.endpoints[endpoint.key]}
                    onChange={event => updateEndpoint(endpoint.key, event.target.value)}
                  />
                  <small>{endpoint.help}</small>
                </label>
              ))}
            </div>

            {errors.length > 0 && (
              <div className="validation-summary" role="status">
                <strong>{errors.length} campo(s) ainda precisam ser configurados.</strong>
                <span>{errors[0].message}</span>
              </div>
            )}

            <button className="button primary" disabled={busy} onClick={testAndSave}>
              {busy ? 'TESTANDO CONEXÃO…' : 'TESTAR CONEXÃO E SALVAR'}
            </button>
          </div>
        )}

        {result && <div className={'integration-result ' + result.tone} role={result.tone === 'error' ? 'alert' : 'status'}>{result.message}</div>}
      </section>
    </div>
  );
}

import { useRuntime } from '../app/AppContext';

function OnlineGate({ children }: { children: React.ReactNode }) {
  const runtime = useRuntime();
  if (!runtime.online) {
    return (
      <div className="offline-gate">
        <strong>Conexão necessária</strong>
        <p>Esta área é exclusivamente online. A operação de vendas offline continua disponível nas demais áreas.</p>
      </div>
    );
  }
  return <>{children}</>;
}

export function Reports() {
  return (
    <section className="stack page-section">
      <div className="hero-copy compact">
        <span className="eyebrow">ONLINE</span>
        <h1>Relatórios e Comissões</h1>
        <p>Área destinada exclusivamente aos resultados e comissões do vendedor autenticado.</p>
      </div>
      <OnlineGate>
        <div className="info-card">
          <strong>Integração preparada</strong>
          <p>O App já aplica a exigência de conexão. Os dados reais serão fornecidos pelo endpoint de Relatórios e Comissões quando a API Óris360° for conectada.</p>
        </div>
      </OnlineGate>
    </section>
  );
}

export function OnlineSystem() {
  const runtime = useRuntime();
  return (
    <section className="stack page-section">
      <div className="hero-copy compact">
        <span className="eyebrow">LOGIN INTEGRADO</span>
        <h1>Sistema Online</h1>
        <p>Mesmo usuário e mesma empresa ativa, respeitando as permissões da plataforma web.</p>
      </div>
      <OnlineGate>
        {runtime.context.onlineBaseUrl ? (
          <a className="button primary link-button" href={runtime.context.onlineBaseUrl} target="_blank" rel="noreferrer">
            ABRIR SISTEMA ONLINE
          </a>
        ) : (
          <div className="info-card">
            <strong>URL ainda não configurada</strong>
            <p>O endereço e o token/SSO serão fornecidos pela API oficial. Nenhum endereço foi inventado no App.</p>
          </div>
        )}
      </OnlineGate>
    </section>
  );
}

export function WhatsappAI() {
  return (
    <section className="stack page-section">
      <div className="hero-copy compact">
        <span className="eyebrow">INTEGRAÇÃO PREVISTA</span>
        <h1>IA no WhatsApp</h1>
        <p>Espaço reservado para a integração Óris360° com inteligência artificial através do WhatsApp.</p>
      </div>
      <div className="info-card">
        <strong>Contrato de integração aguardando API</strong>
        <p>A arquitetura interna de agentes, ativação e autenticação não foi inventada nesta versão, conforme a especificação.</p>
      </div>
    </section>
  );
}

export function Help() {
  const runtime = useRuntime();
  return (
    <section className="stack page-section">
      <div className="hero-copy compact">
        <span className="eyebrow">SUPORTE</span>
        <h1>Ajuda</h1>
        <p>Contatos carregados pela configuração central, sem necessidade de republicar o App.</p>
      </div>
      <div className="contact-grid">
        <div className="info-card">
          <span className="eyebrow">WHATSAPP / TELEFONE</span>
          <strong>{runtime.context.helpPhone ?? 'Não configurado pela central'}</strong>
        </div>
        <div className="info-card">
          <span className="eyebrow">E-MAIL</span>
          <strong>{runtime.context.helpEmail ?? 'Não configurado pela central'}</strong>
        </div>
      </div>
    </section>
  );
}

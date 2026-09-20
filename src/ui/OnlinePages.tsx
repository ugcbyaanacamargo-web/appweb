import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { SellerReport, WhatsappIntegrationStatus } from '../domain/models';
import { useRuntime } from '../app/AppContext';
import { pageRequiresOnline, type MainPage } from './menu';
import { integrationStorage, loadIntegrationConfig } from '../infrastructure/integrationConfig';

function OnlineGate({
  page,
  children
}: {
  page: Extract<MainPage, 'reports' | 'online'>;
  children: ReactNode;
}) {
  const runtime = useRuntime();
  if (pageRequiresOnline(page) && !runtime.online) {
    return (
      <div className="offline-gate">
        <strong>Conexão necessária</strong>
        <p>Esta área é exclusivamente online. A operação de vendas offline continua disponível nas demais áreas.</p>
      </div>
    );
  }
  return <>{children}</>;
}

function money(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function openSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const local = url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
    if (url.protocol !== 'https:' && !local) return false;
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
    return true;
  } catch {
    return false;
  }
}

export function Reports() {
  const runtime = useRuntime();
  const [report, setReport] = useState<SellerReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!runtime.online) return;
    setLoading(true);
    setError('');
    try {
      setReport(await runtime.gateway.fetchSellerReport(runtime.gatewayContext));
    } catch (reason) {
      setReport(null);
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o relatório.');
    } finally {
      setLoading(false);
    }
  }, [runtime.online, runtime.gateway, runtime.gatewayContext]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="stack page-section">
      <div className="hero-copy compact">
        <span className="eyebrow">ONLINE</span>
        <h1>Relatórios e Comissões</h1>
        <p>Somente resultados vinculados ao vendedor autenticado e à empresa ativa.</p>
      </div>
      <OnlineGate page="reports">
        {loading && <div className="loading-card">Carregando seus resultados…</div>}
        {error && (
          <div className="info-card error-card">
            <strong>Não foi possível carregar</strong>
            <p>{error}</p>
            <button className="button secondary" onClick={load}>TENTAR NOVAMENTE</button>
          </div>
        )}
        {report && (
          <div className="stack">
            <div className="info-card">
              <span className="eyebrow">PERÍODO</span>
              <strong>{report.periodLabel}</strong>
            </div>
            <div className="metric-grid">
              <div className="metric-card"><span>Pedidos</span><strong>{report.ordersCount}</strong></div>
              <div className="metric-card"><span>Orçamentos</span><strong>{report.quotesCount}</strong></div>
              <div className="metric-card"><span>Vendas</span><strong>{money(report.grossSales)}</strong></div>
              <div className="metric-card"><span>Comissão</span><strong>{money(report.commissionValue)}</strong><small>{report.commissionPercent.toLocaleString('pt-BR')}%</small></div>
            </div>
          </div>
        )}
      </OnlineGate>
    </section>
  );
}

const SABORIZA_LOGIN_URL = 'https://saboriza-catalogo.vercel.app/admin/login';

export function OnlineSystem({ onConfigureIntegration }: { onConfigureIntegration: () => void }) {
  const runtime = useRuntime();
  const demoMode = loadIntegrationConfig(integrationStorage()).mode === 'demo';
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const open = async () => {
    if (!runtime.online) return;
    setBusy(true);
    setMessage('');
    try {
      const session = await runtime.gateway.createOnlineSession(runtime.gatewayContext);
      if (session.available && session.url && openSafeExternalUrl(session.url)) return;
      setMessage(session.message || 'O backend ainda não forneceu uma sessão integrada do Sistema Online.');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Não foi possível abrir o Sistema Online.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="stack page-section">
      <div className="hero-copy compact">
        <span className="eyebrow">SISTEMA ONLINE</span>
        <h1>Sistema Online</h1>
        <p>Acesse o painel Saboriza. O login integrado só será usado quando a conexão oficial da sua conta estiver disponível.</p>
      </div>
      <OnlineGate page="online">
        <div className="info-card">
          <strong>Entrar no painel da empresa</strong>
          <p>{demoMode ? 'A conta DEMO não autentica no Saboriza.' : 'Enquanto a sessão integrada não estiver disponível, pode ser necessário entrar novamente no Saboriza.'}</p>
          <a
            className="button secondary"
            href={SABORIZA_LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
          >ACESSAR PAINEL SABORIZA</a>
          <p>Para entrar sem digitar a senha novamente, a integração oficial precisa emitir uma sessão de uso único.</p>
          <button className="button primary" disabled={busy} onClick={open}>
            {busy ? 'ABRINDO…' : 'ABRIR SISTEMA ONLINE'}
          </button>
        </div>
        {message && (
          <div className="info-card warning-card">
            <strong>Integração ainda não disponível</strong>
            <p>{message}</p>
            <button className="button secondary" onClick={onConfigureIntegration}>CONFIGURAR API</button>
          </div>
        )}
      </OnlineGate>
    </section>
  );
}

export function WhatsappAI({ onConfigureIntegration }: { onConfigureIntegration: () => void }) {
  const runtime = useRuntime();
  const [status, setStatus] = useState<WhatsappIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!runtime.online) return;
    setLoading(true);
    setError('');
    try {
      setStatus(await runtime.gateway.fetchWhatsappIntegrationStatus(runtime.gatewayContext));
    } catch (reason) {
      setStatus(null);
      setError(reason instanceof Error ? reason.message : 'Não foi possível consultar a integração.');
    } finally {
      setLoading(false);
    }
  }, [runtime.online, runtime.gateway, runtime.gatewayContext]);

  useEffect(() => {
    load();
  }, [load]);

  const openManagement = () => {
    if (!status?.managementUrl || !openSafeExternalUrl(status.managementUrl)) {
      runtime.notify('A URL de gerenciamento recebida não é válida/segura.', 'error');
    }
  };

  return (
    <section className="stack page-section">
      <div className="hero-copy compact">
        <span className="eyebrow">INTEGRAÇÃO</span>
        <h1>IA no WhatsApp</h1>
        <p>Estado da integração da empresa ativa com o canal de inteligência artificial no WhatsApp.</p>
      </div>

      {!runtime.online && (
        <div className="offline-gate">
          <strong>Conexão necessária para consultar a integração</strong>
          <p>Suas vendas offline continuam funcionando normalmente.</p>
        </div>
      )}

      {runtime.online && loading && <div className="loading-card">Consultando integração…</div>}
      {runtime.online && error && (
        <div className="info-card error-card">
          <strong>Falha ao consultar</strong>
          <p>{error}</p>
          <button className="button secondary" onClick={load}>TENTAR NOVAMENTE</button>
        </div>
      )}
      {runtime.online && status && (
        <div className="info-card">
          <span className={status.connected ? 'status-pill done' : 'status-pill'}>
            {status.connected ? 'Conectado' : status.available ? 'Disponível' : 'Não configurado'}
          </span>
          <strong>{status.connected ? 'WhatsApp integrado' : 'Integração pendente'}</strong>
          <p>{status.message || 'Consulte o backend Óris360° para concluir a configuração.'}</p>
          {status.managementUrl && <button className="button primary" onClick={openManagement}>GERENCIAR INTEGRAÇÃO</button>}
          {!status.available && <button className="button secondary" onClick={onConfigureIntegration}>CONFIGURAR API</button>}
        </div>
      )}
    </section>
  );
}

export function Help() {
  const runtime = useRuntime();
  const phone = runtime.context.helpPhone?.trim();
  const email = runtime.context.helpEmail?.trim();
  const whatsappDigits = phone?.replace(/\D/g, '');

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
          <strong>{phone ?? 'Não configurado pela central'}</strong>
          {phone && (
            <div className="action-stack">
              <a className="button secondary" href={'tel:' + phone}>LIGAR</a>
              {whatsappDigits && whatsappDigits.length >= 8 && (
                <a className="button primary" href={'https://wa.me/' + whatsappDigits} target="_blank" rel="noreferrer">ABRIR WHATSAPP</a>
              )}
            </div>
          )}
        </div>
        <div className="info-card">
          <span className="eyebrow">E-MAIL</span>
          <strong>{email ?? 'Não configurado pela central'}</strong>
          {email && <a className="button secondary" href={'mailto:' + encodeURIComponent(email)}>ENVIAR E-MAIL</a>}
        </div>
      </div>
    </section>
  );
}

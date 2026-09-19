import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AuthResult, CompanyRef, SalesDocument } from '../domain/models';
import { OrisDb, type ContextRecord } from '../infrastructure/db';
import { DEMO_CREDENTIALS } from '../infrastructure/demoOrisGateway';
import { createOrisGateway } from '../infrastructure/gatewayFactory';
import { readOnline, subscribeConnectivity } from '../infrastructure/connectivity';
import { subscribeMissionPush, unsubscribeMissionPush } from '../infrastructure/push';
import { getOrCreateDeviceId, makeScopeKey } from '../infrastructure/scope';
import type { GatewayContext } from '../infrastructure/orisGateway';
import { synchronizeCommercialBase } from '../services/sync';
import { flushMissionReturns } from '../services/missions';
import { canEnterCompanyContext } from './accessPolicy';
import {
  cacheOfflineCredentials,
  clearLiveSession,
  loadLiveSession,
  saveLiveSession,
  verifyOfflineCredentials
} from './session';
import { RuntimeContext, type NoticeTone } from './AppContext';
import { Shell } from '../ui/Shell';
import { Orders } from '../ui/Orders';
import { Customers } from '../ui/Customers';
import { Products } from '../ui/Products';
import { Missions } from '../ui/Missions';
import { Help, OnlineSystem, Reports, WhatsappAI } from '../ui/OnlinePages';
import { QuoteEditor } from '../ui/QuoteEditor';
import { IntegrationSetup } from '../ui/IntegrationSetup';
import { integrationRealm, integrationStorage, loadIntegrationConfig } from '../infrastructure/integrationConfig';
import { ForgotPassword } from '../ui/ForgotPassword';
import type { MainPage } from '../ui/menu';

type Stage = 'landing' | 'login' | 'register' | 'forgot' | 'integration' | 'companies' | 'app';

interface ActiveRuntime {
  auth: AuthResult;
  company: CompanyRef;
  scopeKey: string;
  gatewayContext: GatewayContext;
  context: ContextRecord;
}

interface Notice {
  message: string;
  tone: NoticeTone;
}

const db = new OrisDb();
const gateway = createOrisGateway();

function pageTitle(page: MainPage | 'editor'): string {
  const titles: Record<MainPage | 'editor', string> = {
    orders: 'Pedidos',
    customers: 'Clientes',
    products: 'Produtos',
    missions: 'Tarefas / Missões',
    whatsapp: 'IA no WhatsApp',
    reports: 'Relatórios e Comissões',
    online: 'Sistema Online',
    help: 'Ajuda',
    editor: 'Documento'
  };
  return titles[page];
}

function AuthCard({
  mode,
  online,
  onBack,
  onSubmit,
  onForgot,
  demoMode
}: {
  mode: 'login' | 'register';
  online: boolean;
  onBack: () => void;
  onSubmit: (email: string, password: string) => Promise<void>;
  onForgot: (email: string) => void;
  demoMode: boolean;
}) {
  const [email, setEmail] = useState(mode === 'login' && demoMode ? DEMO_CREDENTIALS.email : '');
  const [password, setPassword] = useState(mode === 'login' && demoMode ? DEMO_CREDENTIALS.password : '');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand-lockup">
          <div className="brand-mark large">Ó</div>
          <div>
            <strong>Óris360°</strong>
            <span>Vendas Mobile</span>
          </div>
        </div>
        <span className={online ? 'network online' : 'network offline'}>{online ? 'Online' : 'Offline'}</span>
        <div className="hero-copy">
          <span className="eyebrow">{mode === 'login' ? 'ACESSO' : 'NOVA CONTA'}</span>
          <h1>{mode === 'login' ? 'Entrar na operação' : 'Começar teste grátis'}</h1>
          <p>
            {mode === 'login'
              ? 'Depois da primeira sincronização válida neste aparelho, você poderá entrar e vender offline.'
              : '7 dias grátis, sem cobrança automática. Esta ação cria uma nova conta Óris360°.'}
          </p>
        </div>

        <label className="field">
          <span>E-mail</span>
          <input className="input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span>Senha</span>
          <div className="password-field">
            <input
              className="input"
              type={visible ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button onClick={() => setVisible(value => !value)}>{visible ? 'Ocultar' : 'Ver'}</button>
          </div>
        </label>

        <button
          className="button primary"
          disabled={busy || !email.trim() || !password}
          onClick={async () => {
            setBusy(true);
            try { await onSubmit(email, password); } finally { setBusy(false); }
          }}
        >
          {busy ? 'PROCESSANDO…' : mode === 'login' ? 'ENTRAR' : 'CRIAR UMA CONTA'}
        </button>
        <button className="button secondary" onClick={onBack}>VOLTAR</button>
        {mode === 'login' && <button className="text-button centered" onClick={() => onForgot(email)}>Esqueci a senha</button>}

        <p className="privacy-note">
          Dados comerciais necessários ficam armazenados localmente neste aparelho para permitir a operação offline.
        </p>

        {mode === 'login' && demoMode && (
          <div className="demo-credentials">
            <span className="eyebrow">MODO DEMONSTRAÇÃO</span>
            <code>{DEMO_CREDENTIALS.email}</code>
            <code>{DEMO_CREDENTIALS.password}</code>
          </div>
        )}
      </div>
    </div>
  );
}

export function App() {
  const [stage, setStage] = useState<Stage>('landing');
  const [auth, setAuth] = useState<AuthResult | null>(null);
  const [active, setActive] = useState<ActiveRuntime | null>(null);
  const [page, setPage] = useState<MainPage | 'editor'>('orders');
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [online, setOnline] = useState(readOnline());
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [locationTracking, setLocationTracking] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const noticeTimer = useRef<number | null>(null);
  const syncInFlight = useRef(false);
  const lastLocationSentAt = useRef(0);

  const notify = useCallback((message: string, tone: NoticeTone = 'info') => {
    setNotice({ message, tone });
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 5000);
  }, []);

  const refreshLocal = useCallback(async () => {
    if (active) {
      const context = await db.contexts.get(active.scopeKey);
      if (context) setActive(current => current ? { ...current, context } : current);
    }
    setRevision(value => value + 1);
  }, [active?.scopeKey]);

  const refreshMissions = useCallback(async (notifyNew = true) => {
    if (!active || !online) return;
    try {
      const localRows = await db.missions.where('scopeKey').equals(active.scopeKey).toArray();
      const localById = new Map(localRows.map(mission => [mission.id, mission]));
      const serverRows = await gateway.fetchMissions(active.gatewayContext);
      let newCount = 0;

      for (const serverMission of serverRows) {
        const local = localById.get(serverMission.id);
        if (!local) newCount += 1;
        if (local?.pendingReturn) continue;
        await db.missions.put({ ...serverMission, scopeKey: active.scopeKey });
      }
      if (newCount > 0 && notifyNew && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Óris360°', { body: newCount + ' nova(s) Tarefa(s) / Missão(ões).' });
      }
      setRevision(value => value + 1);
    } catch {
      // Missões são um canal independente e não podem invalidar a operação comercial.
    }
  }, [active?.scopeKey, online]);

  const activateCompany = useCallback(async (sessionAuth: AuthResult, companyId: string) => {
    const company = sessionAuth.companies.find(item => item.id === companyId);
    if (!company) {
      notify('Empresa não encontrada para este usuário.', 'error');
      return false;
    }

    const deviceId = getOrCreateDeviceId(localStorage);
    const realm = integrationRealm(loadIntegrationConfig(integrationStorage()));
    const scopeKey = makeScopeKey({
      deviceId,
      userId: sessionAuth.user.id,
      companyId,
      realm
    });
    const gatewayContext: GatewayContext = {
      companyId,
      userId: sessionAuth.user.id,
      scopeKey,
      token: sessionAuth.token
    };

    let context = await db.contexts.get(scopeKey);
    const currentOnline = readOnline();
    if (!canEnterCompanyContext(currentOnline, context?.lastSuccessfulSyncAt)) {
      notify('O primeiro acesso desta empresa neste aparelho exige internet.', 'warning');
      return false;
    }
    if (!context?.lastSuccessfulSyncAt) {

      const placeholder: ContextRecord = {
        scopeKey,
        userName: sessionAuth.user.name,
        companyName: company.name,
        activatedAt: new Date().toISOString(),
        accountBlocked: false
      };
      await db.contexts.put(placeholder);
      const result = await synchronizeCommercialBase({
        db,
        gateway,
        context: gatewayContext,
        online: true
      });
      if (!result.ok) {
        await db.contexts.delete(scopeKey);
        notify(
          result.reason === 'account-blocked'
            ? 'Esta conta está bloqueada e ainda não possui uma base válida neste aparelho.'
            : 'Não foi possível concluir a primeira sincronização. A base local não foi ativada.',
          'error'
        );
        return false;
      }
      context = await db.contexts.get(scopeKey);
    }

    if (!context) return false;
    const runtime: ActiveRuntime = { auth: sessionAuth, company, scopeKey, gatewayContext, context };
    setAuth(sessionAuth);
    setActive(runtime);
    setStage('app');
    const requestedPage = new URLSearchParams(window.location.search).get('open') === 'missions'
      ? 'missions'
      : 'orders';
    setPage(requestedPage);
    if (requestedPage === 'missions') {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    }
    setDocumentId(null);
    setMenuOpen(true);
    saveLiveSession(sessionStorage, { auth: sessionAuth, activeCompanyId: companyId });

    if (readOnline()) {
      if (
        context.missionPushPublicKey &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          const subscription = await subscribeMissionPush(context.missionPushPublicKey);
          await gateway.registerMissionPushSubscription(gatewayContext, subscription);
        } catch {
          // Push é auxiliar; uma falha de registro não bloqueia a operação comercial.
        }
      }

      try {
        const missions = await gateway.fetchMissions(gatewayContext);
        for (const mission of missions) {
          const local = await db.missions.get([scopeKey, mission.id]);
          if (!local?.pendingReturn) await db.missions.put({ ...mission, scopeKey });
        }
      } catch {
        // Falha no canal de Missões não impede login nem acesso à base comercial válida.
      }
    }
    setRevision(value => value + 1);
    return true;
  }, [notify]);

  useEffect(() => {
    const unsubscribe = subscribeConnectivity(setOnline);
    const saved = loadLiveSession(sessionStorage);
    if (saved) {
      setAuth(saved.auth);
      if (saved.activeCompanyId) {
        activateCompany(saved.auth, saved.activeCompanyId);
      } else {
        setStage('companies');
      }
    }
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!active || !online) return;
    let cancelled = false;
    const run = async () => {
      try {
        await flushMissionReturns({ db, gateway, context: active.gatewayContext, online: true });
        if (!cancelled) await refreshMissions(true);
      } catch {
        // Conectividade instável mantém retornos locais pendentes para a próxima tentativa.
      }
    };
    run();
    const id = window.setInterval(run, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [active?.scopeKey, online, refreshMissions]);

  useEffect(() => {
    if (!active || !online || !locationTracking || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      position => {
        const now = Date.now();
        if (now - lastLocationSentAt.current < 60_000) return;
        lastLocationSentAt.current = now;
        gateway.sendLocation(active.gatewayContext, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          capturedAt: new Date(position.timestamp).toISOString()
        }).catch(() => undefined);
      },
      () => notify('Localização operacional indisponível. Verifique a permissão do dispositivo.', 'warning'),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 20_000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [active?.scopeKey, online, locationTracking]);

  const handleLogin = async (email: string, password: string) => {
    try {
      const realm = integrationRealm(loadIntegrationConfig(integrationStorage()));
      const result = online
        ? await gateway.authenticate({ email, password })
        : await verifyOfflineCredentials(localStorage, email, password, realm);

      if (!result) {
        notify('Login offline indisponível. Faça primeiro um login e sincronização válidos com internet.', 'warning');
        return;
      }
      if (online) await cacheOfflineCredentials(localStorage, email, password, result, realm);
      setAuth(result);

      if (result.companies.length === 1) {
        await activateCompany(result, result.companies[0].id);
      } else {
        saveLiveSession(sessionStorage, { auth: result });
        setStage('companies');
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Falha ao entrar.', 'error');
    }
  };

  const handleRegister = async (email: string, password: string) => {
    if (!online) {
      notify('Criar uma nova conta exige conexão com internet.', 'warning');
      return;
    }
    try {
      const result = await gateway.createAccount({ email, password });
      const realm = integrationRealm(loadIntegrationConfig(integrationStorage()));
      await cacheOfflineCredentials(localStorage, email, password, result, realm);
      setAuth(result);
      await activateCompany(result, result.companies[0].id);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Não foi possível criar a conta.', 'error');
    }
  };

  const syncCommercial = useCallback(async () => {
    if (!active) return;
    if (!online) {
      notify('Sem conexão. A última base válida continua disponível.', 'warning');
      return;
    }
    if (syncInFlight.current) {
      notify('Uma sincronização já está em andamento.', 'info');
      return;
    }

    syncInFlight.current = true;
    try {
      const result = await synchronizeCommercialBase({
        db,
        gateway,
        context: active.gatewayContext,
        online
      });
      if (result.ok) {
        notify(
          result.customerErrors.length
            ? 'SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO. Uma pendência de cliente foi mantida para nova tentativa.'
            : 'SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO.',
          'success'
        );
      } else if (result.reason === 'account-blocked') {
        notify('Conta bloqueada: a base comercial não foi atualizada. Vendas offline e envio explícito de documentos continuam disponíveis.', 'warning');
      } else {
        notify('Sincronização não concluída. A última base válida foi preservada.', 'error');
      }
      await refreshLocal();
    } catch {
      notify('Sincronização não concluída. A última base válida foi preservada.', 'error');
    } finally {
      syncInFlight.current = false;
    }
  }, [active?.scopeKey, online, notify, refreshLocal]);

  const newDocument = async () => {
    if (!active) return;
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const document: SalesDocument = {
      id,
      scopeKey: active.scopeKey,
      kind: 'quote',
      state: 'local',
      items: [],
      supplemental: {},
      sellerId: active.auth.user.id,
      createdAt: now,
      updatedAt: now,
      idempotencyKey: 'send:' + id
    };
    await db.documents.put(document);
    setDocumentId(id);
    setPage('editor');
    setMenuOpen(false);
    await refreshLocal();
  };

  const openDocument = (id: string) => {
    setDocumentId(id);
    setPage('editor');
    setMenuOpen(false);
  };

  const logout = async () => {
    try { await unsubscribeMissionPush(); } catch { /* best effort */ }
    clearLiveSession(sessionStorage);
    setActive(null);
    setAuth(null);
    setStage('landing');
    setPage('orders');
    setLocationTracking(false);
    notify('Sessão encerrada. Os dados locais foram preservados neste aparelho.', 'info');
  };

  const chooseAnotherCompany = async () => {
    if (!auth) return;
    try { await unsubscribeMissionPush(); } catch { /* best effort */ }
    setStage('companies');
    setMenuOpen(false);
    setActive(null);
    saveLiveSession(sessionStorage, { auth });
  };

  const integrationSaved = (message: string) => {
    void unsubscribeMissionPush().catch(() => undefined);
    clearLiveSession(sessionStorage);
    setActive(null);
    setAuth(null);
    setPage('orders');
    setDocumentId(null);
    setMenuOpen(false);
    setLocationTracking(false);
    setStage('landing');
    notify(message + ' Faça login novamente para iniciar uma sessão compatível com a integração selecionada.', 'success');
  };

  const runtimeValue = useMemo(() => active ? {
    db,
    gateway,
    auth: active.auth,
    company: active.company,
    gatewayContext: active.gatewayContext,
    scopeKey: active.scopeKey,
    online,
    context: active.context,
    revision,
    locationTracking,
    setLocationTracking,
    refreshLocal,
    syncCommercial,
    refreshMissions,
    notify
  } : null, [
    active,
    online,
    revision,
    locationTracking,
    refreshLocal,
    syncCommercial,
    refreshMissions,
    notify
  ]);

  const integrationMode = loadIntegrationConfig(integrationStorage()).mode;

  let content: React.ReactNode = null;
  if (stage === 'landing') {
    content = (
      <div className="landing-screen">
        <div className="landing-orb orb-one" />
        <div className="landing-orb orb-two" />
        <div className="landing-card">
          <div className="brand-lockup large-lockup">
            <div className="brand-mark large">Ó</div>
            <div>
              <strong>Óris360°</strong>
              <span>Vendas Mobile</span>
            </div>
          </div>
          <div className="hero-copy">
            <span className="eyebrow">VENDA EM QUALQUER CENÁRIO</span>
            <h1>Seu campo de vendas continua mesmo sem internet.</h1>
            <p>Depois da primeira sincronização válida, clientes, catálogo e documentos essenciais ficam prontos para operação local.</p>
          </div>
          <div className="landing-actions">
            <button className="button primary" onClick={() => setStage('register')}>CRIAR UMA CONTA</button>
            <button className="button light" onClick={() => setStage('login')}>JÁ TENHO CONTA</button>
            <button className="landing-config-button" onClick={() => setStage('integration')}>CONFIGURAR INTEGRAÇÃO</button>
          </div>
          <div className="landing-status-row">
            <span className={online ? 'network online invertible' : 'network offline invertible'}>
              {online ? 'Conectado' : 'Sem internet'}
            </span>
            <span className="integration-mode-label">{integrationMode === 'demo' ? 'Ambiente DEMO' : 'API real configurada'}</span>
          </div>
        </div>
      </div>
    );
  } else if (stage === 'login') {
    content = <AuthCard mode="login" online={online} demoMode={integrationMode === 'demo'} onBack={() => setStage('landing')} onSubmit={handleLogin} onForgot={email => { setRecoveryEmail(email); setStage('forgot'); }} />;
  } else if (stage === 'register') {
    content = <AuthCard mode="register" online={online} demoMode={integrationMode === 'demo'} onBack={() => setStage('landing')} onSubmit={handleRegister} onForgot={() => undefined} />;
  } else if (stage === 'forgot') {
    content = <ForgotPassword gateway={gateway} initialEmail={recoveryEmail} onBack={() => setStage('login')} />;
  } else if (stage === 'integration') {
    content = <IntegrationSetup onBack={() => setStage(active ? 'app' : 'landing')} onSaved={integrationSaved} />;
  } else if (stage === 'companies' && auth) {
    content = (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="brand-lockup">
            <div className="brand-mark large">Ó</div>
            <div><strong>Óris360°</strong><span>Selecionar empresa</span></div>
          </div>
          <div className="hero-copy">
            <span className="eyebrow">CONTEXTO ISOLADO</span>
            <h1>Qual empresa está ativa?</h1>
            <p>Cada empresa possui base local, documentos e sincronização completamente separados.</p>
          </div>
          <div className="company-options">
            {auth.companies.map(company => (
              <button className="company-option" key={company.id} onClick={() => activateCompany(auth, company.id)}>
                <span className="company-avatar">{company.name.slice(0, 1).toUpperCase()}</span>
                <div><strong>{company.name}</strong><span>Entrar nesta empresa</span></div>
                <span>›</span>
              </button>
            ))}
          </div>
          <button className="button secondary" onClick={logout}>SAIR DA MINHA CONTA</button>
        </div>
      </div>
    );
  } else if (stage === 'app' && active && runtimeValue) {
    const pageNode =
      page === 'orders' ? <Orders onNew={newDocument} onOpen={openDocument} /> :
      page === 'customers' ? <Customers /> :
      page === 'products' ? <Products /> :
      page === 'missions' ? <Missions /> :
      page === 'whatsapp' ? <WhatsappAI onConfigureIntegration={() => setStage('integration')} /> :
      page === 'reports' ? <Reports /> :
      page === 'online' ? <OnlineSystem onConfigureIntegration={() => setStage('integration')} /> :
      page === 'help' ? <Help /> :
      documentId ? <QuoteEditor documentId={documentId} onBack={() => { setPage('orders'); setDocumentId(null); }} onOpenDocument={openDocument} /> :
      <Orders onNew={newDocument} onOpen={openDocument} />;

    content = (
      <RuntimeContext.Provider value={runtimeValue}>
        <Shell
          page={page}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          title={pageTitle(page)}
          userName={active.auth.user.name}
          companyName={active.company.name}
          lastSync={active.context.lastSuccessfulSyncAt}
          online={online}
          onNavigate={next => { setPage(next); setDocumentId(null); }}
          onSync={syncCommercial}
          onSwitchCompany={chooseAnotherCompany}
          onLogout={logout}
        >
          {pageNode}
        </Shell>
      </RuntimeContext.Provider>
    );
  }

  return (
    <>
      {content}
      {notice && (
        <div
          className={'toast ' + notice.tone}
          role={notice.tone === 'error' ? 'alert' : 'status'}
          aria-live={notice.tone === 'error' ? 'assertive' : 'polite'}
        >
          {notice.message}
        </div>
      )}
    </>
  );
}

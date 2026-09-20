import { useEffect, useState } from 'react';
import type { SellerReport } from '../domain/models';
import { useRuntime } from '../app/AppContext';
import { DemoOrisGateway } from '../infrastructure/demoOrisGateway';
import { integrationStorage, loadIntegrationConfig } from '../infrastructure/integrationConfig';

interface SellerDocument {
  officialNumber: string;
  kind: 'quote' | 'order';
  receivedAt: string;
  items: Array<{ quantity: number; unitPrice: number }>;
}

function money(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function SellerPanel({ onBack, onCompanyPanel }: {
  onBack: () => void;
  onCompanyPanel: () => void;
}) {
  const runtime = useRuntime();
  const demo = loadIntegrationConfig(integrationStorage()).mode === 'demo';
  const [report, setReport] = useState<SellerReport | null>(null);
  const [documents, setDocuments] = useState<SellerDocument[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const isAdmin = runtime.company.role === 'owner' || runtime.company.role === 'admin';

  useEffect(() => {
    let cancelled = false;
    if (!runtime.online) { setBusy(false); return; }
    setBusy(true);
    setError('');
    const load = async () => {
      try {
        const result = await runtime.gateway.fetchSellerReport(runtime.gatewayContext);
        const central = demo
          ? await new DemoOrisGateway().fetchSellerDocuments(runtime.gatewayContext)
          : [];
        if (!cancelled) {
          setReport(result);
          setDocuments(central);
        }
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o painel.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [runtime.scopeKey, runtime.online, demo, runtime.gateway]);

  return (
    <div className="web-panel">
      <header className="web-panel-header">
        <div className="brand-lockup"><div className="brand-mark">Ó</div><div><strong>Óris360°</strong><span>Sistema Online · Vendedor</span></div></div>
        <div className="panel-actions">
          {isAdmin && <button className="button secondary" onClick={onCompanyPanel}>PAINEL DA EMPRESA</button>}
          <button className="button secondary" onClick={onBack}>VOLTAR AO APP</button>
        </div>
      </header>
      <main className="web-panel-content stack">
        <div className="hero-copy compact">
          <span className="eyebrow">{demo ? 'Ambiente DEMO' : 'ÁREA ONLINE'}</span>
          <h1>Painel do vendedor Óris360°</h1>
          <p>{runtime.auth.user.name} · {runtime.company.name}</p>
        </div>
        {!runtime.online && <div className="offline-gate"><strong>Conexão necessária</strong><p>Use o App para continuar vendendo offline. Este painel consulta somente dados centrais.</p></div>}
        {runtime.online && busy && <div className="loading-card">Carregando seu painel…</div>}
        {runtime.online && error && <div className="info-card error-card" role="alert"><strong>Não foi possível carregar</strong><p>{error}</p></div>}
        {runtime.online && !busy && report && (
          <>
            <div className="info-card">
              <span className="eyebrow">{report.periodLabel}</span>
              <strong>Seus resultados</strong>
              <p>Somente a empresa ativa e o vendedor autenticado.</p>
              {demo && <p>Os dados do DEMO existem apenas neste navegador; não são documentos compartilhados na nuvem.</p>}
            </div>
            <div className="metric-grid">
              <div className="metric-card"><span>Pedidos enviados</span><strong>{report.ordersCount}</strong></div>
              <div className="metric-card"><span>Orçamentos enviados</span><strong>{report.quotesCount}</strong></div>
              <div className="metric-card"><span>Vendas</span><strong>{money(report.grossSales)}</strong></div>
              <div className="metric-card"><span>Comissão</span><strong>{money(report.commissionValue)}</strong><small>{report.commissionPercent}%</small></div>
            </div>
            <section className="stack">
              <h2>Documentos enviados</h2>
              {!demo
                ? <div className="info-card warning-card"><strong>Histórico central ainda não integrado</strong><p>A API própria do Óris360° deverá oferecer consulta autenticada dos documentos deste vendedor. Nenhum histórico é baixado ao App mobile.</p></div>
                : documents.length === 0
                ? <div className="empty-state small"><strong>Nenhum documento enviado neste ambiente DEMO</strong><p>Envie um documento manualmente pelo App para vê-lo aqui.</p></div>
                : documents.map(doc => (
                  <article className="list-card" key={doc.officialNumber}>
                    <div className="product-copy">
                      <strong>{doc.officialNumber}</strong>
                      <span>{doc.kind === 'order' ? 'Pedido' : 'Orçamento'} · {new Date(doc.receivedAt).toLocaleString('pt-BR')}</span>
                      <span>{money(doc.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0))}</span>
                    </div>
                  </article>
                ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

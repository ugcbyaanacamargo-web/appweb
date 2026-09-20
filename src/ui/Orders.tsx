import { useEffect, useMemo, useState } from 'react';
import type { SalesDocument } from '../domain/models';
import { documentTotal } from '../domain/rules';
import { getScopeDocuments } from '../infrastructure/db';
import { useRuntime } from '../app/AppContext';

interface OrdersProps {
  onNew: () => void;
  onOpen: (id: string) => void;
}

function statusLabel(document: SalesDocument): string {
  if (document.kind === 'quote') return 'Em orçamento';
  return document.state === 'sent' ? 'Concluído' : 'Concluído';
}

function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function Orders({ onNew, onOpen }: OrdersProps) {
  const runtime = useRuntime();
  const [documents, setDocuments] = useState<SalesDocument[]>([]);
  const [tab, setTab] = useState<'all' | 'unsent'>('all');

  useEffect(() => {
    getScopeDocuments(runtime.db, runtime.scopeKey).then(rows => {
      setDocuments(
        rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      );
    });
  }, [runtime.db, runtime.scopeKey, runtime.revision]);

  const unsentCount = documents.filter(document => document.state === 'local').length;
  const sentCount = documents.length - unsentCount;
  const visible = useMemo(
    () => tab === 'all' ? documents : documents.filter(document => document.state === 'local'),
    [documents, tab]
  );

  return (
    <section className="stack page-section">
      <div className="hero-copy compact">
        <span className="eyebrow">OPERAÇÃO LOCAL</span>
        <h1>Pedidos</h1>
        <p>Seus documentos deste aparelho. O histórico central nunca é baixado para cá.</p>
      </div>

      <div className="operation-overview" role="region" aria-label="Resumo da operação local">
        <div className="overview-heading">
          <span className="eyebrow">SEU DIA EM MOVIMENTO</span>
          <span className="overview-glow" aria-hidden="true">✦</span>
        </div>
        <strong className="overview-title">Sua operação, no seu ritmo.</strong>
        <p>Continue vendendo neste aparelho, mesmo quando a conexão falhar.</p>
        <div className="overview-metrics">
          <div><strong>{documents.length}</strong><span>Neste aparelho</span></div>
          <div><strong>{unsentCount}</strong><span>Pendentes</span></div>
          <div><strong>{sentCount}</strong><span>Enviados</span></div>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Filtros de pedidos">
        <button
          role="tab"
          aria-selected={tab === 'all'}
          className={tab === 'all' ? 'tab active' : 'tab'}
          onClick={() => setTab('all')}
        >
          TODOS
        </button>
        <button
          role="tab"
          aria-selected={tab === 'unsent'}
          className={tab === 'unsent' ? 'tab active' : 'tab'}
          onClick={() => setTab('unsent')}
        >
          NÃO ENVIADOS <span className="counter">{unsentCount}</span>
        </button>
      </div>

      <div className="document-list">
        {visible.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">▤</div>
            <strong>{tab === 'all' ? 'Nenhum documento neste aparelho' : 'Nenhum documento pendente'}</strong>
            <p>Toque no botão + para iniciar um novo orçamento.</p>
          </div>
        )}

        {visible.map(document => (
          <button
            className="document-card"
            key={document.id}
            onClick={() => onOpen(document.id)}
          >
            <div>
              <span className="status-pill">{statusLabel(document)}</span>
              <strong>{document.officialNumber ?? 'Documento local'}</strong>
              <span>{new Date(document.createdAt).toLocaleString('pt-BR')}</span>
            </div>
            <div className="document-value">
              <strong>{formatMoney(documentTotal(document))}</strong>
              <span className={document.state === 'sent' ? 'sent-label' : 'pending-label'}>
                {document.state === 'sent' ? 'Enviado' : 'Não enviado'}
              </span>
            </div>
          </button>
        ))}
      </div>

      <button className="fab" aria-label="Novo orçamento" onClick={onNew}>+</button>
    </section>
  );
}

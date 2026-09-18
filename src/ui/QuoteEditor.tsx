import { useEffect, useMemo, useState } from 'react';
import type { Customer, Product, SalesDocument } from '../domain/models';
import {
  canDeleteDocument,
  canEditDocument,
  convertQuoteToOrder,
  documentTotal,
  duplicateAsQuote,
  repriceAndValidateLocal
} from '../domain/rules';
import { getScopeCustomers, getScopeProducts } from '../infrastructure/db';
import { sendDocumentExplicitly } from '../services/transmit';
import { useRuntime } from '../app/AppContext';
import { CustomerList } from './Customers';
import { ProductCatalog } from './Products';

interface QuoteEditorProps {
  documentId: string;
  onBack: () => void;
  onOpenDocument: (id: string) => void;
}

function money(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseMoney(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function QuoteEditor({ documentId, onBack, onOpenDocument }: QuoteEditorProps) {
  const runtime = useRuntime();
  const [document, setDocument] = useState<SalesDocument | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [picker, setPicker] = useState<'customer' | 'catalog' | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const [doc, allCustomers, allProducts] = await Promise.all([
      runtime.db.documents.get([runtime.scopeKey, documentId]),
      getScopeCustomers(runtime.db, runtime.scopeKey),
      getScopeProducts(runtime.db, runtime.scopeKey)
    ]);
    if (!doc) {
      runtime.notify('Documento não encontrado neste aparelho.', 'error');
      onBack();
      return;
    }
    setDocument(doc);
    setCustomers(allCustomers);
    setProducts(allProducts);
  };

  useEffect(() => {
    reload();
  }, [documentId, runtime.revision]);

  const customer = useMemo(
    () => customers.find(item => item.id === document?.customerId),
    [customers, document?.customerId]
  );

  if (!document) {
    return <div className="loading-card">Carregando documento…</div>;
  }

  const editable = canEditDocument(document);
  const quantities = Object.fromEntries(document.items.map(item => [item.productId, item.quantity]));

  const persist = async (next: SalesDocument, message?: string) => {
    const normalized = repriceAndValidateLocal(
      next,
      products,
      runtime.context.allowSaleWithoutStock ?? false
    );
    await runtime.db.documents.put(normalized);
    setDocument(normalized);
    if (message) runtime.notify(message, 'success');
    await runtime.refreshLocal();
    return normalized;
  };

  const chooseCustomer = async (selected: Customer) => {
    if (!selected.active || !editable) return;
    await persist({ ...document, customerId: selected.id, updatedAt: new Date().toISOString() });
    setPicker(null);
  };

  const changeQuantity = async (product: Product, quantity: number) => {
    if (!editable) return;
    const items = document.items
      .filter(item => item.productId !== product.id)
      .concat(quantity > 0 ? [{ productId: product.id, quantity, unitPrice: product.price }] : []);
    const next = { ...document, items, updatedAt: new Date().toISOString() };
    setDocument(repriceAndValidateLocal(next, products, runtime.context.allowSaleWithoutStock ?? false));
  };

  const save = async () => {
    await persist(document, 'Documento salvo somente neste aparelho.');
  };

  const generateOrder = async () => {
    if (!editable || document.kind !== 'quote') return;
    if (!window.confirm('Gerar Pedido é definitivo. Este documento não poderá voltar a ser Orçamento. Continuar?')) return;
    const converted = convertQuoteToOrder(document);
    await persist(converted, 'Orçamento convertido em Pedido. Nada foi enviado ao servidor.');
  };

  const send = async () => {
    if (!runtime.online) {
      runtime.notify('Sem conexão. O documento permanece em NÃO ENVIADOS.', 'warning');
      return;
    }
    setBusy(true);
    try {
      await persist(document);
      const result = await sendDocumentExplicitly({
        db: runtime.db,
        gateway: runtime.gateway,
        context: runtime.gatewayContext,
        documentId: document.id,
        online: runtime.online
      });
      if (!result.ok) {
        runtime.notify('Falha no envio. O documento continua não enviado.', 'error');
        return;
      }
      setDocument(result.document);
      runtime.notify('Servidor confirmou o documento. Ele agora está bloqueado.', 'success');
      await runtime.refreshLocal();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!canDeleteDocument(document)) return;
    if (!window.confirm('Excluir este documento local? Esta ação não pode ser desfeita.')) return;
    await runtime.db.documents.delete([runtime.scopeKey, document.id]);
    runtime.notify('Documento local excluído.', 'success');
    await runtime.refreshLocal();
    onBack();
  };

  const duplicate = async () => {
    if (document.state !== 'sent') return;
    const sourceCustomer = document.customerId
      ? await runtime.db.customers.get([runtime.scopeKey, document.customerId])
      : undefined;
    const currentProducts = await getScopeProducts(runtime.db, runtime.scopeKey);
    const id = crypto.randomUUID();
    const copy = duplicateAsQuote(
      document,
      sourceCustomer,
      currentProducts,
      runtime.context.allowSaleWithoutStock ?? false,
      runtime.auth.user.id,
      new Date().toISOString(),
      id
    );
    await runtime.db.documents.put(copy);
    await runtime.refreshLocal();
    runtime.notify('Novo Orçamento criado a partir do documento enviado.', 'success');
    onOpenDocument(id);
  };

  const shareText = () => {
    const lines = [
      document.kind === 'quote' ? 'Orçamento Óris360°' : 'Pedido Óris360°',
      customer ? 'Cliente: ' + customer.name : 'Cliente: não selecionado',
      ...document.items.map(item => {
        const product = products.find(row => row.id === item.productId);
        return (product?.name ?? item.productId) + ' — ' + item.quantity + ' × ' + money(item.unitPrice);
      }),
      'Total: ' + money(documentTotal(document))
    ];
    return lines.join('\n');
  };

  const email = () => {
    const subject = encodeURIComponent(document.kind === 'quote' ? 'Orçamento Óris360°' : 'Pedido Óris360°');
    const body = encodeURIComponent(shareText());
    window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
  };

  const share = async () => {
    const text = shareText();
    if (navigator.share) {
      await navigator.share({ title: 'Óris360°', text });
      return;
    }
    await navigator.clipboard.writeText(text);
    runtime.notify('Resumo copiado para a área de transferência.', 'success');
  };

  const updateSupplemental = (field: keyof SalesDocument['supplemental'], value: string) => {
    if (!editable) return;
    const numericFields = new Set(['freight', 'discount', 'surcharge']);
    const parsed = numericFields.has(field) ? parseMoney(value) : (value || undefined);
    setDocument({
      ...document,
      supplemental: { ...document.supplemental, [field]: parsed },
      updatedAt: new Date().toISOString()
    });
  };

  if (picker === 'customer') {
    return (
      <section className="stack page-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">NOVO ORÇAMENTO</span>
            <h1>Selecionar cliente</h1>
          </div>
          <button className="text-button" onClick={() => setPicker(null)}>Voltar</button>
        </div>
        <CustomerList selectionMode onSelect={chooseCustomer} />
      </section>
    );
  }

  if (picker === 'catalog') {
    return (
      <section className="stack page-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LOJA VIRTUAL / CATÁLOGO</span>
            <h1>Adicionar produtos</h1>
          </div>
          <button className="button dark compact-button" onClick={async () => {
            await persist(document, 'Produtos atualizados no Orçamento.');
            setPicker(null);
          }}>VOLTAR AO ORÇAMENTO</button>
        </div>
        <div className="selected-customer-bar">
          <span>Cliente</span>
          <strong>{customer?.name}</strong>
        </div>
        <ProductCatalog selectionMode quantities={quantities} onQuantity={changeQuantity} />
      </section>
    );
  }

  return (
    <section className="stack page-section editor-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{document.kind === 'quote' ? 'ORÇAMENTO' : 'PEDIDO'}</span>
          <h1>{document.officialNumber ?? 'Documento local'}</h1>
        </div>
        <button className="text-button" onClick={onBack}>Voltar</button>
      </div>

      {document.state === 'sent' && (
        <div className="lock-banner">
          <strong>Documento bloqueado porque já está no Sistema Online.</strong>
          <span>Consulta permitida. Edição e exclusão estão desativadas neste App.</span>
        </div>
      )}

      <button
        className="selection-card"
        disabled={!editable}
        onClick={() => editable && setPicker('customer')}
      >
        <span className="eyebrow">CLIENTE</span>
        <strong>{customer?.name ?? 'Selecionar cliente'}</strong>
        <span>{customer?.taxId ?? 'Cliente deve ser selecionado antes dos produtos.'}</span>
      </button>

      <button
        className="button add-products"
        disabled={!editable || !customer?.active}
        onClick={() => setPicker('catalog')}
      >
        ADICIONAR PRODUTOS
      </button>

      <div className="items-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ITENS</span>
            <h2>{document.items.length} produto(s)</h2>
          </div>
          <strong>{money(documentTotal(document))}</strong>
        </div>
        {document.items.length === 0 && <p className="muted">Nenhum produto adicionado.</p>}
        {document.items.map(item => {
          const product = products.find(row => row.id === item.productId);
          return (
            <div className="line-item" key={item.productId}>
              <div>
                <strong>{product?.name ?? item.productId}</strong>
                <span>{item.quantity} × {money(item.unitPrice)}</span>
              </div>
              <strong>{money(item.quantity * item.unitPrice)}</strong>
            </div>
          );
        })}
      </div>

      <details className="details-card">
        <summary>Campos complementares <span>opcionais</span></summary>
        <div className="form-grid">
          <label className="field">
            <span>Forma de pagamento</span>
            <input className="input" disabled={!editable} value={document.supplemental.paymentMethod ?? ''} onChange={e => updateSupplemental('paymentMethod', e.target.value)} />
          </label>
          <label className="field">
            <span>Condição de pagamento</span>
            <input className="input" disabled={!editable} value={document.supplemental.paymentTerms ?? ''} onChange={e => updateSupplemental('paymentTerms', e.target.value)} />
          </label>
          <label className="field">
            <span>Frete</span>
            <input className="input" inputMode="decimal" disabled={!editable} value={document.supplemental.freight ?? ''} onChange={e => updateSupplemental('freight', e.target.value)} />
          </label>
          <label className="field">
            <span>Transportadora</span>
            <input className="input" disabled={!editable} value={document.supplemental.carrier ?? ''} onChange={e => updateSupplemental('carrier', e.target.value)} />
          </label>
          <label className="field">
            <span>Desconto</span>
            <input className="input" inputMode="decimal" disabled={!editable} value={document.supplemental.discount ?? ''} onChange={e => updateSupplemental('discount', e.target.value)} />
          </label>
          <label className="field">
            <span>Acréscimo</span>
            <input className="input" inputMode="decimal" disabled={!editable} value={document.supplemental.surcharge ?? ''} onChange={e => updateSupplemental('surcharge', e.target.value)} />
          </label>
          <label className="field full">
            <span>Observações</span>
            <textarea className="input textarea" disabled={!editable} value={document.supplemental.notes ?? ''} onChange={e => updateSupplemental('notes', e.target.value)} />
          </label>
          <label className="field full">
            <span>Informações adicionais</span>
            <textarea className="input textarea" disabled={!editable} value={document.supplemental.additionalInfo ?? ''} onChange={e => updateSupplemental('additionalInfo', e.target.value)} />
          </label>
        </div>
      </details>

      {editable && (
        <button className="button secondary" onClick={save}>SALVAR</button>
      )}

      <div className="action-stack">
        {editable && document.kind === 'quote' && (
          <button className="button primary" onClick={generateOrder}>GERAR PEDIDO</button>
        )}
        {editable && (
          <button className="button dark" disabled={busy || !customer?.active || document.items.length === 0} onClick={send}>
            {busy ? 'ENVIANDO…' : 'ENVIAR PARA O SISTEMA ONLINE'}
          </button>
        )}
        <button className="button secondary" onClick={email}>ENVIAR POR E-MAIL</button>
        <button className="button secondary" onClick={share}>COMPARTILHAR ORÇAMENTO</button>
      </div>

      {document.state === 'sent' && (
        <div className="action-stack">
          {runtime.context.onlineBaseUrl ? (
            <a className="button primary link-button" href={runtime.context.onlineBaseUrl} target="_blank" rel="noreferrer">
              VER NO SISTEMA ONLINE
            </a>
          ) : (
            <button className="button secondary" disabled>VER NO SISTEMA ONLINE — URL NÃO CONFIGURADA</button>
          )}
          <button className="button dark" onClick={duplicate}>DUPLICAR PEDIDO</button>
        </div>
      )}

      {editable && (
        <button className="danger-link" onClick={remove}>Excluir documento local</button>
      )}
    </section>
  );
}

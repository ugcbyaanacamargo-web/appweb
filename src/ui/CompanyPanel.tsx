import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import type { Product } from '../domain/models';
import { DemoOrisGateway } from '../infrastructure/demoOrisGateway';
import { integrationStorage, loadIntegrationConfig } from '../infrastructure/integrationConfig';
import { useRuntime } from '../app/AppContext';

interface ProductForm {
  id?: string;
  name: string;
  sku: string;
  price: string;
  stock: string;
  description: string;
  imageUrl?: string;
  active: boolean;
}

function emptyForm(): ProductForm {
  return { name: '', sku: '', price: '', stock: '', description: '', active: true };
}

function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      reject(new Error('Envie uma foto JPG, PNG ou WebP.'));
      return;
    }
    if (file.size > 200_000) {
      reject(new Error('No DEMO, a foto pode ter no máximo 200 KB para caber no armazenamento local.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a foto.'));
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('Não foi possível ler a foto.'));
    reader.readAsDataURL(file);
  });
}

export function CompanyPanel({ onBack }: { onBack: () => void }) {
  const runtime = useRuntime();
  const demo = loadIntegrationConfig(integrationStorage()).mode === 'demo';
  const permitted = runtime.company.role === 'owner' || runtime.company.role === 'admin';
  const gateway = useMemo(() => new DemoOrisGateway(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const reload = useCallback(async () => {
    if (!demo || !permitted) return;
    setError('');
    try {
      setProducts(await gateway.fetchCompanyProducts(runtime.gatewayContext));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Falha ao carregar produtos.');
    }
  }, [demo, permitted, runtime.scopeKey, gateway]);

  useEffect(() => { void reload(); }, [reload]);

  const save = async () => {
    if (!form || busy) return;
    setBusy(true);
    setFeedback('');
    setError('');
    try {
      await gateway.saveCompanyProduct(runtime.gatewayContext, {
        id: form.id, name: form.name, sku: form.sku,
        price: Number(form.price), stock: Number(form.stock),
        description: form.description, imageUrl: form.imageUrl, active: form.active
      });
      setForm(null);
      await reload();
      setFeedback('Produto salvo no painel DEMO. O App receberá as mudanças quando você tocar SINCRONIZAR.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Falha ao salvar produto.');
    } finally {
      setBusy(false);
    }
  };

  const onPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imageUrl = await readPhoto(file);
      setForm(current => current ? { ...current, imageUrl } : current);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Foto inválida.');
    }
  };

  return (
    <div className="web-panel">
      <header className="web-panel-header">
        <div className="brand-lockup"><div className="brand-mark">Ó</div><div><strong>Óris360°</strong><span>Sistema Online · Empresa</span></div></div>
        <button className="button secondary" onClick={onBack}>VOLTAR AO APP</button>
      </header>
      <main className="web-panel-content stack">
        <div className="hero-copy compact">
          <span className="eyebrow">SISTEMA ONLINE · {demo ? 'AMBIENTE DEMO' : 'INTEGRAÇÃO PENDENTE'}</span>
          <h1>Painel da empresa Óris360°</h1>
          <p>{runtime.company.name} · {runtime.auth.user.name}</p>
        </div>
        {!permitted ? (
          <div className="info-card error-card"><strong>Acesso administrativo não autorizado</strong><p>Seu perfil não permite cadastrar ou alterar produtos desta empresa.</p></div>
        ) : !runtime.online ? (
          <div className="offline-gate"><strong>Conexão necessária</strong><p>O Sistema Online não substitui as vendas offline do App.</p></div>
        ) : !demo ? (
          <div className="info-card warning-card">
            <strong>Administração de produção ainda indisponível</strong>
            <p>O backend próprio do Óris360° precisa oferecer autenticação e operações administrativas autorizadas. Nenhuma mudança será salva em um servidor inexistente.</p>
          </div>
        ) : (
          <>
            <div className="info-card">
              <strong>Cadastro comercial da empresa · DEMO</strong>
              <p>Produtos ficam persistidos somente neste navegador. O vendedor recebe alterações pela sincronização comercial manual; outros aparelhos não compartilham estes dados DEMO.</p>
              <button className="button primary" onClick={() => { setError(''); setFeedback(''); setForm(emptyForm()); }}>NOVO PRODUTO</button>
            </div>
            {form && (
              <section className="form-card stack" aria-label="Cadastro manual de produto">
                <h2>{form.id ? 'Editar produto' : 'Novo produto'}</h2>
                <label className="field"><span>Nome do produto</span><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label>
                <label className="field"><span>SKU do produto</span><input className="input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })}/></label>
                <div className="panel-form-grid">
                  <label className="field"><span>Preço unitário</span><input className="input" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}/></label>
                  <label className="field"><span>Estoque conhecido</span><input className="input" type="number" min="0" step="1" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}/></label>
                </div>
                <label className="field"><span>Descrição do produto</span><textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></label>
                <label className="field"><span>Foto do produto (JPG, PNG ou WebP; DEMO até 200 KB)</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => void onPhoto(event)}/></label>
                {form.imageUrl && <div className="panel-photo"><img src={form.imageUrl} alt={'Foto de ' + (form.name || 'produto')} /><button className="button secondary" onClick={() => setForm({ ...form, imageUrl: undefined })}>REMOVER FOTO</button></div>}
                <label className="panel-check"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}/> Produto ativo</label>
                <div className="panel-actions">
                  <button className="button primary" disabled={busy || !form.name.trim() || !form.sku.trim() || form.price === '' || form.stock === ''} onClick={() => void save()}>{busy ? 'SALVANDO…' : 'SALVAR PRODUTO'}</button>
                  <button className="button secondary" onClick={() => setForm(null)}>CANCELAR</button>
                </div>
              </section>
            )}
            {error && <div className="info-card error-card" role="alert">{error}</div>}
            {feedback && <div className="info-card" role="status">{feedback}</div>}
            <section className="stack" aria-label="Produtos cadastrados na empresa">
              <h2>Produtos cadastrados ({products.length})</h2>
              {products.length === 0 && <div className="empty-state"><strong>Nenhum produto cadastrado</strong><p>Use NOVO PRODUTO para cadastrar manualmente.</p></div>}
              {products.map(product => (
                <article className="list-card panel-product" key={product.id}>
                  {product.imageUrl ? <img src={product.imageUrl} alt={'Foto de ' + product.name}/> : <span className="product-art" aria-hidden="true">{product.name.slice(0, 1)}</span>}
                  <div className="product-copy"><strong>{product.name}</strong><small>{product.sku} · {product.stock} em estoque</small><span>{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · {product.active ? 'Ativo' : 'Inativo'}</span></div>
                  <button className="button secondary" onClick={() => { setError(''); setFeedback(''); setForm({
                    id: product.id, name: product.name, sku: product.sku, price: String(product.price),
                    stock: String(product.stock), description: product.description ?? '', imageUrl: product.imageUrl,
                    active: product.active
                  }); }}>EDITAR</button>
                </article>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

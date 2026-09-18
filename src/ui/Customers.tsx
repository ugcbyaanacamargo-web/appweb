import { useEffect, useMemo, useState } from 'react';
import type { Customer } from '../domain/models';
import { getScopeCustomers } from '../infrastructure/db';
import { useRuntime } from '../app/AppContext';

function normalizeTaxId(value: string): string {
  return value.replace(/\D/g, '');
}

interface CustomerListProps {
  selectionMode?: boolean;
  onSelect?: (customer: Customer) => void;
  showEditor?: boolean;
}

export function CustomerList({ selectionMode = false, onSelect, showEditor = true }: CustomerListProps) {
  const runtime = useRuntime();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');

  const reload = async () => {
    setCustomers((await getScopeCustomers(runtime.db, runtime.scopeKey)).sort((a, b) => a.name.localeCompare(b.name)));
  };

  useEffect(() => {
    reload();
  }, [runtime.scopeKey, runtime.revision]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(needle) ||
      normalizeTaxId(customer.taxId).includes(normalizeTaxId(needle))
    );
  }, [customers, query]);

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setName('');
    setTaxId('');
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setCreating(false);
    setName(customer.name);
    setTaxId(customer.taxId);
  };

  const save = async () => {
    const normalized = normalizeTaxId(taxId);
    if (!name.trim() || !normalized) {
      runtime.notify('Informe nome e CPF/CNPJ.', 'warning');
      return;
    }
    const duplicate = customers.find(customer =>
      customer.id !== editing?.id && normalizeTaxId(customer.taxId) === normalized
    );
    if (duplicate) {
      runtime.notify('Já existe um cliente local com este CPF/CNPJ.', 'warning');
      return;
    }

    const now = new Date().toISOString();
    const customer: Customer = editing
      ? { ...editing, name: name.trim(), taxId: taxId.trim(), pendingSync: true, updatedAt: now }
      : {
          id: crypto.randomUUID(),
          scopeKey: runtime.scopeKey,
          name: name.trim(),
          taxId: taxId.trim(),
          active: true,
          pendingSync: true,
          updatedAt: now
        };

    await runtime.db.customers.put(customer);
    setEditing(null);
    setCreating(false);
    runtime.notify('Cliente salvo neste aparelho.', 'success');
    await reload();
    await runtime.refreshLocal();
  };

  const editorOpen = creating || Boolean(editing);

  return (
    <div className="stack">
      <div className="search-row">
        <input
          className="input"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Buscar cliente ou CPF/CNPJ"
          aria-label="Buscar cliente"
        />
        {showEditor && (
          <button className="square-button" onClick={openCreate} aria-label="Novo cliente">+</button>
        )}
      </div>

      {editorOpen && (
        <div className="form-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{editing ? 'EDITAR CLIENTE' : 'NOVO CLIENTE OFFLINE'}</span>
              <h2>{editing ? editing.name : 'Cadastrar cliente'}</h2>
            </div>
            <button className="text-button" onClick={() => { setEditing(null); setCreating(false); }}>Cancelar</button>
          </div>
          <label className="field">
            <span>Nome</span>
            <input className="input" value={name} onChange={event => setName(event.target.value)} />
          </label>
          <label className="field">
            <span>CPF/CNPJ</span>
            <input className="input" inputMode="numeric" value={taxId} onChange={event => setTaxId(event.target.value)} />
          </label>
          <p className="field-note">O cliente fica disponível imediatamente para venda offline. A sincronização oficial ocorrerá quando permitido pela regra do fluxo.</p>
          <button className="button primary" onClick={save}>SALVAR CLIENTE</button>
        </div>
      )}

      <div className="list-cards">
        {filtered.map(customer => (
          <div className={customer.active ? 'list-card' : 'list-card inactive'} key={customer.id}>
            <button
              className="list-card-main"
              disabled={selectionMode && !customer.active}
              onClick={() => selectionMode ? customer.active && onSelect?.(customer) : openEdit(customer)}
            >
              <strong>{customer.name}</strong>
              <span>{customer.taxId}</span>
              <div className="inline-meta">
                <span>{customer.active ? 'Ativo' : 'Inativo'}</span>
                {customer.pendingSync && <span className="pending-label">Pendente</span>}
              </div>
            </button>
            {!selectionMode && showEditor && (
              <button className="ghost-mini" onClick={() => openEdit(customer)}>Editar</button>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state small">
            <strong>Nenhum cliente encontrado</strong>
            <p>Você pode cadastrar um cliente mesmo sem internet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function Customers() {
  return (
    <section className="stack page-section">
      <div className="hero-copy compact">
        <span className="eyebrow">BASE LOCAL</span>
        <h1>Clientes</h1>
        <p>Consulte, cadastre e edite clientes mesmo offline.</p>
      </div>
      <CustomerList />
    </section>
  );
}

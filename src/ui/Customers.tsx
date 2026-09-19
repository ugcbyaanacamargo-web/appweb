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
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  const fieldDefinitions = runtime.context.customerFields ?? [];

  const reload = async () => {
    setCustomers((await getScopeCustomers(runtime.db, runtime.scopeKey)).sort((a, b) => a.name.localeCompare(b.name)));
  };

  useEffect(() => {
    reload();
  }, [runtime.scopeKey, runtime.revision]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return customers;
    const normalizedNeedle = normalizeTaxId(needle);
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(needle) ||
      normalizeTaxId(customer.taxId).includes(normalizedNeedle) ||
      Object.values(customer.extraFields ?? {}).some(value => value.toLowerCase().includes(needle))
    );
  }, [customers, query]);

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setName('');
    setTaxId('');
    setExtraFields({});
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setCreating(false);
    setName(customer.name);
    setTaxId(customer.taxId);
    setExtraFields({ ...(customer.extraFields ?? {}) });
  };

  const save = async () => {
    const normalized = normalizeTaxId(taxId);
    if (!name.trim() || !normalized) {
      runtime.notify('Informe nome e CPF/CNPJ.', 'warning');
      return;
    }

    const missingRequired = fieldDefinitions.find(field => field.required && !extraFields[field.key]?.trim());
    if (missingRequired) {
      runtime.notify('Preencha o campo obrigatório: ' + missingRequired.label + '.', 'warning');
      return;
    }

    const duplicate = customers.find(customer =>
      customer.id !== editing?.id && normalizeTaxId(customer.taxId) === normalized
    );
    if (duplicate) {
      runtime.notify('Já existe um cliente local com este CPF/CNPJ.', 'warning');
      return;
    }

    const allowedExtraFields = fieldDefinitions.length
      ? Object.fromEntries(fieldDefinitions.map(field => [
          field.key,
          (extraFields[field.key] ?? '').trim().slice(0, field.maxLength ?? Number.MAX_SAFE_INTEGER)
        ]))
      : editing?.extraFields;

    const now = new Date().toISOString();
    const customer: Customer = editing
      ? {
          ...editing,
          name: name.trim(),
          taxId: taxId.trim(),
          extraFields: allowedExtraFields,
          pendingSync: true,
          updatedAt: now
        }
      : {
          id: crypto.randomUUID(),
          scopeKey: runtime.scopeKey,
          name: name.trim(),
          taxId: taxId.trim(),
          extraFields: allowedExtraFields,
          active: true,
          pendingSync: true,
          updatedAt: now
        };

    await runtime.db.customers.put(customer);
    setEditing(null);
    setCreating(false);
    setExtraFields({});
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

          <div className="form-grid">
            <label className="field">
              <span>Nome</span>
              <input className="input" value={name} onChange={event => setName(event.target.value)} />
            </label>
            <label className="field">
              <span>CPF/CNPJ</span>
              <input className="input" inputMode="numeric" value={taxId} onChange={event => setTaxId(event.target.value)} />
            </label>

            {fieldDefinitions.map(field => (
              <label className="field" key={field.key}>
                <span>{field.label}{field.required ? ' *' : ''}</span>
                <input
                  className="input"
                  aria-label={field.label}
                  type={field.type}
                  required={field.required}
                  maxLength={field.type === 'number' ? undefined : field.maxLength}
                  value={extraFields[field.key] ?? ''}
                  onChange={event => setExtraFields(current => ({ ...current, [field.key]: event.target.value }))}
                />
              </label>
            ))}
          </div>

          <p className="field-note">
            Nome e CPF/CNPJ são a base fixa. Os demais campos são definidos centralmente pelo backend e ficam disponíveis offline depois da sincronização.
          </p>
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

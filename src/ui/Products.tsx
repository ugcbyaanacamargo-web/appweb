import { useEffect, useMemo, useState } from 'react';
import type { Product } from '../domain/models';
import { getScopeProducts } from '../infrastructure/db';
import { useRuntime } from '../app/AppContext';

function money(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface ProductCatalogProps {
  selectionMode?: boolean;
  quantities?: Record<string, number>;
  onQuantity?: (product: Product, quantity: number) => void;
}

export function ProductCatalog({ selectionMode = false, quantities = {}, onQuantity }: ProductCatalogProps) {
  const runtime = useRuntime();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getScopeProducts(runtime.db, runtime.scopeKey).then(rows => {
      setProducts(rows.filter(product => product.active).sort((a, b) => a.name.localeCompare(b.name)));
    });
  }, [runtime.scopeKey, runtime.revision]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter(product =>
      product.name.toLowerCase().includes(needle) ||
      product.sku.toLowerCase().includes(needle)
    );
  }, [products, query]);

  return (
    <div className="stack">
      <input
        className="input"
        placeholder="Buscar produto ou SKU"
        value={query}
        onChange={event => setQuery(event.target.value)}
        aria-label="Buscar produto"
      />

      <div className="product-grid">
        {filtered.map(product => {
          const quantity = quantities[product.id] ?? 0;
          return (
            <article className="product-card" key={product.id}>
              <div className="product-art">{product.imageUrl
                ? <img src={product.imageUrl} alt={'Foto de ' + product.name} loading="lazy" className="catalog-product-photo" />
                : <span aria-hidden="true">{product.name.slice(0, 1).toUpperCase()}</span>}
              </div>
              <div className="product-copy">
                <span className="eyebrow">{product.sku}</span>
                <strong>{product.name}</strong>
                <span className="price">{money(product.price)}</span>
                <span className="stock">Estoque conhecido: {product.stock}</span>
              </div>
              {selectionMode && (
                <div className="quantity-control" aria-label={'Quantidade de ' + product.name}>
                  <button onClick={() => onQuantity?.(product, Math.max(0, quantity - 1))}>−</button>
                  <strong>{quantity}</strong>
                  <button onClick={() => onQuantity?.(product, quantity + 1)}>+</button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state small">
          <strong>Nenhum produto ativo encontrado</strong>
          <p>Produtos são administrados exclusivamente no Sistema Online.</p>
        </div>
      )}
    </div>
  );
}

export function Products() {
  return (
    <section className="stack page-section">
      <div className="hero-copy compact">
        <span className="eyebrow">CATÁLOGO OFFLINE</span>
        <h1>Produtos</h1>
        <p>Preço e estoque correspondem à última sincronização válida.</p>
      </div>
      <ProductCatalog />
    </section>
  );
}

import type { ReactNode } from 'react';
import { MAIN_MENU, type MainPage } from './menu';

interface ShellProps {
  page: MainPage | 'editor';
  menuOpen: boolean;
  setMenuOpen: (value: boolean) => void;
  title: string;
  userName: string;
  companyName: string;
  lastSync?: string;
  online: boolean;
  onNavigate: (page: MainPage) => void;
  onSync: () => void;
  onSwitchCompany: () => void;
  onLogout: () => void;
  children: ReactNode;
}

function formatSync(value?: string): string {
  if (!value) return 'Ainda não sincronizado';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function Shell(props: ShellProps) {
  const {
    page,
    menuOpen,
    setMenuOpen,
    title,
    userName,
    companyName,
    lastSync,
    online,
    onNavigate,
    onSync,
    onSwitchCompany,
    onLogout,
    children
  } = props;

  const handleItem = (key: (typeof MAIN_MENU)[number]['key']) => {
    if (key === 'sync') {
      setMenuOpen(false);
      onSync();
      return;
    }
    if (key === 'logout') {
      setMenuOpen(false);
      onLogout();
      return;
    }
    setMenuOpen(false);
    onNavigate(key);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
          <span className="hamburger" aria-hidden="true">☰</span>
        </button>
        <div className="topbar-title">
          <strong>{title}</strong>
          <span className={online ? 'network online' : 'network offline'}>
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="brand-mark small" aria-label="Óris360°">Ó</div>
      </header>

      <main className="page-content">{children}</main>

      {menuOpen && (
        <>
          <button
            className="drawer-backdrop"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="drawer" aria-label="Menu principal">
            <div className="drawer-brand">
              <div className="brand-mark">Ó</div>
              <div>
                <strong>Óris360°</strong>
                <span>Vendas Mobile</span>
              </div>
            </div>

            <div className="identity-card">
              <span className="eyebrow">USUÁRIO</span>
              <strong>{userName}</strong>
              <span>{companyName}</span>
              <button className="text-button" onClick={onSwitchCompany}>Trocar empresa</button>
            </div>

            <nav className="drawer-nav">
              {MAIN_MENU.map(item => {
                const active = page !== 'editor' && item.key === page;
                return (
                  <button
                    key={item.key}
                    className={active ? 'drawer-item active' : 'drawer-item'}
                    onClick={() => handleItem(item.key)}
                  >
                    <span className="menu-glyph" aria-hidden="true">{item.glyph}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="sync-footnote">
              <span className="eyebrow">ÚLTIMA SINCRONIZAÇÃO CONCLUÍDA</span>
              <strong>{formatSync(lastSync)}</strong>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

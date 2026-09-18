export type MainPage =
  | 'orders'
  | 'customers'
  | 'products'
  | 'missions'
  | 'whatsapp'
  | 'reports'
  | 'online'
  | 'help';

export interface MenuItem {
  key: MainPage | 'sync' | 'logout';
  label: string;
  glyph: string;
}

export const MAIN_MENU: readonly MenuItem[] = Object.freeze([
  { key: 'orders', label: 'Pedidos', glyph: '▤' },
  { key: 'customers', label: 'Clientes', glyph: '◎' },
  { key: 'products', label: 'Produtos', glyph: '◇' },
  { key: 'missions', label: 'Tarefas / Missões', glyph: '✓' },
  { key: 'whatsapp', label: 'IA no WhatsApp', glyph: '✦' },
  { key: 'reports', label: 'Relatórios e Comissões', glyph: '↗' },
  { key: 'online', label: 'Sistema Online', glyph: '↗' },
  { key: 'help', label: 'Ajuda', glyph: '?' },
  { key: 'sync', label: 'Sincronizar', glyph: '↻' },
  { key: 'logout', label: 'Sair da minha conta', glyph: '⎋' }
]);

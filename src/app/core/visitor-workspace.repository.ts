import type { WidgetPageDefinition } from '@praxisui/core';

export interface VisitorSavedPage {
  id: string;
  title: string;
  definition: WidgetPageDefinition;
  createdAt: string;
}

export interface VisitorMenu {
  id: string;
  label: string;
  items: { pageId: string; label: string; icon?: string }[];
}

export interface VisitorWorkspace {
  version: 1;
  pages: VisitorSavedPage[];
  menus: VisitorMenu[];
}

export type VisitorWorkspaceErrorCode = 'invalid' | 'storage' | 'conflict' | 'limit' | 'corrupt';

export class VisitorWorkspaceError extends Error {
  constructor(readonly code: VisitorWorkspaceErrorCode, message: string) {
    super(message);
    this.name = 'VisitorWorkspaceError';
  }
}

const MAX_PAGES = 30;
const MAX_MENUS = 20;
const MAX_BYTES = 2 * 1024 * 1024;
const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// The host shell renders Material Symbol names, not arbitrary URLs or markup.
function menuIcon(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9_]{0,63}$/.test(value)) {
    fail('invalid', 'Ícone de menu inválido.');
  }
  return value;
}

type ExclusiveLock = <T>(name: string, action: () => Promise<T>) => Promise<T>;
type RecordValue = Record<string, unknown>;

function fail(code: VisitorWorkspaceErrorCode, message: string): never {
  throw new VisitorWorkspaceError(code, message);
}

function isRecord(value: unknown): value is RecordValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function identifier(value: unknown): string {
  if (typeof value !== 'string' || !UUID4.test(value)) {
    fail('invalid', 'Identificador de página ou menu inválido.');
  }
  return value;
}

function label(value: unknown, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    fail('invalid', `Informe um nome entre 1 e ${max} caracteres.`);
  }
  return value.trim();
}

// Exact normalized menu identity only; this does not resolve or route user intent.
function menuIdentity(value: string): string {
  return value.normalize('NFKC');
}

function exactKeys(value: RecordValue, keys: string[]): void {
  if (Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) {
    fail('invalid', 'Estrutura do laboratório inválida.');
  }
}

function documentJson(value: unknown): string {
  // Optional object properties emitted as undefined by the canonical editors are absent in JSON.
  // Reject every other non-JSON value, including undefined/sparse array entries.
  const seen = new Set<object>();
  const visit = (item: unknown): unknown => {
    if (item === null || typeof item === 'string' || typeof item === 'boolean') return item;
    if (typeof item === 'number' && Number.isFinite(item)) return item;
    if (typeof item !== 'object' || item === null || seen.has(item)) {
      fail('invalid', 'A página precisa ser um documento JSON válido.');
    }
    if (!Array.isArray(item) && Object.getPrototypeOf(item) !== Object.prototype && Object.getPrototypeOf(item) !== null) {
      fail('invalid', 'A página precisa ser um documento JSON válido.');
    }
    seen.add(item);
    const result: unknown = Array.isArray(item)
      ? Array.from({ length: item.length }, (_, index) => {
          if (!Object.hasOwn(item, index)) fail('invalid', 'A página precisa ser um documento JSON válido.');
          return visit(item[index]);
        })
      : Object.fromEntries(Object.keys(item).sort().filter(key => (item as RecordValue)[key] !== undefined).map(key => [key, visit((item as RecordValue)[key])]));
    seen.delete(item);
    return result;
  };
  try {
    return JSON.stringify(visit(value));
  } catch (error) {
    if (error instanceof VisitorWorkspaceError) throw error;
    return fail('invalid', 'Não foi possível preparar o documento da página.');
  }
}

export function visitorWorkspaceKey(owner: string): string {
  if (typeof owner !== 'string' || !owner.trim() || owner.length > 512) {
    fail('invalid', 'Identidade local inválida.');
  }
  try {
    return `hero-hq:visitor-lab:v1:${encodeURIComponent(owner)}`;
  } catch {
    return fail('invalid', 'Identidade local inválida.');
  }
}

export function visitorPagePath(id: string): string {
  return `/laboratorio/paginas/${identifier(id)}`;
}

/** Browser-local host state. The caller supplies Core validation and a cross-tab exclusive lock. */
export class VisitorWorkspaceRepository {
  constructor(
    private readonly storage: Pick<Storage, 'getItem' | 'setItem'>,
    private readonly lock: ExclusiveLock,
    private readonly validatePage: (page: WidgetPageDefinition) => void,
  ) {}

  read(owner: string): VisitorWorkspace {
    const key = visitorWorkspaceKey(owner);
    let raw: string | null;
    try {
      raw = this.storage.getItem(key);
    } catch {
      return fail('storage', 'Não foi possível ler o laboratório deste navegador.');
    }
    if (raw === null) return { version: 1, pages: [], menus: [] };
    try {
      if (raw.length * 2 > MAX_BYTES) fail('limit', 'O laboratório excede o limite de 2 MiB.');
      const parsed: unknown = JSON.parse(raw);
      this.assertWorkspace(parsed);
      return parsed;
    } catch {
      return fail('corrupt', 'Os dados do laboratório deste navegador estão inválidos.');
    }
  }

  async savePage(owner: string, input: {
    id: string;
    title: string;
    definition: WidgetPageDefinition;
    menuLabel: string;
    menuIcon?: string;
  }): Promise<VisitorWorkspace> {
    const id = identifier(input.id);
    const title = label(input.title, 80);
    const menuLabel = label(input.menuLabel, 60);
    const icon = menuIcon(input.menuIcon ?? 'web');
    // Snapshot before waiting: later editor changes must not change this save request.
    const definitionJson = documentJson(input.definition);
    const definition: unknown = JSON.parse(definitionJson);
    this.assertPage(definition);
    return this.change(owner, workspace => {
      const existing = workspace.pages.find(page => page.id === id);
      if (existing && (existing.title !== title || documentJson(existing.definition) !== definitionJson)) {
        fail('conflict', 'Esta identificação já pertence a outra versão da página.');
      }
      if (!existing) {
        workspace.pages.push({ id, title, definition, createdAt: new Date().toISOString() });
      }
      let menu = workspace.menus.find(candidate => menuIdentity(candidate.label) === menuIdentity(menuLabel));
      if (!menu) {
        menu = { id: crypto.randomUUID(), label: menuLabel, items: [] };
        workspace.menus.push(menu);
      }
      const item = menu.items.find(item => item.pageId === id);
      if (item) item.icon = icon;
      else menu.items.push({ pageId: id, label: title, icon });
    });
  }

  async renamePage(owner: string, pageId: string, name: string): Promise<VisitorWorkspace> {
    const id = identifier(pageId);
    const next = label(name, 80);
    return this.change(owner, workspace => {
      const page = workspace.pages.find(candidate => candidate.id === id);
      if (!page) fail('invalid', 'Página salva não encontrada.');
      const previous = page.title;
      page.title = next;
      for (const menu of workspace.menus) {
        for (const item of menu.items) {
          if (item.pageId === id && item.label === previous) item.label = next;
        }
      }
    });
  }

  async migrate(owner: string): Promise<VisitorWorkspace> {
    return this.change(owner, workspace => {
      for (const menu of workspace.menus) {
        for (const item of menu.items) {
          if (item.icon === undefined) item.icon = 'web';
        }
      }
    });
  }

  async renameMenu(owner: string, menuId: string, name: string): Promise<VisitorWorkspace> {
    const id = identifier(menuId);
    const next = label(name, 60);
    return this.change(owner, workspace => {
      const menu = this.findMenu(workspace, id);
      if (workspace.menus.some(other => other.id !== id && menuIdentity(other.label) === menuIdentity(next))) {
        fail('conflict', 'Já existe um menu com este nome.');
      }
      menu.label = next;
    });
  }

  async removeMenu(owner: string, menuId: string): Promise<VisitorWorkspace> {
    const id = identifier(menuId);
    return this.change(owner, workspace => {
      workspace.menus = workspace.menus.filter(menu => menu.id !== id);
    });
  }

  async linkPage(owner: string, pageId: string, menuId: string, name: string): Promise<VisitorWorkspace> {
    const page = identifier(pageId);
    const menu = identifier(menuId);
    const next = label(name, 60);
    return this.change(owner, workspace => {
      if (!workspace.pages.some(candidate => candidate.id === page)) fail('invalid', 'Página salva não encontrada.');
      const target = this.findMenu(workspace, menu);
      const item = target.items.find(candidate => candidate.pageId === page);
      if (item) item.label = next;
      else target.items.push({ pageId: page, label: next });
    });
  }

  async removePage(owner: string, pageId: string): Promise<VisitorWorkspace> {
    const id = identifier(pageId);
    return this.change(owner, workspace => {
      workspace.pages = workspace.pages.filter(page => page.id !== id);
      for (const menu of workspace.menus) menu.items = menu.items.filter(item => item.pageId !== id);
    });
  }

  private findMenu(workspace: VisitorWorkspace, id: string): VisitorMenu {
    const menu = workspace.menus.find(candidate => candidate.id === id);
    if (!menu) fail('invalid', 'Menu não encontrado.');
    return menu;
  }

  private async change(owner: string, update: (workspace: VisitorWorkspace) => void): Promise<VisitorWorkspace> {
    const key = visitorWorkspaceKey(owner);
    try {
      return await this.lock(key, async () => {
        const workspace = this.read(owner);
        const previous = JSON.stringify(workspace);
        update(workspace);
        this.assertWorkspace(workspace);
        const next = JSON.stringify(workspace);
        if (next.length * 2 > MAX_BYTES) fail('limit', 'O laboratório atingiu o limite de 2 MiB.');
        if (next !== previous) {
          try {
            this.storage.setItem(key, next);
          } catch {
            fail('storage', 'Não foi possível salvar o laboratório neste navegador.');
          }
        }
        return workspace;
      });
    } catch (error) {
      if (error instanceof VisitorWorkspaceError) throw error;
      return fail('storage', 'Não foi possível acessar o laboratório neste navegador.');
    }
  }

  private assertPage(value: unknown): asserts value is WidgetPageDefinition {
    if (!isRecord(value)) fail('invalid', 'Documento de página inválido.');
    try {
      this.validatePage(value as unknown as WidgetPageDefinition);
    } catch {
      fail('invalid', 'Documento de página inválido.');
    }
  }

  private assertWorkspace(value: unknown): asserts value is VisitorWorkspace {
    if (!isRecord(value)) fail('invalid', 'Estrutura do laboratório inválida.');
    exactKeys(value, ['version', 'pages', 'menus']);
    if (value['version'] !== 1 || !Array.isArray(value['pages']) || !Array.isArray(value['menus'])) {
      fail('invalid', 'Versão ou estrutura do laboratório inválida.');
    }
    const pages: unknown[] = value['pages'];
    const menus: unknown[] = value['menus'];
    if (pages.length > MAX_PAGES || menus.length > MAX_MENUS) {
      fail('limit', 'O laboratório permite até 30 páginas e 20 menus.');
    }
    const pageIds = new Set<string>();
    for (const page of pages) {
      if (!isRecord(page)) fail('invalid', 'Página salva inválida.');
      exactKeys(page, ['id', 'title', 'definition', 'createdAt']);
      const id = identifier(page['id']);
      if (pageIds.has(id) || label(page['title'], 80) !== page['title']) fail('invalid', 'Página salva inválida.');
      pageIds.add(id);
      const date = page['createdAt'];
      if (typeof date !== 'string' || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString() !== date) {
        fail('invalid', 'Data da página salva inválida.');
      }
      this.assertPage(page['definition']);
    }
    const menuIds = new Set<string>();
    const menuLabels = new Set<string>();
    for (const menu of menus) {
      if (!isRecord(menu)) fail('invalid', 'Menu inválido.');
      exactKeys(menu, ['id', 'label', 'items']);
      const id = identifier(menu['id']);
      const name = label(menu['label'], 60);
      const identity = menuIdentity(name);
      if (menuIds.has(id) || menuLabels.has(identity) || name !== menu['label'] || !Array.isArray(menu['items'])) {
        fail('invalid', 'Menu inválido.');
      }
      menuIds.add(id);
      menuLabels.add(identity);
      const references = new Set<string>();
      for (const item of menu['items'] as unknown[]) {
        if (!isRecord(item)) fail('invalid', 'Referência de página inválida.');
        exactKeys(item, Object.hasOwn(item, 'icon') ? ['pageId', 'label', 'icon'] : ['pageId', 'label']);
        if (Object.hasOwn(item, 'icon')) menuIcon(item['icon']);
        const pageId = identifier(item['pageId']);
        if (!pageIds.has(pageId) || references.has(pageId) || label(item['label'], 80) !== item['label']) {
          fail('invalid', 'Referência de página inválida.');
        }
        references.add(pageId);
      }
    }
  }
}

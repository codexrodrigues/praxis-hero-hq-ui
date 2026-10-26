import type { EnterpriseRuntimeNavigationNode, PageAuthoringDocument, UiLayoutTarget } from '@praxisui/core';

/** Exact reference-host registration; identifiers select content, never grant access. */
export const CORPORATE_GROUPS_TARGET: UiLayoutTarget = { componentType: 'praxis-app-shell', componentId: 'b9debe04-41ba-498b-86aa-cb30a464fb82' };

export const CORPORATE_ALLOWED_ICONS = [
  'home', 'dashboard', 'description', 'article', 'assignment', 'folder', 'work', 'business',
  'people', 'group', 'badge', 'analytics', 'insights', 'assessment', 'table_chart',
  'view_quilt', 'grid_view', 'list_alt', 'fact_check', 'rule', 'verified_user', 'security',
  'shield', 'admin_panel_settings', 'settings', 'tune', 'build', 'bolt', 'auto_awesome',
  'rocket_launch', 'hub', 'account_tree', 'layers', 'inventory_2', 'receipt_long',
] as const;

export type CorporateIcon = (typeof CORPORATE_ALLOWED_ICONS)[number];

export function isCorporateIcon(value: unknown): value is CorporateIcon {
  return typeof value === 'string' && (CORPORATE_ALLOWED_ICONS as readonly string[]).includes(value);
}

export interface CorporateGroup { id: string; label: string; icon: CorporateIcon; order: number; }
export interface CorporateGroupsDocument { kind: 'praxis.navigation-groups.editor'; version: 1; config: { groups: CorporateGroup[] }; }

export interface CorporateShellGroupProjection {
  id: string;
  label: string;
  icon: CorporateIcon;
  items: ReadonlyArray<{ id: string; label: string; icon: CorporateIcon; path: string }>;
}

type ShellProjectionListener = (groups: ReadonlyArray<CorporateShellGroupProjection>) => void;
let currentShellProjection: ReadonlyArray<CorporateShellGroupProjection> = [];
const shellProjectionListeners = new Set<ShellProjectionListener>();

export function readCorporateShellProjection(): ReadonlyArray<CorporateShellGroupProjection> {
  return currentShellProjection;
}

export function publishCorporateShellProjection(groups: ReadonlyArray<CorporateShellGroupProjection>): void {
  currentShellProjection = groups;
  for (const listener of shellProjectionListeners) listener(currentShellProjection);
}

export function subscribeCorporateShellProjection(listener: ShellProjectionListener): () => void {
  shellProjectionListeners.add(listener);
  listener(currentShellProjection);
  return () => shellProjectionListeners.delete(listener);
}

const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
const label = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 160 && value === value.trim() && !/[\u0000-\u001f\u007f\u2028\u2029]/.test(value);
const order = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 2147483647;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const keys = (value: Record<string, unknown>, expected: string[]) => Object.keys(value).sort().join('|') === expected.sort().join('|');

/** Private projection of Config's existing closed groupsDocument schema and host icon policy. */
export function corporateGroupsDocument(value: unknown): CorporateGroupsDocument {
  if (!object(value) || !keys(value, ['kind', 'version', 'config']) || value['kind'] !== 'praxis.navigation-groups.editor'
      || value['version'] !== 1 || !object(value['config']) || !keys(value['config'], ['groups']) || !Array.isArray(value['config']['groups'])) throw new Error('GROUPS_CONTRACT');
  const ids = new Set<string>();
  for (const group of value['config']['groups']) {
    if (!object(group) || !keys(group, ['id', 'label', 'icon', 'order']) || !uuid(group['id']) || ids.has(group['id'])
        || !label(group['label']) || !isCorporateIcon(group['icon']) || !order(group['order'])) throw new Error('GROUPS_CONTRACT');
    ids.add(group['id']);
  }
  return structuredClone(value) as unknown as CorporateGroupsDocument;
}

export function firstCorporateGroup(
  document: CorporateGroupsDocument,
  id: string,
  name: string,
  position: number,
  icon: CorporateIcon = 'home',
): CorporateGroupsDocument {
  const result = corporateGroupsDocument(document);
  // First-aggregate helper; use upsertCorporateGroup when authoring multiple groups in a draft.
  if (result.config.groups.length > 1 || result.config.groups.length === 1 && result.config.groups[0].id !== id) throw new Error('GROUPS_SCOPE');
  result.config.groups = [{ id, label: name.trim(), icon, order: position }];
  return corporateGroupsDocument(result);
}

export function upsertCorporateGroup(
  document: CorporateGroupsDocument,
  id: string,
  name: string,
  position: number,
  icon: CorporateIcon = 'home',
): CorporateGroupsDocument {
  const result = corporateGroupsDocument(document);
  const entry: CorporateGroup = { id, label: name.trim(), icon, order: position };
  const index = result.config.groups.findIndex(item => item.id === id);
  if (index < 0) result.config.groups.push(entry); else result.config.groups[index] = entry;
  return corporateGroupsDocument(result);
}

export function bindCorporatePage(
  document: PageAuthoringDocument,
  bindingId: string,
  groupId: string,
  name: string,
  position: number,
  icon?: CorporateIcon,
): PageAuthoringDocument {
  const existing = document.config.navigation.find(item => item.id === bindingId);
  const resolvedIcon: CorporateIcon = icon ?? (isCorporateIcon(existing?.icon) ? existing.icon : 'home');
  if (!uuid(bindingId) || !uuid(groupId) || !label(name.trim()) || !order(position) || !isCorporateIcon(resolvedIcon)) throw new Error('BINDING_CONTRACT');
  const result = structuredClone(document);
  const binding = { id: bindingId, groupId, label: name.trim(), icon: resolvedIcon, order: position };
  const index = result.config.navigation.findIndex(item => item.id === bindingId);
  if (index < 0) result.config.navigation.push(binding); else result.config.navigation[index] = binding;
  return result;
}

export function unbindCorporatePage(
  document: PageAuthoringDocument,
  bindingId: string,
): PageAuthoringDocument {
  if (!uuid(bindingId) || !document.config.navigation.some(item => item.id === bindingId)) throw new Error('BINDING_CONTRACT');
  const result = structuredClone(document);
  result.config.navigation = result.config.navigation.filter(item => item.id !== bindingId);
  return result;
}

/** Only the installed reference host's admitted routes/icons enter this corporate shell. */
export function corporateMenuNodes(nodes: EnterpriseRuntimeNavigationNode[], parent: string | null): EnterpriseRuntimeNavigationNode[] {
  if (!Array.isArray(nodes)) throw new Error('MENU_CONTRACT');
  const ids = new Set<string>();
  for (const node of nodes) {
    if (!node || typeof node.id !== 'string' || ids.has(node.id) || !label(node.label) || !isCorporateIcon(node.icon) || node.href) throw new Error('MENU_CONTRACT');
    ids.add(node.id);
    if (parent === null) {
      if (node.type !== 'group' || !uuid(node.id) || node.route || node.children !== null) throw new Error('MENU_CONTRACT');
    } else {
      const parts = node.id.split(':');
      if (node.type !== 'page' || parts.length !== 2 || !parts.every(uuid) || node.route !== `/pages/${parts[0]}`
          || !Array.isArray(node.children) || node.children.length) throw new Error('MENU_CONTRACT');
    }
  }
  return structuredClone(nodes);
}

import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  ComponentMetadataRegistry, CompositionValidatorService, WidgetPageCompositionFactory,
  type WidgetPageDefinition,
} from '@praxisui/core';
import { AuthSimulationService } from './auth-simulation.service';
import {
  VisitorWorkspaceRepository, VisitorWorkspaceError, visitorWorkspaceKey,
  type VisitorWorkspace, type VisitorSavedPage,
} from './visitor-workspace.repository';

@Injectable({ providedIn: 'root' })
export class VisitorWorkspaceService {
  private readonly auth = inject(AuthSimulationService);
  private readonly registry = inject(ComponentMetadataRegistry);
  private readonly validator = new CompositionValidatorService();
  readonly revision = this.auth.identityRevision.asReadonly();
  readonly owner = computed(() => JSON.stringify([this.auth.currentPersona().tenant, this.auth.currentPersona().id]));
  private readonly state = signal<VisitorWorkspace>({ version: 1, pages: [], menus: [] });
  private readonly loadedOwner = signal('');
  readonly ready = computed(() => this.loadedOwner() === this.owner());
  readonly workspace = computed<VisitorWorkspace>(() => this.ready() ? this.state() : { version: 1, pages: [], menus: [] });
  readonly error = signal('');
  private readonly repository = new VisitorWorkspaceRepository(
    { getItem: (key) => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) },
    async (key, action) => {
      if (!navigator.locks) throw new VisitorWorkspaceError('storage', 'Visitor workspace storage');
      const revision = this.revision();
      return navigator.locks.request(key, async () => {
        if (revision !== this.revision() || key !== visitorWorkspaceKey(this.owner())) throw new VisitorWorkspaceError('conflict', 'Visitor workspace conflict');
        return action();
      });
    },
    (page) => this.validatePage(page),
  );

  constructor() {
    this.reload();
    effect(() => { this.owner(); this.revision(); this.reload(); });
    window.addEventListener('storage', (event) => {
      if (event.key === null || event.key === visitorWorkspaceKey(this.owner())) this.reload();
    });
  }

  reload(): void {
    try { this.state.set(this.repository.read(this.owner())); this.error.set(''); }
    catch (error: unknown) { this.state.set({ version: 1, pages: [], menus: [] }); this.error.set(this.errorCode(error)); }
    this.loadedOwner.set(this.owner());
  }

  page(id: string): VisitorSavedPage | undefined { return this.workspace().pages.find((page) => page.id === id); }

  async save(input: { id: string; title: string; definition: WidgetPageDefinition; menuLabel: string; menuIcon?: string }): Promise<void> {
    await this.mutate((owner) => this.repository.savePage(owner, input));
  }
  async renameMenu(id: string, label: string): Promise<void> {
    await this.mutate((owner) => this.repository.renameMenu(owner, id, label));
  }
  async removeMenu(id: string): Promise<void> {
    await this.mutate((owner) => this.repository.removeMenu(owner, id));
  }
  async removePage(id: string): Promise<void> {
    await this.mutate((owner) => this.repository.removePage(owner, id));
  }
  async linkPage(pageId: string, menuId: string, label: string): Promise<void> {
    await this.mutate((owner) => this.repository.linkPage(owner, pageId, menuId, label));
  }

  errorCode(error: unknown): string { return error instanceof VisitorWorkspaceError ? error.code : 'storage'; }

  private async mutate(action: (owner: string) => Promise<VisitorWorkspace>): Promise<void> {
    const owner = this.owner();
    const revision = this.revision();
    const result = await action(owner);
    if (this.owner() === owner && this.revision() === revision) { this.state.set(result); this.error.set(''); }
  }

  private validatePage(page: WidgetPageDefinition): void {
    const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
    if (!isRecord(page) || !Array.isArray(page.widgets) || !page.widgets.length) throw new VisitorWorkspaceError('invalid', 'Visitor workspace invalid');
    for (const field of ['layoutPreset', 'themePreset'] as const) {
      if (page[field] !== undefined && typeof page[field] !== 'string') throw new VisitorWorkspaceError('invalid', 'Visitor workspace invalid');
    }
    for (const field of ['layout', 'canvas', 'deviceLayouts', 'context', 'composition', 'state', 'layoutPresetOptions', 'slotAssignments', 'i18n'] as const) {
      if (page[field] !== undefined && !isRecord(page[field])) throw new VisitorWorkspaceError('invalid', 'Visitor workspace invalid');
    }
    const invalid = (): never => { throw new VisitorWorkspaceError('invalid', 'Invalid page envelope'); };
    const strings = (value: unknown): void => {
      if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) invalid();
    };
    const records = (value: unknown): Record<string, unknown>[] => {
      if (!Array.isArray(value) || value.some(item => !isRecord(item))) return invalid();
      return value as Record<string, unknown>[];
    };
    const nonemptyString = (value: unknown): void => {
      if (typeof value !== 'string' || !value.trim()) invalid();
    };
    if (page.dataSources !== undefined) {
      // The published WidgetPageDefinition contract declares an array, not a map.
      for (const source of records(page.dataSources)) {
        nonemptyString(source['id']);
        nonemptyString(source['resourcePath']);
        for (const field of ['endpointKey', 'targetStatePath', 'description']) {
          if (source[field] !== undefined && typeof source[field] !== 'string') invalid();
        }
        if (source['query'] !== undefined && !isRecord(source['query'])) invalid();
        if (source['refreshIntervalMs'] !== undefined && (typeof source['refreshIntervalMs'] !== 'number' || !Number.isFinite(source['refreshIntervalMs']))) invalid();
        if (source['autoFetch'] !== undefined && typeof source['autoFetch'] !== 'boolean') invalid();
        for (const [field, allowed] of Object.entries({ kind: ['remote-resource', 'stats-query', 'raw-http'], method: ['GET', 'POST'], errorPolicy: ['propagate', 'silent', 'fallback'] })) {
          const value = source[field];
          if (value !== undefined && (typeof value !== 'string' || !allowed.includes(value))) invalid();
        }
      }
    }
    const endpoint = (value: unknown): void => {
      if (!isRecord(value) || !isRecord(value['ref'])) return invalid();
      const ref = value['ref'];
      if (value['kind'] === 'state') {
        nonemptyString(ref['path']);
        if (ref['layer'] !== undefined && (typeof ref['layer'] !== 'string' || !['values', 'derived', 'transient'].includes(ref['layer']))) invalid();
        if (ref['writable'] !== undefined && typeof ref['writable'] !== 'boolean') invalid();
      } else if (value['kind'] === 'component-port') {
        nonemptyString(ref['widget']);
        nonemptyString(ref['port']);
        if (ref['direction'] !== 'input' && ref['direction'] !== 'output') invalid();
        for (const field of ['componentType', 'bindingPath']) {
          if (ref[field] !== undefined && typeof ref[field] !== 'string') invalid();
        }
        if (ref['nestedPath'] !== undefined) {
          for (const segment of records(ref['nestedPath'])) {
            nonemptyString(segment['kind']);
            for (const field of ['id', 'key', 'componentType']) {
              if (segment[field] !== undefined && typeof segment[field] !== 'string') invalid();
            }
            if (segment['index'] !== undefined && (typeof segment['index'] !== 'number' || !Number.isInteger(segment['index']))) invalid();
          }
        }
      } else if (value['kind'] === 'global-action') {
        nonemptyString(ref['actionId']);
      } else invalid();
    };
    if (page.composition !== undefined) {
      if (page.composition.version !== undefined && typeof page.composition.version !== 'string') invalid();
      if (page.composition.links !== undefined) {
        for (const link of records(page.composition.links)) {
          nonemptyString(link['id']);
          nonemptyString(link['intent']);
          endpoint(link['from']);
          endpoint(link['to']);
        }
      }
    }
    if (page.state !== undefined) {
      const state = page.state as Record<string, unknown>;
      const structured = ['values', 'schema', 'derived', 'transientValues'].some(key => Object.hasOwn(state, key));
      if (structured) {
        for (const key of ['values', 'schema', 'derived', 'transientValues']) {
          if (state[key] !== undefined && !isRecord(state[key])) invalid();
        }
        for (const node of Object.values((state['schema'] || {}) as Record<string, unknown>)) {
          if (!isRecord(node)) return invalid();
          if (node['tags'] !== undefined) strings(node['tags']);
        }
        for (const node of Object.values((state['derived'] || {}) as Record<string, unknown>)) {
          if (!isRecord(node) || !isRecord(node['compute'])) return invalid();
          strings(node['dependsOn']);
        }
      }
    }
    if (page.grouping !== undefined) {
      for (const group of records(page.grouping)) {
        if (typeof group['id'] !== 'string') invalid();
        if (group['widgetKeys'] !== undefined) strings(group['widgetKeys']);
        if (group['tabs'] !== undefined) {
          for (const tab of records(group['tabs'])) {
            if (typeof tab['id'] !== 'string' || typeof tab['label'] !== 'string') invalid();
            strings(tab['widgetKeys']);
          }
        }
      }
    }
    if (page.wiring !== undefined) records(page.wiring);
    if (page.slotAssignments !== undefined && Object.values(page.slotAssignments).some(value => typeof value !== 'string')) invalid();
    for (const widget of page.widgets) {
      if (!isRecord(widget) || typeof widget.key !== 'string' || !widget.key || !isRecord(widget.definition)
        || typeof widget.definition.id !== 'string' || !this.registry.get(widget.definition.id)) throw new VisitorWorkspaceError('invalid', 'Visitor workspace invalid');
      // Validate the shared envelopes; each component still owns its input schema.
      for (const field of ['inputs', 'outputs'] as const) {
        if (widget.definition[field] !== undefined && !isRecord(widget.definition[field])) invalid();
      }
      if (widget.definition.bindingOrder !== undefined) strings(widget.definition.bindingOrder);
      if (widget.shell !== undefined) {
        if (!isRecord(widget.shell)) invalid();
        for (const field of ['avatar', 'windowActions', 'appearance'] as const) {
          if (widget.shell[field] !== undefined && !isRecord(widget.shell[field])) invalid();
        }
        if (widget.shell.actions !== undefined) {
          for (const action of records(widget.shell.actions)) {
            if (typeof action['id'] !== 'string' || !action['id'].trim()) invalid();
          }
        }
      }
    }
    if (new Set(page.widgets.map((widget) => widget.key)).size !== page.widgets.length) throw new VisitorWorkspaceError('invalid', 'Visitor workspace invalid');
    // Reuse canonical composition materialization and diagnostics, not a host connection DSL.
    this.validatePresentation(page);
    const composition = new WidgetPageCompositionFactory().create(page);
    const diagnostics = this.validator.validatePage(page, { registry: this.registry, links: composition.links });
    if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) throw new VisitorWorkspaceError('invalid', 'Visitor workspace invalid');
  }
  private validatePresentation(page: WidgetPageDefinition): void {
    const invalid = (): never => { throw new VisitorWorkspaceError('invalid', 'Invalid page presentation'); };
    const record = (value: unknown): Record<string, unknown> => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
      return value as Record<string, unknown>;
    };
    const presentation = (value: unknown): void => {
      const section = record(value);
      for (const name of ['gap', 'rowUnit', 'paddingInline']) {
        if (section[name] !== undefined && typeof section[name] !== 'string') invalid();
      }
      for (const [field, allowed] of Object.entries({ orientation: ['vertical', 'columns'], mode: ['grid'], autoRows: ['fixed', 'content'], collisionPolicy: ['block', 'swap', 'push-down'] })) {
        const value = section[field];
        if (value !== undefined && (typeof value !== 'string' || !allowed.includes(value))) invalid();
      }
      if (section['columns'] !== undefined && (typeof section['columns'] !== 'number' || !Number.isInteger(section['columns']) || section['columns'] < 1)) invalid();
      if (section['breakpoints'] !== undefined) {
        for (const count of Object.values(record(section['breakpoints']))) {
          if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) invalid();
        }
      }
      if (section['items'] !== undefined) {
        for (const item of Object.values(record(section['items']))) {
          const entry = record(item);
          for (const name of ['col', 'row', 'colSpan', 'rowSpan', 'zIndex']) {
            if (entry[name] !== undefined && (typeof entry[name] !== 'number' || !Number.isFinite(entry[name]))) invalid();
          }
          if (entry['constraints'] !== undefined) {
            const constraints = record(entry['constraints']);
            for (const name of ['minHeightPx', 'maxHeightPx', 'minColSpan', 'minRowSpan', 'maxColSpan', 'maxRowSpan']) {
              if (constraints[name] !== undefined && (typeof constraints[name] !== 'number' || !Number.isFinite(constraints[name]))) invalid();
            }
            for (const name of ['lockPosition', 'lockSize']) {
              if (constraints[name] !== undefined && typeof constraints[name] !== 'boolean') invalid();
            }
          }
          if (entry['contentSize'] !== undefined && entry['contentSize'] !== 'auto') {
            const size = record(entry['contentSize']);
            if (typeof size['heightPx'] !== 'number' || !Number.isFinite(size['heightPx'])) invalid();
            if (size['offsetTopPx'] !== undefined && (typeof size['offsetTopPx'] !== 'number' || !Number.isFinite(size['offsetTopPx']))) invalid();
          }
        }
      }
    };
    if (page.layout !== undefined) presentation(page.layout);
    if (page.canvas !== undefined) presentation(page.canvas);
    if (page.deviceLayouts !== undefined) {
      for (const variant of Object.values(record(page.deviceLayouts))) {
        const device = record(variant);
        if (device['layout'] !== undefined) presentation(device['layout']);
        if (device['canvas'] !== undefined) presentation(device['canvas']);
        if (device['widgetOverrides'] !== undefined) {
          for (const override of Object.values(record(device['widgetOverrides']))) record(override);
        }
        if (device['groupingOverrides'] !== undefined) {
          if (!Array.isArray(device['groupingOverrides'])) invalid();
          for (const override of device['groupingOverrides'] as unknown[]) {
            const group = record(override);
            if (group['widgetKeys'] !== undefined && (!Array.isArray(group['widgetKeys']) || group['widgetKeys'].some(key => typeof key !== 'string'))) invalid();
            if (group['tabs'] !== undefined && (!Array.isArray(group['tabs']) || group['tabs'].some(tab => !tab || typeof tab !== 'object' || Array.isArray(tab)))) invalid();
          }
        }
      }
    }
  }

}

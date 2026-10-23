import { DestroyRef, Injectable, inject, type Provider } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  ASYNC_CONFIG_STORAGE, CONFIG_STORAGE, CONNECTION_STORAGE,
  LocalConnectionStorage, LocalStorageAsyncAdapter, LocalStorageConfigService,
} from '@praxisui/core';
import { FilterConfigService } from '@praxisui/table';
import { SettingsPanelService, providePraxisSettingsPanelBridge } from '@praxisui/settings-panel';
import { FormLayoutService } from '@praxisui/dynamic-form';
import { VisitorWorkspaceError } from '../../core/visitor-workspace.repository';
import { VisitorWorkspaceService } from '../../core/visitor-workspace.service';

/** Browser-only preference storage shared by every persistence token in this editor. */
@Injectable()
export class VisitorLocalStorage extends LocalStorageConfigService {
  private readonly workspace = inject(VisitorWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly owner = this.workspace.owner();
  private readonly revision = this.workspace.revision();
  private readonly prefix = `hero-hq:visitor-config:${encodeURIComponent(this.owner)}:${encodeURIComponent(this.route.snapshot.paramMap.get('pageId') || 'draft')}:`;
  private active = true;

  constructor() {
    super();
    this.destroyRef.onDestroy(() => { this.active = false; });
  }

  override loadConfig<T>(key: string): T | null {
    this.assertCurrent();
    let raw: string | null;
    try {
      raw = localStorage.getItem(this.prefix + key);
    } catch {
      throw new VisitorWorkspaceError('storage', 'Não foi possível ler as preferências locais.');
    }
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new VisitorWorkspaceError('corrupt', 'As preferências locais estão inválidas.');
    }
  }

  override saveConfig<T>(key: string, config: T): void {
    this.assertCurrent();
    try {
      const raw = JSON.stringify(config);
      if (raw === undefined) throw new Error('Invalid JSON document');
      // Serialization may invoke a toJSON implementation; recheck before the write.
      this.assertCurrent();
      localStorage.setItem(this.prefix + key, raw);
    } catch (error: unknown) {
      if (error instanceof VisitorWorkspaceError) throw error;
      throw new VisitorWorkspaceError('storage', 'Não foi possível salvar as preferências locais.');
    }
  }

  override clearConfig(key: string): void {
    this.assertCurrent();
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {
      throw new VisitorWorkspaceError('storage', 'Não foi possível remover as preferências locais.');
    }
  }

  override trySaveConfig<T>(key: string, config: T): boolean {
    try {
      this.saveConfig(key, config);
      return true;
    } catch {
      return false;
    }
  }

  override tryClearConfig(key: string): boolean {
    try {
      this.clearConfig(key);
      return true;
    } catch {
      return false;
    }
  }

  private assertCurrent(): void {
    if (!this.active || this.owner !== this.workspace.owner() || this.revision !== this.workspace.revision()) {
      throw new VisitorWorkspaceError('conflict', 'O contexto deste editor foi encerrado.');
    }
  }
}

// Root-scoped services capture their own injector's adapters. Reprovide each reachable
// preference facade here so filters, connections and sync consumers use this namespace too.
export const visitorLocalStorageProviders: Provider[] = [
  SettingsPanelService,
  ...providePraxisSettingsPanelBridge(),
  VisitorLocalStorage,
  { provide: LocalStorageConfigService, useExisting: VisitorLocalStorage },
  LocalStorageAsyncAdapter,
  { provide: ASYNC_CONFIG_STORAGE, useExisting: LocalStorageAsyncAdapter },
  { provide: CONFIG_STORAGE, useExisting: VisitorLocalStorage },
  FilterConfigService,
  FormLayoutService,
  LocalConnectionStorage,
  { provide: CONNECTION_STORAGE, useExisting: LocalConnectionStorage },
];

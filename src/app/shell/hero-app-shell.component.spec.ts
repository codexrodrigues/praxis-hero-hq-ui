import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import {
  ComponentMetadataRegistry,
  providePraxisRelatedResourceOutletMetadata,
} from '@praxisui/core';
import { providePraxisTabsMetadata } from '@praxisui/tabs';
import { of } from 'rxjs';
import { HeroAppShellComponent } from './hero-app-shell.component';

describe('HeroAppShellComponent', () => {
  let fixture: ComponentFixture<HeroAppShellComponent>;
  let component: HeroAppShellComponent;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroAppShellComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        providePraxisRelatedResourceOutletMetadata(),
        providePraxisTabsMetadata(),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroAppShellComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('computes live readiness percentage and DEFCON footer status from stats endpoints', () => {
    const heroesReq = httpMock.expectOne((req) =>
      req.url.endsWith('/human-resources/funcionarios/stats/group-by'),
    );
    heroesReq.flush({
      data: {
        buckets: [
          { key: true, count: 60 },
          { key: false, count: 40 },
        ],
      },
    });

    const incidentsReq = httpMock.expectOne((req) =>
      req.url.endsWith('/risk-intelligence/vw-indicadores-incidentes/stats/group-by'),
    );
    incidentsReq.flush({
      data: {
        buckets: [
          { key: 'CRITICA', count: 15 },
          { key: 'ALTA', count: 35 },
        ],
      },
    });

    expect((component as any).readinessRate()).toBe(60);
    expect((component as any).readinessLabel()).toBe('60,0%');
    expect((component as any).criticalIncidents()).toBe(15);
    expect((component as any).footerStatus().title).toContain('Defcon 4');
    expect((component as any).footerStatus().metric).toBe('60/100 Ativos · 15 Críticos');
  });

  it('filters Command Palette modules (Ctrl+K) with accent-insensitive matching and supports keyboard navigation', () => {
    const flushPendingRequests = () => {
      httpMock.match(() => true).forEach((req) => req.flush({ data: { buckets: [] } }));
    };
    flushPendingRequests();

    const navigateSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    (component as any).openSearchModal();
    expect((component as any).searchOpen()).toBeTrue();
    expect((component as any).filteredLinks().length).toBe(16);

    // Filter accent-insensitively for "missao"
    (component as any).onSearchQueryChange('missao');
    const missionMatches = (component as any).filteredLinks();
    expect(missionMatches.length).toBeGreaterThanOrEqual(2);
    expect(missionMatches[0].path).toBe('/operacoes/missoes');

    // Move selection down with ArrowDown and press Enter
    (component as any).onSearchInputKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect((component as any).selectedSearchIndex()).toBe(1);

    (component as any).onSearchInputKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(navigateSpy).toHaveBeenCalledWith(missionMatches[1].path);
    expect((component as any).searchOpen()).toBeFalse();
  });

  it('navigates to /operacoes/incidentes when clicking the critical incidents notification bell', () => {
    httpMock.match(() => true).forEach((req) => req.flush({ data: { buckets: [] } }));
    const navigateSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    (component as any).openCriticalIncidents();
    expect(navigateSpy).toHaveBeenCalledWith('/operacoes/incidentes');
  });

  it('marks DEFCON 1 modules as restricted when switching to a DEFCON 2 persona', () => {
    httpMock.match(() => true).forEach((req) => req.flush({ data: { buckets: [] } }));

    const payrollItem = (component as any)
      .allCommandItems
      .find((item: any) => item.path === '/rh/folha-pagamento');
    expect(payrollItem).toBeDefined();

    // Nick Fury (DEFCON 1) is authorized
    (component as any).selectPersona('nick.fury');
    httpMock.match(() => true).forEach((req) => req.flush({ data: { buckets: [] } }));
    expect((component as any).isItemRestricted(payrollItem)).toBeFalse();

    // Tony Stark (DEFCON 2) is restricted on DEFCON 1 items
    (component as any).selectPersona('tony.stark');
    httpMock.match(() => true).forEach((req) => req.flush({ data: { buckets: [] } }));
    expect((component as any).isItemRestricted(payrollItem)).toBeTrue();
  });

  it('opens the Command Palette immediately when typing in the topbar search input', () => {
    httpMock.match(() => true).forEach((req) => req.flush({ data: { buckets: [] } }));

    expect((component as any).searchOpen()).toBeFalse();
    (component as any).onTopbarSearchInput('   ');
    expect((component as any).searchOpen()).toBeFalse();

    (component as any).onTopbarSearchInput('folha');
    expect((component as any).searchOpen()).toBeTrue();
    expect((component as any).searchQuery()).toBe('folha');
    expect((component as any).filteredLinks()[0].path).toBe('/rh/folha-pagamento');
  });

  it('registers praxis-tabs, praxis-related-resource-outlet and full widget catalog in ComponentMetadataRegistry for Employee 360 authoring and runtime', () => {
    httpMock.match(() => true).forEach((req) => req.flush({ data: { buckets: [] } }));

    const registry = TestBed.inject(ComponentMetadataRegistry);
    const tabsMeta = registry.get('praxis-tabs');
    const outletMeta = registry.get('praxis-related-resource-outlet');
    const expansionMeta = registry.get('praxis-expansion');
    const stepperMeta = registry.get('praxis-stepper');
    const filesUploadMeta = registry.get('praxis-files-upload');
    const filterFormMeta = registry.get('praxis-filter-form');

    expect(tabsMeta).toBeDefined();
    expect(tabsMeta?.component).toBeDefined();
    expect(tabsMeta?.configEditor?.component).toBeDefined();

    expect(outletMeta).toBeDefined();
    expect(outletMeta?.component).toBeDefined();
    expect(outletMeta?.configEditor?.component).toBeDefined();
    expect(outletMeta?.ports?.some((p) => p.id === 'applyContext' && p.direction === 'input')).toBeTrue();

    expect(expansionMeta).toBeDefined();
    expect(stepperMeta).toBeDefined();
    expect(filesUploadMeta).toBeDefined();
    expect(filterFormMeta).toBeDefined();
  });
});


